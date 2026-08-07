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
      .select(
        "id, user_id, feature_type, amount_cents, currency, status, valid_until, created_at, updated_at, job_id, stripe_payment_intent_id"
      )
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("payments")
      .select(
        "id, user_id, plan_id, amount, currency, status, payment_method, order_id, metadata, processed_at, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(limit),
  ])

  const rows = [
    ...(micro || []).map((m) => ({
      id: m.id,
      source: "micropago" as const,
      user_id: m.user_id,
      concept: FEATURE_LABELS[m.feature_type] || m.feature_type,
      /** Clave sin traducir: el panel filtra por producto con esto. */
      productKey: m.feature_type as string,
      totalCents: m.amount_cents || 0,
      currency: (m.currency || "eur") as string,
      status: m.status,
      method: "stripe",
      validUntil: m.valid_until as string | null,
      date: m.created_at as string,
      /** Cuándo se cobró de verdad, que no es cuándo se intentó. */
      settledAt: (m.status === "completed" ? m.updated_at : null) as string | null,
      jobId: m.job_id as string | null,
      /** Referencia con la que casar el cobro en el panel de Stripe. */
      stripeRef: (m.stripe_payment_intent_id || null) as string | null,
      stripeKind: "payment_intent" as const,
    })),
    ...(subs || []).map((p) => ({
      id: p.id,
      source: "suscripción" as const,
      user_id: p.user_id,
      concept: PLAN_LABELS[p.plan_id] || p.plan_id || "Suscripción",
      productKey: (p.plan_id || "subscription") as string,
      totalCents: p.amount || 0,
      currency: (p.currency || "eur") as string,
      status: p.status,
      method: (p.payment_method || "stripe") as string,
      validUntil: null as string | null,
      date: (p.processed_at || p.created_at) as string,
      settledAt: (p.processed_at || null) as string | null,
      jobId: null as string | null,
      // `order_id` guarda el id de la factura de Stripe, único por cobro.
      stripeRef: (p.order_id || (p.metadata as any)?.subscription_id || null) as string | null,
      stripeKind: "invoice" as const,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // Quién pagó y sobre qué. Ambas cosas se resuelven aparte, en lugar de con
  // joins de PostgREST, para no depender de los nombres de las claves ajenas.
  const userIds = [...new Set(rows.map((r) => r.user_id).filter(Boolean))]
  const jobIds = [...new Set(rows.map((r) => r.jobId).filter(Boolean))] as string[]

  const [{ data: buyers }, { data: businesses }, { data: jobs }] = await Promise.all([
    userIds.length
      ? supabase.from("profiles").select("id, display_name, avatar_url, user_type, email").in("id", userIds)
      : Promise.resolve({ data: [] as any[] }),
    userIds.length
      ? supabase.from("business_profiles").select("id, company_name").in("id", userIds)
      : Promise.resolve({ data: [] as any[] }),
    jobIds.length
      ? supabase.from("jobs").select("id, title, is_flash, is_highlighted").in("id", jobIds)
      : Promise.resolve({ data: [] as any[] }),
  ])

  const buyerById = new Map((buyers || []).map((b) => [b.id, b]))
  const companyById = new Map((businesses || []).map((b: any) => [b.id, b.company_name]))
  const jobById = new Map((jobs || []).map((j: any) => [j.id, j]))

  const data = rows.map((r) => {
    const { baseCents, vatCents } = breakdownFromTotal(r.totalCents)
    const buyer = buyerById.get(r.user_id) || null
    const job = r.jobId ? jobById.get(r.jobId) : null
    return {
      ...r,
      baseCents,
      vatCents,
      buyer: buyer
        ? {
            ...buyer,
            // Para una empresa, el nombre útil es el comercial, no el del perfil.
            company_name: companyById.get(r.user_id) || null,
          }
        : null,
      // El objeto comprado, cuando la compra recae sobre algo concreto.
      job: job ? { id: job.id, title: job.title, isFlash: job.is_flash, isHighlighted: job.is_highlighted } : null,
    }
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

  // Cuánto ha dejado cada producto. Sin esto el panel decía cuánto se ingresa,
  // pero no de qué: no había forma de ver si el dinero viene de las Flash, de
  // Destacar o de los planes.
  const porProducto = new Map<string, { concepto: string; fuente: string; unidades: number; totalCents: number }>()
  for (const r of paid) {
    const actual = porProducto.get(r.productKey) || {
      concepto: r.concept,
      fuente: r.source,
      unidades: 0,
      totalCents: 0,
    }
    actual.unidades += 1
    actual.totalCents += r.totalCents || 0
    porProducto.set(r.productKey, actual)
  }

  return NextResponse.json({
    data,
    porProducto: [...porProducto.entries()]
      .map(([key, v]) => ({ producto: key, ...v }))
      .sort((a, b) => b.totalCents - a.totalCents),
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
