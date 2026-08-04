export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { resolveEmailByPhone } from "@/lib/phone-lookup"

// Lets login accept a phone number instead of email: the phone is never a
// real Supabase auth identity (only Firebase-verified as a data point at
// signup), so this resolves it to the account's email server-side, then the
// client signs in with that email + the password as normal. Always returns
// {email: string|null} - the UI must show the same generic "credenciales
// incorrectas" whether the phone wasn't found or the password was wrong,
// so this endpoint alone doesn't let someone enumerate registered numbers
// from the login screen.
export async function POST(request: Request) {
  const { phone } = await request.json()
  if (!phone || typeof phone !== "string") {
    return NextResponse.json({ email: null })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    return NextResponse.json({ error: "Server config error" }, { status: 500 })
  }

  const supabase = createClient(url, key)
  const email = await resolveEmailByPhone(supabase, phone)
  return NextResponse.json({ email })
}
