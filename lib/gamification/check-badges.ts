import type { SupabaseClient } from "@supabase/supabase-js"

// Auto-awardable badges only. "Perfil del Mes" (worker) and "Formador"/
// "Rotación Baja" (business) have no objective metric today - the admin
// assigns those manually from /admin by editing badges[] directly.
const WORKER_BADGES = {
  PROFILE_COMPLETE: "Perfil Completo",
  PROFESSIONAL: "Profesional",
  PUNCTUAL: "Puntual",
} as const

const BUSINESS_BADGES = {
  VERIFIED: "Perfil Verificado",
  HIGH_SATISFACTION: "Alta Satisfacción",
} as const

async function addBadgeIfMissing(supabase: SupabaseClient, table: string, userId: string, currentBadges: string[], badge: string) {
  if (currentBadges.includes(badge)) return currentBadges
  const updated = [...currentBadges, badge]
  await supabase.from(table).update({ badges: updated }).eq("id", userId)
  return updated
}

export async function checkWorkerBadges(supabase: SupabaseClient, userId: string): Promise<void> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("badges, rating, total_ratings, profile_completed_at")
    .eq("id", userId)
    .single()
  if (!profile) return

  let badges: string[] = profile.badges || []

  if (profile.profile_completed_at) {
    badges = await addBadgeIfMissing(supabase, "profiles", userId, badges, WORKER_BADGES.PROFILE_COMPLETE)
  }

  if ((profile.rating || 0) >= 4.5 && (profile.total_ratings || 0) >= 5) {
    badges = await addBadgeIfMissing(supabase, "profiles", userId, badges, WORKER_BADGES.PROFESSIONAL)
  }

  const { count: confirmedInterviews } = await supabase
    .from("interview_requests")
    .select("id", { count: "exact", head: true })
    .eq("worker_id", userId)
    .in("status", ["confirmed", "approved"])
  if ((confirmedInterviews || 0) >= 3) {
    await addBadgeIfMissing(supabase, "profiles", userId, badges, WORKER_BADGES.PUNCTUAL)
  }
}

export async function checkBusinessBadges(supabase: SupabaseClient, userId: string): Promise<void> {
  const { data: business } = await supabase
    .from("business_profiles")
    .select("badges, verified")
    .eq("id", userId)
    .single()
  const { data: profile } = await supabase.from("profiles").select("rating, total_ratings").eq("id", userId).single()
  if (!business) return

  let badges: string[] = business.badges || []

  if (business.verified) {
    badges = await addBadgeIfMissing(supabase, "business_profiles", userId, badges, BUSINESS_BADGES.VERIFIED)
  }

  if ((profile?.rating || 0) >= 4.5 && (profile?.total_ratings || 0) >= 5) {
    await addBadgeIfMissing(supabase, "business_profiles", userId, badges, BUSINESS_BADGES.HIGH_SATISFACTION)
  }
}

export async function checkBadges(supabase: SupabaseClient, userId: string, userType: "worker" | "business"): Promise<void> {
  if (userType === "business") await checkBusinessBadges(supabase, userId)
  else await checkWorkerBadges(supabase, userId)
}
