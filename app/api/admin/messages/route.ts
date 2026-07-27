export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { verifyAdmin } from "@/lib/admin-auth"


export async function GET(req: NextRequest) {
  const { error, supabase } = await verifyAdmin()
  if (error || !supabase) return NextResponse.json({ error }, { status: 401 })

  const url = req.nextUrl
  const page = parseInt(url.searchParams.get("page") || "1")
  const limit = parseInt(url.searchParams.get("limit") || "20")
  const offset = (page - 1) * limit

  const { data, count, error: dbError } = await supabase
    .from("conversations")
    .select("*", { count: "exact" })
    .order("last_message_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  // participant_1/2 reference auth.users, not public.profiles - no FK
  // PostgREST can embed through, so join manually.
  const participantIds = [...new Set((data || []).flatMap((c: any) => [c.participant_1, c.participant_2]).filter(Boolean))]
  let profileMap = new Map<string, { display_name: string; avatar_url: string | null }>()
  if (participantIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", participantIds)
    profileMap = new Map((profiles || []).map((p: any) => [p.id, { display_name: p.display_name, avatar_url: p.avatar_url }]))
  }
  const enriched = (data || []).map((c: any) => ({
    ...c,
    p1: profileMap.get(c.participant_1) || null,
    p2: profileMap.get(c.participant_2) || null,
  }))

  return NextResponse.json({ data: enriched, total: count ?? 0, page, limit })
}

export async function DELETE(req: NextRequest) {
  const { error, supabase } = await verifyAdmin()
  if (error || !supabase) return NextResponse.json({ error }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

  await supabase.from("messages").delete().eq("conversation_id", id)
  const { error: dbError } = await supabase.from("conversations").delete().eq("id", id)
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
