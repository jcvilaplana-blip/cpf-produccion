// Shared candidate <-> job matching engine.
// Used by: candidate job listing (1.1), business candidate listing (2.1),
// the flash-offer notification fan-out, and the premium match-alert (7.2).
// Kept framework-free (no Supabase/Next imports) so it can run in server
// components, server actions, and the Stripe webhook route alike.

export interface MatchCandidateInput {
  location?: string | null
  contractTypeSought?: string[] | null
  jobCategory?: string | null
  specialties?: string[] | null
}

export interface MatchJobInput {
  city?: string | null
  location?: string | null
  contractType?: string | null
  category?: string | null
  position?: string | null
}

export interface MatchBreakdown {
  location: boolean
  contractType: boolean
  jobType: boolean
  /** null = not applicable (the job didn't specify a subcategory beyond its base category) */
  specialty: boolean | null
}

export interface MatchResult {
  matchedCount: number
  totalCriteria: 3 | 4
  percent: number
  breakdown: MatchBreakdown
}

// jobs.contract_type vocabulary (temporary/seasonal/weekend/freelance) barely
// overlaps with profiles.contract_type_sought vocabulary (flash_offer/
// one_time_event) — without this table the "tipo de contrato" criterion would
// fail for most jobs regardless of what the candidate is actually looking for.
const CONTRACT_TYPE_EQUIVALENTS: Record<string, string[]> = {
  full_time: ["full_time"],
  part_time: ["part_time"],
  temporary: ["flash_offer", "one_time_event"],
  seasonal: ["flash_offer", "one_time_event"],
  weekend: ["part_time", "flash_offer"],
  freelance: ["one_time_event", "flash_offer"],
}

function norm(value: string | null | undefined): string {
  return (value || "").trim().toLowerCase()
}

function locationMatches(candidateLocation: string | null | undefined, job: MatchJobInput): boolean {
  const candidate = norm(candidateLocation)
  const jobLoc = norm(job.city) || norm(job.location)
  if (!candidate || !jobLoc) return false
  return candidate.includes(jobLoc) || jobLoc.includes(candidate)
}

function contractTypeMatches(sought: string[] | null | undefined, jobContractType: string | null | undefined): boolean {
  const jobType = norm(jobContractType)
  if (!jobType || !sought || sought.length === 0) return false
  const acceptable = CONTRACT_TYPE_EQUIVALENTS[jobType] || [jobType]
  const soughtNormalized = sought.map(norm)
  return acceptable.some((accepted) => soughtNormalized.includes(accepted))
}

function jobTypeMatches(candidateJobCategory: string | null | undefined, jobCategory: string | null | undefined): boolean {
  const candidate = norm(candidateJobCategory)
  const job = norm(jobCategory)
  if (!candidate || !job) return false
  return candidate === job || candidate.includes(job) || job.includes(candidate)
}

function specialtyMatches(specialties: string[] | null | undefined, jobPosition: string | null | undefined): boolean {
  const position = norm(jobPosition)
  if (!position || !specialties || specialties.length === 0) return false
  return specialties.some((s) => {
    const specialty = norm(s)
    return specialty.includes(position) || position.includes(specialty)
  })
}

export function computeMatchScore(candidate: MatchCandidateInput, job: MatchJobInput): MatchResult {
  const location = locationMatches(candidate.location, job)
  const contractType = contractTypeMatches(candidate.contractTypeSought, job.contractType)
  const jobType = jobTypeMatches(candidate.jobCategory, job.category)

  // The specialty criterion only applies when the job actually specified a
  // subcategory beyond its base category (position !== category) — mirrors
  // the fallback already written in create-job-content.tsx (position defaults
  // to category when no subcategory was chosen).
  const specialtyApplicable = Boolean(job.position) && norm(job.position) !== norm(job.category)
  const specialty = specialtyApplicable ? specialtyMatches(candidate.specialties, job.position) : null

  const totalCriteria: 3 | 4 = specialtyApplicable ? 4 : 3
  const matchedCount = [location, contractType, jobType, specialty === true].filter(Boolean).length

  return {
    matchedCount,
    totalCriteria,
    percent: Math.round((matchedCount / totalCriteria) * 100),
    breakdown: { location, contractType, jobType, specialty },
  }
}

/** Best match across several jobs — used for the business-side candidate ranking (2.1). */
export function computeBestMatchScore(candidate: MatchCandidateInput, jobs: MatchJobInput[]): MatchResult | null {
  if (jobs.length === 0) return null
  let best: MatchResult | null = null
  for (const job of jobs) {
    const result = computeMatchScore(candidate, job)
    if (!best || result.percent > best.percent) best = result
  }
  return best
}
