export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { verifyAdmin } from "@/lib/admin-auth"


export async function GET(req: NextRequest) {
  const { error, supabase } = await verifyAdmin()
  if (error || !supabase) return NextResponse.json({ error }, { status: 401 })

  const url = req.nextUrl
  const page = parseInt(url.searchParams.get("page") || "1")
  const limit = parseInt(url.searchParams.get("limit") || "20")
  const search = url.searchParams.get("search") || ""
  const userType = url.searchParams.get("user_type") || ""
  const offset = (page - 1) * limit

  let query = supabase
    .from("profiles")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (userType) query = query.eq("user_type", userType)
  if (search) query = query.ilike("display_name", `%${search}%`)

  const { data, count, error: dbError } = await query
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  return NextResponse.json({ data, total: count ?? 0, page, limit })
}

export async function POST(req: NextRequest) {
  const { error, supabase } = await verifyAdmin()
  if (error || !supabase) return NextResponse.json({ error }, { status: 401 })

  const body = await req.json()
  const { email, password, ...profileFields } = body

  // Create auth user first via Supabase admin
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: password || "Temp1234!",
    email_confirm: true,
  })
  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 })

  // Insert profile
  const { data, error: dbError } = await supabase
    .from("profiles")
    .upsert({ id: authData.user.id, ...profileFields, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .select()
    .single()
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  return NextResponse.json({ data })
}

export async function PATCH(req: NextRequest) {
  const { error, supabase } = await verifyAdmin()
  if (error || !supabase) return NextResponse.json({ error }, { status: 401 })

  const body = await req.json()
  const { id, password, ...updates } = body
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

  // Update password if provided (and not empty)
  if (password && password.trim().length > 0) {
    const { error: pwError } = await supabase.auth.admin.updateUserById(id, {
      password: password.trim()
    })
    if (pwError) {
      return NextResponse.json({ error: "Error al actualizar la contraseña: " + pwError.message }, { status: 500 })
    }
  }

  updates.updated_at = new Date().toISOString()
  const { data, error: dbError } = await supabase.from("profiles").update(updates).eq("id", id).select().single()
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  return NextResponse.json({ data })
}

export async function DELETE(req: NextRequest) {
  const { error, supabase } = await verifyAdmin()
  if (error || !supabase) return NextResponse.json({ error }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

  const { error: dbError } = await supabase.from("profiles").delete().eq("id", id)
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
