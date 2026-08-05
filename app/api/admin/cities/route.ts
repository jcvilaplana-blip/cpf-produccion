export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { verifyAdmin } from "@/lib/admin-auth"

export async function GET(req: NextRequest) {
  const { supabase, error } = await verifyAdmin()
  if (error || !supabase) return NextResponse.json({ error }, { status: 401 })
  const search = req.nextUrl.searchParams.get("search") || ""
  const countryId = req.nextUrl.searchParams.get("country_id") || ""
  let query = supabase.from("cities").select("*, country:countries(id,name,code,flag)").order("sort_order")
  if (search) query = query.or(`name.ilike.%${search}%,region.ilike.%${search}%,name_en.ilike.%${search}%`)
  if (countryId) query = query.eq("country_id", countryId)
  const { data, error: e } = await query
  if (e) return NextResponse.json({ error: e.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const { supabase, error } = await verifyAdmin()
  if (error || !supabase) return NextResponse.json({ error }, { status: 401 })
  const body = await req.json()
  const { data, error: e } = await supabase.from("cities").insert({
    country_id: body.country_id, name: body.name, name_en: body.name_en,
    region: body.region, latitude: body.latitude, longitude: body.longitude,
    is_active: body.is_active ?? true, sort_order: body.sort_order || 0,
  }).select("*, country:countries(id,name,code,flag)").single()
  if (e) return NextResponse.json({ error: e.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function PATCH(req: NextRequest) {
  const { supabase, error } = await verifyAdmin()
  if (error || !supabase) return NextResponse.json({ error }, { status: 401 })
  const body = await req.json()
  const { id, ...updates } = body
  const { error: e } = await supabase.from("cities").update(updates).eq("id", id)
  if (e) return NextResponse.json({ error: e.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const { supabase, error } = await verifyAdmin()
  if (error || !supabase) return NextResponse.json({ error }, { status: 401 })
  const { id } = await req.json()
  const { error: e } = await supabase.from("cities").delete().eq("id", id)
  if (e) return NextResponse.json({ error: e.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
