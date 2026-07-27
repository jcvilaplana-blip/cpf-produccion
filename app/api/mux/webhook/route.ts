export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"

// Use service role for webhook (no user session available)
function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type, data } = body

    console.log("[Mux Webhook] Event:", type)

    const supabase = getServiceClient()

    switch (type) {
      // Upload completed - asset is being created
      case "video.upload.asset_created": {
        const uploadId = data.id
        const assetId = data.asset_id

        // Find profile with this upload ID and update with asset ID
        // Check profiles first
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("mux_upload_id", uploadId)
          .single()

        if (profile) {
          await supabase
            .from("profiles")
            .update({
              mux_asset_id: assetId,
              video_status: "processing",
            })
            .eq("id", profile.id)
        } else {
          // Check business_profiles
          const { data: business } = await supabase
            .from("business_profiles")
            .select("id")
            .eq("mux_upload_id", uploadId)
            .single()

          if (business) {
            await supabase
              .from("business_profiles")
              .update({
                mux_asset_id: assetId,
                video_status: "processing",
              })
              .eq("id", business.id)
          }
        }
        break
      }

      // Asset is ready to stream
      case "video.asset.ready": {
        const assetId = data.id
        const playbackId = data.playback_ids?.[0]?.id

        if (!playbackId) break

        const streamUrl = `https://stream.mux.com/${playbackId}.m3u8`

        // Update profiles
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("mux_asset_id", assetId)
          .single()

        if (profile) {
          await supabase
            .from("profiles")
            .update({
              mux_playback_id: playbackId,
              video_status: "ready",
            })
            .eq("id", profile.id)
        } else {
          const { data: business } = await supabase
            .from("business_profiles")
            .select("id")
            .eq("mux_asset_id", assetId)
            .single()

          if (business) {
            await supabase
              .from("business_profiles")
              .update({
                mux_playback_id: playbackId,
                video_url: streamUrl,
                video_status: "ready",
              })
              .eq("id", business.id)
          }
        }
        break
      }

      // Asset errored during processing
      case "video.asset.errored": {
        const assetId = data.id

        // Update profiles
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("mux_asset_id", assetId)
          .single()

        if (profile) {
          await supabase
            .from("profiles")
            .update({ video_status: "error" })
            .eq("id", profile.id)
        } else {
          const { data: business } = await supabase
            .from("business_profiles")
            .select("id")
            .eq("mux_asset_id", assetId)
            .single()

          if (business) {
            await supabase
              .from("business_profiles")
              .update({ video_status: "error" })
              .eq("id", business.id)
          }
        }
        break
      }

      // Asset deleted
      case "video.asset.deleted": {
        const assetId = data.id

        await supabase
          .from("profiles")
          .update({
            mux_asset_id: null,
            mux_playback_id: null,
            mux_upload_id: null,
            video_status: "none",
          })
          .eq("mux_asset_id", assetId)

        await supabase
          .from("business_profiles")
          .update({
            mux_asset_id: null,
            mux_playback_id: null,
            mux_upload_id: null,
            video_url: null,
            video_status: "none",
          })
          .eq("mux_asset_id", assetId)

        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[Mux Webhook] Error:", error)
    return NextResponse.json({ error: "Webhook error" }, { status: 500 })
  }
}
