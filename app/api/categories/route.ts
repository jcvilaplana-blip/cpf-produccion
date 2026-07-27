import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// No cache to ensure fresh data
export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    // Prefer service role key for reliable data access (bypasses RLS)
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !key) {
      return NextResponse.json({ data: [], error: "Configuración de base de datos no disponible" }, { status: 500 })
    }

    const supabase = createClient(url, key, {
      auth: { persistSession: false }
    })

    // Get all categories
    const { data: categories, error: catErr } = await supabase
      .from("categories")
      .select("id, name, slug, icon, sort_order, role_type")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true })

    if (catErr) {
      return NextResponse.json({ data: [], error: catErr.message }, { status: 500 })
    }

    // Get all subcategories
    const { data: subcategories, error: subErr } = await supabase
      .from("subcategories")
      .select("id, category_id, name, slug, icon, sort_order")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true })

    if (subErr) {
      return NextResponse.json({ data: [], error: subErr.message }, { status: 500 })
    }

    // Combine categories with their subcategories
    const result = (categories || []).map((cat) => ({
      ...cat,
      subcategories: (subcategories || []).filter((s) => s.category_id === cat.id),
    }))

    return NextResponse.json({ 
      data: result,
      meta: {
        categoriesCount: categories?.length || 0,
        subcategoriesCount: subcategories?.length || 0
      }
    })
  } catch (error) {
    return NextResponse.json({ data: [], error: "Error interno del servidor" }, { status: 500 })
  }
}
