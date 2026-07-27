export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { verifyAdmin } from "@/lib/admin-auth"


export async function GET(req: NextRequest) {
  const { error, supabase } = await verifyAdmin()
  if (error || !supabase) return NextResponse.json({ error }, { status: 401 })

  const url = req.nextUrl
  const search = url.searchParams.get("search") || ""
  const page = parseInt(url.searchParams.get("page") || "1")
  const limit = parseInt(url.searchParams.get("limit") || "20")
  const offset = (page - 1) * limit

  let query = supabase
    .from("ratings")
    .select(`
      *,
      rater:from_user_id(id, display_name, avatar_url),
      rated:to_user_id(id, display_name, avatar_url)
    `, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  const { data, count, error: dbError } = await query

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  // Filter by search on client side (since we need joined data)
  let filtered = data || []
  if (search) {
    const s = search.toLowerCase()
    filtered = filtered.filter((r: any) =>
      r.rater?.display_name?.toLowerCase().includes(s) ||
      r.rated?.display_name?.toLowerCase().includes(s) ||
      r.comment?.toLowerCase().includes(s)
    )
  }

  return NextResponse.json({ data: filtered, total: count ?? 0, page, limit })
}

export async function PATCH(req: NextRequest) {
  const { error, supabase } = await verifyAdmin()
  if (error || !supabase) return NextResponse.json({ error }, { status: 401 })

  const body = await req.json()
  const { id, ...updates } = body
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

  // Only allow updating score and comment
  const allowed: any = {}
  if (updates.score !== undefined) allowed.score = updates.score
  if (updates.comment !== undefined) allowed.comment = updates.comment

  const { data, error: dbError } = await supabase.from("ratings").update(allowed).eq("id", id).select().single()
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  return NextResponse.json({ data })
}

export async function DELETE(req: NextRequest) {
  const { error, supabase } = await verifyAdmin()
  if (error || !supabase) return NextResponse.json({ error }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

  const { error: dbError } = await supabase.from("ratings").delete().eq("id", id)
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
