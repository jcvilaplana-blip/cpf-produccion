export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// GET public profile by ID - no auth required
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) {
    return NextResponse.json({ error: "Server config error" }, { status: 500 })
  }

  const supabase = createClient(url, key)

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .eq("is_active", true)
    .single()

  if (error || !profile) {
    return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 })
  }

  // Remove sensitive fields
  const { is_admin, ...safeProfile } = profile

  return NextResponse.json({ data: safeProfile })
}
