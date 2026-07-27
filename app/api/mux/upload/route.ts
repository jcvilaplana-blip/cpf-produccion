export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

function getMux() {
  const Mux = require("@mux/mux-node").default
  return new Mux({
    tokenId: process.env.MUX_TOKEN_ID || "",
    tokenSecret: process.env.MUX_TOKEN_SECRET || "",
  })
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { profileType = "worker", targetUserId } = await request.json()

    // Admins can upload a video on behalf of another profile (from the admin
    // panel). Only allow this after confirming the caller is actually an
    // admin - otherwise a regular user could overwrite someone else's video.
    let ownerId = user.id
    if (targetUserId && targetUserId !== user.id) {
      const { data: callerProfile } = await supabase
        .from("profiles")
        .select("is_admin, rol")
        .eq("id", user.id)
        .single()
      const isAdmin = callerProfile?.is_admin || callerProfile?.rol === 1
      if (!isAdmin) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 })
      }
      ownerId = targetUserId
    }

    // Create a Mux direct upload - video goes directly from browser to Mux
    const upload = await getMux().video.uploads.create({
      cors_origin: "*",
      new_asset_settings: {
        playback_policy: ["public"],
        encoding_tier: "baseline",
        max_resolution_tier: "1080p",
      },
    })

    // Save the upload ID to the target profile so we can link it later
    const table = profileType === "business" ? "business_profiles" : "profiles"

    await supabase
      .from(table)
      .update({
        mux_upload_id: upload.id,
        video_status: "uploading",
      })
      .eq("id", ownerId)

    return NextResponse.json({
      uploadUrl: upload.url,
      uploadId: upload.id,
    })
  } catch (error) {
    console.error("[Mux] Upload creation error:", error)
    return NextResponse.json({ error: "Error al crear la subida de video" }, { status: 500 })
  }
}
