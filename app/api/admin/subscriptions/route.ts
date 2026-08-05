export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { verifyAdmin } from "@/lib/admin-auth"

/**
 * Quién tiene qué plan y hasta cuándo.
 *
 * Se juntan las dos procedencias: los planes de empresa viven en
 * `business_profiles` (subscription_plan / subscription_expires_at) y el plan
 * de candidato en `profiles` (subscription_tier / premium_expires_at). El
 * panel tenía el catálogo de planes, pero no había forma de ver quién estaba
 * suscrito.
 */
export async function GET(req: NextRequest) {
  const { error, supabase } = await verifyAdmin()
  if (error || !supabase) return NextResponse.json({ error }, { status: 401 })

  const search = (req.nextUrl.searchParams.get("search") || "").trim()
  const now = Date.now()

  const [{ data: businesses }, { data: workers }] = await Promise.all([
    supabase
      .from("business_profiles")
      .select("id, company_name, subscription_plan, subscription_expires_at, is_premium, premium_expires_at")
      .not("subscription_plan", "is", null)
      .order("subscription_expires_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("id, display_name, avatar_url, user_type, subscription_tier, is_premium, premium_expires_at")
      .eq("user_type", "worker")
      .eq("is_premium", true)
      .order("premium_expires_at", { ascending: false }),
  ])

  const describe = (expiresAt: string | null) => {
    if (!expiresAt) return { state: "sin_caducidad" as const, daysLeft: null }
    const ms = new Date(expiresAt).getTime() - now
    if (Number.isNaN(ms)) return { state: "sin_caducidad" as const, daysLeft: null }
    const daysLeft = Math.ceil(ms / 86400000)
    // "Por caducar" a una semana vista: margen suficiente para avisar antes de
    // que el negocio pierda el plan sin enterarse.
    const state = ms <= 0 ? ("caducada" as const) : daysLeft <= 7 ? ("por_caducar" as const) : ("activa" as const)
    return { state, daysLeft }
  }

  const rows = [
    ...(businesses || []).map((b) => ({
      id: b.id,
      kind: "business" as const,
      name: b.company_name || "Empresa",
      avatar_url: null as string | null,
      plan: b.subscription_plan,
      expires_at: b.subscription_expires_at,
      is_premium: Boolean(b.is_premium),
      ...describe(b.subscription_expires_at),
    })),
    ...(workers || []).map((w) => ({
      id: w.id,
      kind: "worker" as const,
      name: w.display_name || "Candidato",
      avatar_url: w.avatar_url as string | null,
      plan: w.subscription_tier || "premium-worker",
      expires_at: w.premium_expires_at,
      is_premium: Boolean(w.is_premium),
      ...describe(w.premium_expires_at),
    })),
  ]

  const filtered = search
    ? rows.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()))
    : rows

  return NextResponse.json({
    data: filtered,
    summary: {
      total: filtered.length,
      activas: filtered.filter((r) => r.state === "activa").length,
      porCaducar: filtered.filter((r) => r.state === "por_caducar").length,
      caducadas: filtered.filter((r) => r.state === "caducada").length,
    },
  })
}
