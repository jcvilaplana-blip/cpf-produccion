export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { verifyAdmin } from "@/lib/admin-auth"

export async function GET(req: NextRequest) {
  const { supabase, error } = await verifyAdmin()
  if (error) return NextResponse.json({ error }, { status: 401 })
  const search = req.nextUrl.searchParams.get("search") || ""
  let query = supabase.from("countries").select("*").order("sort_order")
  if (search) query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%,name_en.ilike.%${search}%`)
  const { data, error: e } = await query
  if (e) return NextResponse.json({ error: e.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const { supabase, error } = await verifyAdmin()
  if (error) return NextResponse.json({ error }, { status: 401 })
  const body = await req.json()
  const { data, error: e } = await supabase.from("countries").insert({
    code: body.code, name: body.name, name_en: body.name_en,
    flag: body.flag, phone_prefix: body.phone_prefix,
    currency: body.currency || "EUR", is_active: body.is_active ?? true,
    sort_order: body.sort_order || 0,
  }).select().single()
  if (e) return NextResponse.json({ error: e.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function PATCH(req: NextRequest) {
  const { supabase, error } = await verifyAdmin()
  if (error) return NextResponse.json({ error }, { status: 401 })
  const body = await req.json()
  const { id, ...updates } = body
  const { error: e } = await supabase.from("countries").update(updates).eq("id", id)
  if (e) return NextResponse.json({ error: e.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const { supabase, error } = await verifyAdmin()
  if (error) return NextResponse.json({ error }, { status: 401 })
  const { id } = await req.json()
  const { error: e } = await supabase.from("countries").delete().eq("id", id)
  if (e) return NextResponse.json({ error: e.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
