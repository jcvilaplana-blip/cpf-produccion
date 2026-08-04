export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { verifyAdmin } from "@/lib/admin-auth"

// Read-only ledger + referral stats for the gamification engine.
export async function GET(req: NextRequest) {
  const { error, supabase } = await verifyAdmin()
  if (error || !supabase) return NextResponse.json({ error }, { status: 401 })

  const url = req.nextUrl
  const page = parseInt(url.searchParams.get("page") || "1")
  const limit = parseInt(url.searchParams.get("limit") || "30")
  const search = url.searchParams.get("search") || ""
  const offset = (page - 1) * limit

  let query = supabase
    .from("points_ledger")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (search) {
    const { data: matchingProfiles } = await supabase.from("profiles").select("id").ilike("display_name", `%${search}%`)
    const ids = (matchingProfiles || []).map((p: any) => p.id)
    if (ids.length === 0) return NextResponse.json({ data: [], total: 0, page, limit })
    query = query.in("user_id", ids)
  }

  const { data, count, error: dbError } = await query
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  const userIds = [...new Set((data || []).map((l: any) => l.user_id))]
  let nameMap = new Map<string, string>()
  if (userIds.length > 0) {
    const { data: profiles } = await supabase.from("profiles").select("id, display_name").in("id", userIds)
    nameMap = new Map((profiles || []).map((p: any) => [p.id, p.display_name]))
  }

  const enriched = (data || []).map((l: any) => ({ ...l, user_display_name: nameMap.get(l.user_id) || "Usuario desconocido" }))

  const { count: totalReferrals } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .not("referred_by", "is", null)
    .not("profile_completed_at", "is", null)

  return NextResponse.json({ data: enriched, total: count ?? 0, page, limit, completedReferrals: totalReferrals ?? 0 })
}
