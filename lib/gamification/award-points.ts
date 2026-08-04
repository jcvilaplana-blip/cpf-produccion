import type { SupabaseClient } from "@supabase/supabase-js"

// Points earned per action - kept in one place since several call sites in
// lib/actions.ts and elsewhere reference the same figures.
export const POINTS = {
  hired: 100,
  profileComplete: 50,
  referralCompleted: 150,
  ratingLeft: 30,
  interviewConfirmed: 30,
  availabilityUpdatedWeekly: 10,
  portfolioPhotoMonthly: 15,
  dailyProfileViewBonus: 5,
} as const

export type PointsReason = keyof typeof POINTS | "redeem"

function levelForPoints(points: number): number {
  return Math.floor(Math.max(0, points) / 100) + 1
}

/**
 * Awards (or, with a negative amount, deducts for a redemption) points to a
 * user, logging to points_ledger and syncing profiles/business_profiles
 * points+level. Best-effort by design - every call site wraps this in a
 * try/catch and never lets a gamification failure block the action that
 * triggered it (same convention as the notification fan-outs).
 */
export async function awardPoints(
  supabase: SupabaseClient,
  userId: string,
  amount: number,
  reason: string,
  relatedId?: string,
  userType?: "worker" | "business"
): Promise<void> {
  let role = userType
  if (!role) {
    const { data: profile } = await supabase.from("profiles").select("user_type").eq("id", userId).single()
    role = profile?.user_type === "business" ? "business" : "worker"
  }

  await supabase.from("points_ledger").insert({ user_id: userId, points: amount, reason, related_id: relatedId || null })

  const table = role === "business" ? "business_profiles" : "profiles"
  const { data: current } = await supabase.from(table).select("points").eq("id", userId).single()
  const newPoints = Math.max(0, (current?.points || 0) + amount)

  await supabase.from(table).update({ points: newPoints, level: levelForPoints(newPoints) }).eq("id", userId)
}

/** Has this user already been awarded `reason` within the last `windowDays` days? Used for capped/periodic bonuses. */
export async function hasRecentAward(
  supabase: SupabaseClient,
  userId: string,
  reason: string,
  windowDays: number
): Promise<boolean> {
  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString()
  const { count } = await supabase
    .from("points_ledger")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("reason", reason)
    .gte("created_at", since)
  return (count || 0) > 0
}

export async function getPointsBalance(supabase: SupabaseClient, userId: string, userType: "worker" | "business"): Promise<number> {
  const table = userType === "business" ? "business_profiles" : "profiles"
  const { data } = await supabase.from(table).select("points").eq("id", userId).single()
  return data?.points || 0
}
