import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const origin = process.env.NEXT_PUBLIC_APP_URL || "https://camareroporfavor.com"

  try {
    const token_hash = url.searchParams.get("token_hash")
    const type = url.searchParams.get("type")

    if (!token_hash || !type) {
      return NextResponse.redirect(`${origin}/auth/error?error=invalid_link`)
    }

    const supabase = await createClient()

    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as any,
    })

    if (error) {
      return NextResponse.redirect(`${origin}/auth/error?error=${encodeURIComponent(error.message)}`)
    }

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(`${origin}/auth/error`)
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("user_type, is_admin, rol, profile_completed")
      .eq("id", user.id)
      .single()

    if (profile?.is_admin || profile?.rol === 1) {
      return NextResponse.redirect(`${origin}/admin`)
    }

    if (!profile?.profile_completed) {
      return NextResponse.redirect(`${origin}/create-profile`)
    }

    if (profile?.user_type === "business" || profile?.rol === 3) {
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("status")
        .eq("user_id", user.id)
        .eq("status", "active")
        .single()
      return NextResponse.redirect(subscription ? `${origin}/business-dashboard` : `${origin}/subscribe?verified=1`)
    }

    return NextResponse.redirect(`${origin}/dashboard`)
  } catch (err) {
    console.error("auth/confirm error:", err)
    return NextResponse.redirect(`${origin}/auth/error?error=unexpected_error`)
  }
}
