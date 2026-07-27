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
  const isFlash = url.searchParams.get("is_flash") || ""
  const isActive = url.searchParams.get("is_active") || ""
  const offset = (page - 1) * limit

  let query = supabase
    .from("jobs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (isFlash === "true") query = query.eq("is_flash", true)
  if (isFlash === "false") query = query.eq("is_flash", false)
  if (isActive === "true") query = query.eq("is_active", true)
  if (isActive === "false") query = query.eq("is_active", false)
  if (search) query = query.ilike("title", `%${search}%`)

  const { data, count, error: dbError } = await query
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  // jobs.business_id references profiles(id), not business_profiles(id)
  // directly - there's no FK PostgREST can auto-embed through, so join
  // business_profiles manually.
  const businessIds = [...new Set((data || []).map((j: any) => j.business_id).filter(Boolean))]
  let businessMap = new Map<string, { company_name: string; company_logo_url: string | null }>()
  if (businessIds.length > 0) {
    const { data: businesses } = await supabase
      .from("business_profiles")
      .select("id, company_name, company_logo_url")
      .in("id", businessIds)
    businessMap = new Map((businesses || []).map((b: any) => [b.id, { company_name: b.company_name, company_logo_url: b.company_logo_url }]))
  }
  const enriched = (data || []).map((j: any) => ({ ...j, business_profiles: businessMap.get(j.business_id) || null }))

  return NextResponse.json({ data: enriched, total: count ?? 0, page, limit })
}

export async function POST(req: NextRequest) {
  const { error, supabase } = await verifyAdmin()
  if (error || !supabase) return NextResponse.json({ error }, { status: 401 })

  const body = await req.json()
  delete body.business_profiles
  body.created_at = new Date().toISOString()
  body.updated_at = new Date().toISOString()

  const { data, error: dbError } = await supabase.from("jobs").insert(body).select().single()
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  return NextResponse.json({ data })
}

export async function PATCH(req: NextRequest) {
  const { error, supabase } = await verifyAdmin()
  if (error || !supabase) return NextResponse.json({ error }, { status: 401 })

  const body = await req.json()
  const { id, ...updates } = body
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

  delete updates.business_profiles
  updates.updated_at = new Date().toISOString()
  const { data, error: dbError } = await supabase.from("jobs").update(updates).eq("id", id).select().single()
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  return NextResponse.json({ data })
}

export async function DELETE(req: NextRequest) {
  const { error, supabase } = await verifyAdmin()
  if (error || !supabase) return NextResponse.json({ error }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

  const { error: dbError } = await supabase.from("jobs").delete().eq("id", id)
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
