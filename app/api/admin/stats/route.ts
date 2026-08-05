export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { verifyAdmin } from "@/lib/admin-auth"


export async function GET() {
  const { error, supabase } = await verifyAdmin()
  if (error || !supabase) return NextResponse.json({ error }, { status: 401 })

  const [
    { count: totalProfiles },
    { count: totalWorkers },
    { count: totalBusinesses },
    { count: totalJobs },
    { count: activeJobs },
    { count: flashJobs },
    { count: totalApplications },
    { count: totalCategories },
    { count: totalConversations },
    { count: totalMessages },
    { count: unreadMessages },
    { count: totalRatings },
    { count: premiumWorkers },
    { count: premiumBusinesses },
    { count: totalVideos },
    { count: totalSubcategories },
    { count: totalPlans },
    { count: totalPaymentMethods },
    { count: freePlanBusinesses },
    { count: basicPlanBusinesses },
    { count: premiumPlanBusinesses },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("user_type", "worker"),
    supabase.from("business_profiles").select("*", { count: "exact", head: true }),
    supabase.from("jobs").select("*", { count: "exact", head: true }),
    supabase.from("jobs").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("jobs").select("*", { count: "exact", head: true }).eq("is_flash", true),
    supabase.from("applications").select("*", { count: "exact", head: true }),
    supabase.from("categories").select("*", { count: "exact", head: true }),
    supabase.from("conversations").select("*", { count: "exact", head: true }),
    supabase.from("messages").select("*", { count: "exact", head: true }),
    supabase.from("messages").select("*", { count: "exact", head: true }).eq("read", false),
    supabase.from("ratings").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("is_premium", true),
    supabase.from("business_profiles").select("*", { count: "exact", head: true }).eq("is_premium", true),
    supabase.from("profiles").select("*", { count: "exact", head: true }).not("mux_playback_id", "is", null),
    supabase.from("subcategories").select("*", { count: "exact", head: true }),
    supabase.from("subscription_plans").select("*", { count: "exact", head: true }),
    supabase.from("payment_methods").select("*", { count: "exact", head: true }),
    supabase.from("business_profiles").select("*", { count: "exact", head: true }).eq("subscription_plan", "free"),
    supabase.from("business_profiles").select("*", { count: "exact", head: true }).eq("subscription_plan", "basic"),
    supabase.from("business_profiles").select("*", { count: "exact", head: true }).eq("subscription_plan", "premium"),
  ])

  // Ingresos: no había ninguna métrica de dinero en el panel, aunque la
  // plataforma cobra desde hace tiempo. Solo se suma lo efectivamente
  // cobrado; un pago pendiente es una intención, no un ingreso.
  const [{ data: paidMicro }, { data: paidSubs }] = await Promise.all([
    supabase.from("micropayments").select("amount_cents, status, created_at").in("status", ["completed", "succeeded", "paid"]),
    supabase.from("payments").select("amount, status, created_at, processed_at").in("status", ["completed", "succeeded", "paid"]),
  ])

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const microCents = (paidMicro || []).reduce((a, r) => a + (r.amount_cents || 0), 0)
  const subsCents = (paidSubs || []).reduce((a, r) => a + (r.amount || 0), 0)
  const monthCents =
    (paidMicro || []).filter((r) => new Date(r.created_at) >= startOfMonth).reduce((a, r) => a + (r.amount_cents || 0), 0) +
    (paidSubs || []).filter((r) => new Date(r.processed_at || r.created_at) >= startOfMonth).reduce((a, r) => a + (r.amount || 0), 0)

  return NextResponse.json({
    revenueTotalCents: microCents + subsCents,
    revenueMonthCents: monthCents,
    revenueMicroCents: microCents,
    revenueSubsCents: subsCents,
    revenueCount: (paidMicro?.length || 0) + (paidSubs?.length || 0),
    totalProfiles: totalProfiles ?? 0,
    totalWorkers: totalWorkers ?? 0,
    totalBusinesses: totalBusinesses ?? 0,
    totalJobs: totalJobs ?? 0,
    activeJobs: activeJobs ?? 0,
    flashJobs: flashJobs ?? 0,
    totalApplications: totalApplications ?? 0,
    totalCategories: totalCategories ?? 0,
    totalConversations: totalConversations ?? 0,
    totalMessages: totalMessages ?? 0,
    unreadMessages: unreadMessages ?? 0,
    totalRatings: totalRatings ?? 0,
    premiumWorkers: premiumWorkers ?? 0,
    premiumBusinesses: premiumBusinesses ?? 0,
    totalVideos: totalVideos ?? 0,
    totalSubcategories: totalSubcategories ?? 0,
    totalPlans: totalPlans ?? 0,
    totalPaymentMethods: totalPaymentMethods ?? 0,
    freePlanBusinesses: freePlanBusinesses ?? 0,
    basicPlanBusinesses: basicPlanBusinesses ?? 0,
    premiumPlanBusinesses: premiumPlanBusinesses ?? 0,
  })
}
