export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { SupabaseClient } from "@supabase/supabase-js"

function getMux() {
  const Mux = require("@mux/mux-node").default
  return new Mux({
    tokenId: process.env.MUX_TOKEN_ID || "",
    tokenSecret: process.env.MUX_TOKEN_SECRET || "",
  })
}

// Resolve which profile id this request should act on: the caller's own,
// or - only for admins - another user's (used by the admin panel).
async function resolveOwnerId(supabase: SupabaseClient, callerId: string, requestedUserId: string | null) {
  if (!requestedUserId || requestedUserId === callerId) return callerId

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("is_admin, rol")
    .eq("id", callerId)
    .single()
  const isAdmin = callerProfile?.is_admin || callerProfile?.rol === 1
  return isAdmin ? requestedUserId : callerId
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const profileType = searchParams.get("type") || "worker"
    const ownerId = await resolveOwnerId(supabase, user.id, searchParams.get("userId"))

    const table = profileType === "business" ? "business_profiles" : "profiles"

    const { data: profile } = await supabase
      .from(table)
      .select("mux_asset_id, mux_playback_id, mux_upload_id, video_status")
      .eq("id", ownerId)
      .single()

    if (!profile) {
      return NextResponse.json({ status: "none" })
    }

    // If we have a playback ID, video is ready
    if (profile.mux_playback_id) {
      return NextResponse.json({
        status: "ready",
        playbackId: profile.mux_playback_id,
        thumbnailUrl: `https://image.mux.com/${profile.mux_playback_id}/thumbnail.webp?width=480&height=854`,
      })
    }

    // If we have an upload ID but no asset yet, check with Mux
    if (profile.mux_upload_id && profile.video_status === "uploading") {
      try {
        const upload = await getMux().video.uploads.retrieve(profile.mux_upload_id)
        if (upload.asset_id) {
          // Upload finished, asset is being processed
          await supabase
            .from(table)
            .update({
              mux_asset_id: upload.asset_id,
              video_status: "processing",
            })
            .eq("id", ownerId)

          return NextResponse.json({ status: "processing" })
        }
        return NextResponse.json({ status: "uploading" })
      } catch {
        return NextResponse.json({ status: profile.video_status || "none" })
      }
    }

    // If the asset is still "processing", ask Mux directly instead of only
    // waiting for the webhook (which may not be registered/reachable) -
    // this is what unblocks the infinite "procesando video" loop.
    if (profile.mux_asset_id && profile.video_status === "processing") {
      try {
        const asset = await getMux().video.assets.retrieve(profile.mux_asset_id)
        if (asset.status === "ready" && asset.playback_ids?.[0]?.id) {
          const playbackId = asset.playback_ids[0].id
          await supabase
            .from(table)
            .update({ mux_playback_id: playbackId, video_status: "ready" })
            .eq("id", ownerId)

          return NextResponse.json({
            status: "ready",
            playbackId,
            thumbnailUrl: `https://image.mux.com/${playbackId}/thumbnail.webp?width=480&height=854`,
          })
        }
        if (asset.status === "errored") {
          await supabase.from(table).update({ video_status: "error" }).eq("id", ownerId)
          return NextResponse.json({ status: "error" })
        }
        return NextResponse.json({ status: "processing" })
      } catch {
        return NextResponse.json({ status: profile.video_status || "none" })
      }
    }

    return NextResponse.json({ status: profile.video_status || "none" })
  } catch (error) {
    console.error("[Mux] Status check error:", error)
    return NextResponse.json({ error: "Error al verificar estado" }, { status: 500 })
  }
}

// DELETE: Remove video from Mux and profile
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const profileType = searchParams.get("type") || "worker"
    const ownerId = await resolveOwnerId(supabase, user.id, searchParams.get("userId"))
    const table = profileType === "business" ? "business_profiles" : "profiles"

    const { data: profile } = await supabase
      .from(table)
      .select("mux_asset_id")
      .eq("id", ownerId)
      .single()

    // Delete from Mux if asset exists
    if (profile?.mux_asset_id) {
      try {
        await getMux().video.assets.delete(profile.mux_asset_id)
      } catch (e) {
        console.error("[Mux] Error deleting asset:", e)
      }
    }

    // Clear profile Mux fields
    await supabase
      .from(table)
      .update({
        mux_asset_id: null,
        mux_playback_id: null,
        mux_upload_id: null,
        video_status: "none",
      })
      .eq("id", ownerId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Mux] Delete error:", error)
    return NextResponse.json({ error: "Error al eliminar video" }, { status: 500 })
  }
}
