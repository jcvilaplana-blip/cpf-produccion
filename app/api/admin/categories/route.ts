export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { verifyAdmin } from "@/lib/admin-auth"


export async function GET() {
  const { error, supabase } = await verifyAdmin()
  if (error || !supabase) return NextResponse.json({ error }, { status: 401 })

  const { data: categories, error: catError } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true })

  if (catError) return NextResponse.json({ error: catError.message }, { status: 500 })

  const { data: subcategories, error: subError } = await supabase
    .from("subcategories")
    .select("*")
    .order("sort_order", { ascending: true })

  if (subError) return NextResponse.json({ error: subError.message }, { status: 500 })

  const categoriesWithSubs = (categories || []).map(cat => ({
    ...cat,
    subcategories: (subcategories || []).filter(sub => sub.category_id === cat.id),
  }))

  return NextResponse.json({ data: categoriesWithSubs })
}

export async function POST(req: NextRequest) {
  const { error, supabase } = await verifyAdmin()
  if (error || !supabase) return NextResponse.json({ error }, { status: 401 })

  const body = await req.json()
  const { type, ...fields } = body

  if (type === "subcategory") {
    const { data, error: dbError } = await supabase.from("subcategories").insert(fields).select().single()
    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
    return NextResponse.json({ data })
  }

  const { data, error: dbError } = await supabase.from("categories").insert(fields).select().single()
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function PATCH(req: NextRequest) {
  const { error, supabase } = await verifyAdmin()
  if (error || !supabase) return NextResponse.json({ error }, { status: 401 })

  const body = await req.json()
  const { id, type, ...updates } = body

  if (type === "subcategory") {
    const { data, error: dbError } = await supabase.from("subcategories").update(updates).eq("id", id).select().single()
    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
    return NextResponse.json({ data })
  }

  const { data, error: dbError } = await supabase.from("categories").update(updates).eq("id", id).select().single()
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function DELETE(req: NextRequest) {
  const { error, supabase } = await verifyAdmin()
  if (error || !supabase) return NextResponse.json({ error }, { status: 401 })

  const { id, type } = await req.json()
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

  if (type === "subcategory") {
    const { error: dbError } = await supabase.from("subcategories").delete().eq("id", id)
    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  await supabase.from("subcategories").delete().eq("category_id", id)
  const { error: dbError } = await supabase.from("categories").delete().eq("id", id)
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
