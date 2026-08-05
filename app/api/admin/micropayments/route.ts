export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { verifyAdmin } from "@/lib/admin-auth"

/**
 * Listado de micropagos: Destacar oferta, Oferta Flash, Destacar perfil…
 *
 * Solo existía `micropayments/[id]/activate`, para desbloquear una compra a
 * mano; no había forma de ver el conjunto. El comprador se resuelve en una
 * segunda consulta en lugar de con un join de PostgREST, para no depender del
 * nombre de la clave foránea.
 */
export async function GET(req: NextRequest) {
  const { error, supabase } = await verifyAdmin()
  if (error || !supabase) return NextResponse.json({ error }, { status: 401 })

  const url = req.nextUrl
  const status = url.searchParams.get("status") || ""
  const limit = parseInt(url.searchParams.get("limit") || "100")

  let query = supabase
    .from("micropayments")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(limit)

  if (status) query = query.eq("status", status)

  const { data, count, error: dbError } = await query
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  const rows = data || []
  const userIds = [...new Set(rows.map((r) => r.user_id).filter(Boolean))]

  const { data: buyers } = userIds.length
    ? await supabase.from("profiles").select("id, display_name, avatar_url").in("id", userIds)
    : { data: [] as any[] }

  const buyerById = new Map((buyers || []).map((b) => [b.id, b]))

  return NextResponse.json({
    data: rows.map((row) => ({
      ...row,
      // El panel muestra el importe en euros; la columna guarda céntimos.
      amount: row.amount_cents,
      profiles: buyerById.get(row.user_id) || null,
    })),
    total: count ?? rows.length,
  })
}

export async function DELETE(req: NextRequest) {
  const { error, supabase } = await verifyAdmin()
  if (error || !supabase) return NextResponse.json({ error }, { status: 401 })

  const id = req.nextUrl.searchParams.get("id")
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

  const { error: dbError } = await supabase.from("micropayments").delete().eq("id", id)
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
