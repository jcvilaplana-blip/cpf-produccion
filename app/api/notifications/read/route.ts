export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const { notification_id } = await req.json()
  if (!notification_id) return NextResponse.json({ error: "notification_id required" }, { status: 400 })

  const { error } = await supabase
    .from("notification_reads")
    .upsert({ notification_id, user_id: user.id }, { onConflict: "notification_id,user_id" })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
