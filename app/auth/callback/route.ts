import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const token_hash = requestUrl.searchParams.get("token_hash")
  const type = requestUrl.searchParams.get("type")
  const error = requestUrl.searchParams.get("error")
  const errorDescription = requestUrl.searchParams.get("error_description")

  const origin = process.env.NEXT_PUBLIC_APP_URL || requestUrl.origin

  if (error) {
    console.error("Auth callback error:", error, errorDescription)
    return NextResponse.redirect(`${origin}/auth/error?error=${encodeURIComponent(error)}`)
  }

  const supabase = await createClient()

  // Handle email verification via token_hash (PKCE flow from email link)
  if (token_hash && type) {
    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as any,
    })
    if (verifyError) {
      console.error("OTP verify error:", verifyError.message)
      return NextResponse.redirect(`${origin}/auth/error?error=${encodeURIComponent(verifyError.message)}`)
    }
  } else if (code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    if (exchangeError) {
      console.error("Session exchange error:", exchangeError.message)
      return NextResponse.redirect(`${origin}/auth/error?error=${encodeURIComponent(exchangeError.message)}`)
    }
  } else {
    return NextResponse.redirect(`${origin}/auth/error`)
  }

  // Get user after verification
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(`${origin}/auth/error`)
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("user_type, is_admin, rol, profile_completed")
    .eq("id", user.id)
    .single()

  if (profile?.is_admin || profile?.rol === 1 || profile?.user_type === "admin") {
    return NextResponse.redirect(`${origin}/admin`)
  }

  if (!profile?.profile_completed) {
    return NextResponse.redirect(`${origin}/create-profile`)
  }

  if (profile?.user_type === "business" || profile?.rol === 3) {
    // Check if business has active subscription
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("status")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single()

    if (!subscription) {
      return NextResponse.redirect(`${origin}/subscribe?verified=1`)
    }
    return NextResponse.redirect(`${origin}/business-dashboard`)
  }

  return NextResponse.redirect(`${origin}/dashboard`)
}
