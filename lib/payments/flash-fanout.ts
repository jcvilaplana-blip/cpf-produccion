import type { SupabaseClient } from "@supabase/supabase-js"
import { computeMatchScore } from "@/lib/matching"
import { notifyUser } from "@/lib/notifications/create-notification"

// Safety caps: this app runs everything request-triggered with no cron/queue,
// so the whole fan-out must finish inside the webhook's request lifecycle.
const CANDIDATE_QUERY_LIMIT = 500
const MAX_NOTIFIED = 200
const BATCH_SIZE = 20

/**
 * Notifies available candidates in the job's city that a new flash offer
 * went live. Called once a flash_job micropayment is confirmed (the offer
 * hasn't really "been published" while payment is pending).
 *
 * `excludeUserIds` lets the 7.2 match-alert pass (which runs first and is
 * the stricter superset) claim its recipients so this broader city-only
 * pass doesn't double-notify the same candidate for the same job.
 */
export async function notifyFlashOfferCandidates(
  supabase: SupabaseClient,
  jobId: string,
  excludeUserIds: Set<string> = new Set()
): Promise<{ notified: number }> {
  const { data: job } = await supabase
    .from("jobs")
    .select("id, title, city, location, category, position, contract_type, business_id")
    .eq("id", jobId)
    .single()

  if (!job) return { notified: 0 }

  const { data: candidates } = await supabase
    .from("profiles")
    .select("id, location, contract_type_sought, job_category, specialties")
    .eq("user_type", "worker")
    .eq("availability_status", "available")
    .limit(CANDIDATE_QUERY_LIMIT)

  if (!candidates || candidates.length === 0) return { notified: 0 }

  const matching = candidates.filter((candidate) => {
    if (excludeUserIds.has(candidate.id)) return false
    return computeMatchScore(
      {
        location: candidate.location,
        contractTypeSought: candidate.contract_type_sought,
        jobCategory: candidate.job_category,
        specialties: candidate.specialties,
      },
      job
    ).breakdown.location
  })

  const toNotify = matching.slice(0, MAX_NOTIFIED)

  for (let i = 0; i < toNotify.length; i += BATCH_SIZE) {
    const batch = toNotify.slice(i, i + BATCH_SIZE)
    await Promise.all(
      batch.map((candidate) =>
        notifyUser(candidate.id, {
          title: "Nueva oferta flash cerca de ti",
          body: `"${job.title}" - oferta urgente en tu zona. ¡Corre, tiene disponibilidad limitada!`,
          type: "oferta",
          link: `/jobs/${job.id}`,
        })
      )
    )
  }

  return { notified: toNotify.length }
}
