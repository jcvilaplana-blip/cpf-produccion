export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { verifyAdmin } from "@/lib/admin-auth"


export async function GET(req: NextRequest) {
  const { error, supabase } = await verifyAdmin()
  if (error || !supabase) return NextResponse.json({ error }, { status: 401 })

  const url = req.nextUrl
  const search = url.searchParams.get("search") || ""
  const status = url.searchParams.get("status") || ""
  const page = parseInt(url.searchParams.get("page") || "1")
  const limit = parseInt(url.searchParams.get("limit") || "20")
  const offset = (page - 1) * limit

  // Get profiles that have any video (mux or legacy)
  let query = supabase
    .from("profiles")
    .select("id, display_name, avatar_url, mux_asset_id, mux_playback_id, video_status, user_type, is_active, created_at", { count: "exact" })
    .not("mux_playback_id", "is", null)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (search) query = query.ilike("display_name", `%${search}%`)
  if (status) query = query.eq("video_status", status)

  const { data: profileVideos, count: profileCount, error: pErr } = await query

  // Also get business videos
  let bQuery = supabase
    .from("business_profiles")
    .select("id, company_name, company_logo_url, mux_asset_id, mux_playback_id, video_status, created_at", { count: "exact" })
    .not("mux_playback_id", "is", null)
    .order("created_at", { ascending: false })

  if (search) bQuery = bQuery.ilike("company_name", `%${search}%`)
  if (status) bQuery = bQuery.eq("video_status", status)

  const { data: businessVideos, count: businessCount, error: bErr } = await bQuery

  if (pErr || bErr) return NextResponse.json({ error: pErr?.message || bErr?.message }, { status: 500 })

  // Combine into unified video list
  const videos = [
    ...(profileVideos || []).map((p: any) => ({
      id: p.id,
      name: p.display_name,
      avatar: p.avatar_url,
      mux_asset_id: p.mux_asset_id,
      mux_playback_id: p.mux_playback_id,
      video_status: p.video_status || "ready",
      type: "candidate",
      is_active: p.is_active,
      created_at: p.created_at,
    })),
    ...(businessVideos || []).map((b: any) => ({
      id: b.id,
      name: b.company_name,
      avatar: b.company_logo_url,
      mux_asset_id: b.mux_asset_id,
      mux_playback_id: b.mux_playback_id,
      video_status: b.video_status || "ready",
      type: "business",
      is_active: true,
      created_at: b.created_at,
    })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  // Stats
  const totalMux = videos.filter(v => v.mux_playback_id).length
  const totalLegacy = 0
  const totalReady = videos.filter(v => v.video_status === "ready").length
  const totalProcessing = videos.filter(v => v.video_status === "preparing" || v.video_status === "processing").length
  const totalErrored = videos.filter(v => v.video_status === "errored").length

  return NextResponse.json({
    data: videos,
    total: (profileCount ?? 0) + (businessCount ?? 0),
    stats: { totalMux, totalLegacy, totalReady, totalProcessing, totalErrored },
    page,
    limit,
  })
}

export async function DELETE(req: NextRequest) {
  const { error, supabase } = await verifyAdmin()
  if (error || !supabase) return NextResponse.json({ error }, { status: 401 })

  const { id, type, mux_asset_id } = await req.json()
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

  // Delete from Mux if asset exists
  if (mux_asset_id && process.env.MUX_TOKEN_ID && process.env.MUX_TOKEN_SECRET) {
    try {
      const auth = Buffer.from(`${process.env.MUX_TOKEN_ID}:${process.env.MUX_TOKEN_SECRET}`).toString("base64")
      await fetch(`https://api.mux.com/video/v1/assets/${mux_asset_id}`, {
        method: "DELETE",
        headers: { Authorization: `Basic ${auth}` },
      })
    } catch (e) {
      console.error("Failed to delete Mux asset:", e)
    }
  }

  // Clear Mux video fields in DB
  const table = type === "business" ? "business_profiles" : "profiles"

  const { error: dbError } = await supabase
    .from(table)
    .update({
      mux_asset_id: null,
      mux_playback_id: null,
      mux_upload_id: null,
      video_status: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
