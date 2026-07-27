export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  // RLS on public.notifications already scopes rows to what this user may see
  const { data: notifications, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: reads } = await supabase
    .from("notification_reads")
    .select("notification_id")
    .eq("user_id", user.id)

  const readIds = new Set((reads || []).map((r: any) => r.notification_id))

  const enriched = (notifications || []).map((n: any) => ({
    ...n,
    is_read: readIds.has(n.id),
  }))

  return NextResponse.json({ data: enriched })
}
