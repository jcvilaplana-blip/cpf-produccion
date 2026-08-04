import type { SupabaseClient } from "@supabase/supabase-js"
import { computeMatchScore, type MatchJobInput } from "@/lib/matching"
import { notifyUser } from "@/lib/notifications/create-notification"

const CANDIDATE_QUERY_LIMIT = 500
const BATCH_SIZE = 20

export interface MatchAlertJobInput extends MatchJobInput {
  id: string
  title: string
}

/**
 * 7.2: notifies premium candidates whose configured match_alert_threshold
 * (default 100) is met or exceeded by a newly-published job. Fires for any
 * published job (not just flash) - called from createJobAction for regular
 * jobs, and from activate-feature.ts's flash_job handler once payment
 * confirms (a flash job hasn't "been published" while pending).
 *
 * Runs before the broader flash city-only fan-out (lib/payments/flash-fanout.ts)
 * and returns who it notified so that pass can skip them - a candidate who
 * clears their own match threshold shouldn't also get the generic flash ping.
 */
export async function notifyMatchingCandidates(
  supabase: SupabaseClient,
  job: MatchAlertJobInput
): Promise<{ notifiedUserIds: Set<string> }> {
  const notifiedUserIds = new Set<string>()

  const { data: candidates } = await supabase
    .from("profiles")
    .select("id, location, contract_type_sought, job_category, specialties, match_alert_threshold")
    .eq("user_type", "worker")
    .eq("is_premium", true)
    .limit(CANDIDATE_QUERY_LIMIT)

  if (!candidates || candidates.length === 0) return { notifiedUserIds }

  const toNotify = candidates.filter((candidate) => {
    const threshold = candidate.match_alert_threshold ?? 100
    const result = computeMatchScore(
      {
        location: candidate.location,
        contractTypeSought: candidate.contract_type_sought,
        jobCategory: candidate.job_category,
        specialties: candidate.specialties,
      },
      job
    )
    return result.percent >= threshold
  })

  for (let i = 0; i < toNotify.length; i += BATCH_SIZE) {
    const batch = toNotify.slice(i, i + BATCH_SIZE)
    await Promise.all(
      batch.map((candidate) => {
        notifiedUserIds.add(candidate.id)
        return notifyUser(candidate.id, {
          title: "Oferta que coincide con tu perfil",
          body: `"${job.title}" encaja con lo que buscas. Échale un vistazo antes de que se llenen las vacantes.`,
          type: "oferta",
          link: `/jobs/${job.id}`,
        })
      })
    )
  }

  return { notifiedUserIds }
}
