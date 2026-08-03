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

  const { data, count, error: dbError } = await supabase
    .from("interview_requests")
    .select(`
      *,
      worker:worker_id(id, display_name, avatar_url),
      business:business_id(id, display_name)
    `, { count: "exact" })
    .order("scheduled_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  let filtered = data || []
  if (search) {
    const s = search.toLowerCase()
    filtered = filtered.filter((i: any) =>
      i.worker?.display_name?.toLowerCase().includes(s) ||
      i.business?.display_name?.toLowerCase().includes(s)
    )
  }

  return NextResponse.json({ data: filtered, total: count ?? 0, page, limit })
}

export async function DELETE(req: NextRequest) {
  const { error, supabase } = await verifyAdmin()
  if (error || !supabase) return NextResponse.json({ error }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

  const { error: dbError } = await supabase.from("interview_requests").delete().eq("id", id)
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
