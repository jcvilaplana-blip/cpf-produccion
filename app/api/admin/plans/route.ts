export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { verifyAdmin } from "@/lib/admin-auth"

export async function GET() {
  const { supabase, error } = await verifyAdmin()
  if (error || !supabase) return NextResponse.json({ error }, { status: 401 })
  const { data, error: e } = await supabase.from("subscription_plans").select("*").order("sort_order")
  if (e) return NextResponse.json({ error: e.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const { supabase, error } = await verifyAdmin()
  if (error || !supabase) return NextResponse.json({ error }, { status: 401 })
  const body = await req.json()
  const { data, error: e } = await supabase.from("subscription_plans").insert({
    slug: body.slug, name: body.name, description: body.description,
    price_monthly: body.price_monthly || 0, price_yearly: body.price_yearly,
    currency: body.currency || "EUR", features: body.features || [],
    max_jobs: body.max_jobs, max_flash: body.max_flash, max_candidates: body.max_candidates,
    video_upload: body.video_upload ?? false, priority_support: body.priority_support ?? false,
    highlighted_profile: body.highlighted_profile ?? false, is_active: body.is_active ?? true,
    stripe_price_id_monthly: body.stripe_price_id_monthly,
    stripe_price_id_yearly: body.stripe_price_id_yearly,
    sort_order: body.sort_order || 0,
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
  const { error: e } = await supabase.from("subscription_plans").update(updates).eq("id", id)
  if (e) return NextResponse.json({ error: e.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const { supabase, error } = await verifyAdmin()
  if (error || !supabase) return NextResponse.json({ error }, { status: 401 })
  const { id } = await req.json()
  const { error: e } = await supabase.from("subscription_plans").delete().eq("id", id)
  if (e) return NextResponse.json({ error: e.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
