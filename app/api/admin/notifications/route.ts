export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { verifyAdmin } from "@/lib/admin-auth"

const VALID_SCOPES = ["all", "candidates", "businesses", "user"]
const VALID_TYPES = ["oferta", "aviso", "otro"]

export async function GET(req: NextRequest) {
  const { error, supabase } = await verifyAdmin()
  if (error || !supabase) return NextResponse.json({ error }, { status: 401 })

  const url = req.nextUrl
  const page = parseInt(url.searchParams.get("page") || "1")
  const limit = parseInt(url.searchParams.get("limit") || "20")
  const offset = (page - 1) * limit

  const { data, count, error: dbError } = await supabase
    .from("notifications")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  const targetIds = [...new Set((data || []).map((n: any) => n.target_user_id).filter(Boolean))]
  let targetMap = new Map<string, { display_name: string }>()
  if (targetIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", targetIds)
    targetMap = new Map((profiles || []).map((p: any) => [p.id, { display_name: p.display_name }]))
  }
  const enriched = (data || []).map((n: any) => ({
    ...n,
    target_user: n.target_user_id ? targetMap.get(n.target_user_id) || null : null,
  }))

  return NextResponse.json({ data: enriched, total: count ?? 0, page, limit })
}

export async function POST(req: NextRequest) {
  const { error, supabase, user } = await verifyAdmin()
  if (error || !supabase || !user) return NextResponse.json({ error }, { status: 401 })

  const body = await req.json()
  const { title, body: message, type, target_scope, target_user_id, link } = body

  if (!title || !message) return NextResponse.json({ error: "Título y mensaje son obligatorios" }, { status: 400 })
  if (!VALID_TYPES.includes(type)) return NextResponse.json({ error: "Tipo inválido" }, { status: 400 })
  if (!VALID_SCOPES.includes(target_scope)) return NextResponse.json({ error: "Destino inválido" }, { status: 400 })
  if (target_scope === "user" && !target_user_id) {
    return NextResponse.json({ error: "Debes seleccionar un usuario" }, { status: 400 })
  }

  const { data, error: dbError } = await supabase
    .from("notifications")
    .insert({
      title,
      body: message,
      type,
      target_scope,
      target_user_id: target_scope === "user" ? target_user_id : null,
      link: link || null,
      created_by: user.id,
    })
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  return NextResponse.json({ data })
}

export async function DELETE(req: NextRequest) {
  const { error, supabase } = await verifyAdmin()
  if (error || !supabase) return NextResponse.json({ error }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

  const { error: dbError } = await supabase.from("notifications").delete().eq("id", id)
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
