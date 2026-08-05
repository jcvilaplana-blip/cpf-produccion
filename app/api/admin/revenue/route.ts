export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { verifyAdmin } from "@/lib/admin-auth"
import { breakdownFromTotal } from "@/lib/tax"

/**
 * Todos los ingresos en un solo sitio: quién, qué, cuánto y hasta cuándo.
 *
 * Se juntan las dos procedencias, que hasta ahora vivían separadas y sin
 * ninguna pantalla que las sumara: los micropagos (Destacar, Flash, funciones
 * premium) y los cobros de suscripción. Cada línea trae el desglose de IVA con
 * el mismo cálculo que se usó al cobrar, para que el panel no invente cifras
 * distintas de las facturadas.
 */

const FEATURE_LABELS: Record<string, string> = {
  highlight_profile: "Destacar perfil (7 días)",
  view_matches: "Ver empresas interesadas",
  boost_visibility: "Impulsar visibilidad",
  flash_job: "Oferta Flash",
  highlight_job: "Destacar oferta (24h)",
}

const PLAN_LABELS: Record<string, string> = {
  "standard-business": "Plan Standard (empresa)",
  "premium-business": "Plan Premium (empresa)",
  "premium-worker": "Premium (candidato)",
}

export async function GET(req: NextRequest) {
  const { error, supabase } = await verifyAdmin()
  if (error || !supabase) return NextResponse.json({ error }, { status: 401 })

  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "200")

  const [{ data: micro }, { data: subs }] = await Promise.all([
    supabase
      .from("micropayments")
      .select("id, user_id, feature_type, amount_cents, status, valid_until, created_at, job_id")
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("payments")
      .select("id, user_id, plan_id, amount, currency, status, payment_method, processed_at, created_at")
      .order("created_at", { ascending: false })
      .limit(limit),
  ])

  const rows = [
    ...(micro || []).map((m) => ({
      id: m.id,
      source: "micropago" as const,
      user_id: m.user_id,
      concept: FEATURE_LABELS[m.feature_type] || m.feature_type,
      totalCents: m.amount_cents || 0,
      status: m.status,
      validUntil: m.valid_until as string | null,
      date: m.created_at as string,
      jobId: m.job_id as string | null,
    })),
    ...(subs || []).map((p) => ({
      id: p.id,
      source: "suscripción" as const,
      user_id: p.user_id,
      concept: PLAN_LABELS[p.plan_id] || p.plan_id || "Suscripción",
      totalCents: p.amount || 0,
      status: p.status,
      validUntil: null as string | null,
      date: (p.processed_at || p.created_at) as string,
      jobId: null as string | null,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // Quién pagó: se resuelve aparte para no depender de nombres de claves ajenas.
  const userIds = [...new Set(rows.map((r) => r.user_id).filter(Boolean))]
  const { data: buyers } = userIds.length
    ? await supabase.from("profiles").select("id, display_name, avatar_url, user_type").in("id", userIds)
    : { data: [] as any[] }
  const buyerById = new Map((buyers || []).map((b) => [b.id, b]))

  const data = rows.map((r) => {
    const { baseCents, vatCents } = breakdownFromTotal(r.totalCents)
    return { ...r, baseCents, vatCents, buyer: buyerById.get(r.user_id) || null }
  })

  // Solo cuenta como ingreso lo efectivamente cobrado: un pago "pending" es una
  // intención, no dinero. Sumarlos inflaría las cifras del panel.
  const paid = data.filter((r) => ["completed", "succeeded", "paid", "active"].includes(String(r.status)))
  const sum = (list: typeof paid, field: "totalCents" | "baseCents" | "vatCents") =>
    list.reduce((acc, r) => acc + (r[field] || 0), 0)

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)
  const thisMonth = paid.filter((r) => new Date(r.date) >= startOfMonth)

  return NextResponse.json({
    data,
    summary: {
      totalCents: sum(paid, "totalCents"),
      baseCents: sum(paid, "baseCents"),
      vatCents: sum(paid, "vatCents"),
      monthCents: sum(thisMonth, "totalCents"),
      countPaid: paid.length,
      countPending: data.length - paid.length,
      micropagosCents: sum(paid.filter((r) => r.source === "micropago"), "totalCents"),
      suscripcionesCents: sum(paid.filter((r) => r.source === "suscripción"), "totalCents"),
    },
  })
}
