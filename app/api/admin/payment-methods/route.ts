export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { verifyAdmin } from "@/lib/admin-auth"

export async function GET() {
  const { supabase, error } = await verifyAdmin()
  if (error || !supabase) return NextResponse.json({ error }, { status: 401 })
  const { data, error: e } = await supabase.from("payment_methods").select("*").order("sort_order")
  if (e) return NextResponse.json({ error: e.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const { supabase, error } = await verifyAdmin()
  if (error || !supabase) return NextResponse.json({ error }, { status: 401 })
  const body = await req.json()
  const { data, error: e } = await supabase.from("payment_methods").insert({
    provider: body.provider, display_name: body.display_name,
    description: body.description, is_active: body.is_active ?? true,
    config: body.config || {}, logo_url: body.logo_url, sort_order: body.sort_order || 0,
  }).select().single()
  if (e) return NextResponse.json({ error: e.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function PATCH(req: NextRequest) {
  const { supabase, error } = await verifyAdmin()
  if (error || !supabase) return NextResponse.json({ error }, { status: 401 })
  const body = await req.json()
  const { id, ...updates } = body
  updates.updated_at = new Date().toISOString()
  const { error: e } = await supabase.from("payment_methods").update(updates).eq("id", id)
  if (e) return NextResponse.json({ error: e.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const { supabase, error } = await verifyAdmin()
  if (error || !supabase) return NextResponse.json({ error }, { status: 401 })
  const { id } = await req.json()
  const { error: e } = await supabase.from("payment_methods").delete().eq("id", id)
  if (e) return NextResponse.json({ error: e.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
