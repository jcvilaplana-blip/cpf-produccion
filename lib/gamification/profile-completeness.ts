// Pure functions, no Supabase - what counts as "perfil 100% completo" for
// the +50pt bonus (and the "Perfil Completo" badge / referral payout).

export interface WorkerCompletenessInput {
  avatar_url?: string | null
  bio?: string | null
  location?: string | null
  job_category?: string | null
  specialties?: string[] | null
  portfolio_images?: string[] | null
  portfolio_videos?: string[] | null
}

export function isWorkerProfileComplete(p: WorkerCompletenessInput): boolean {
  return Boolean(
    p.avatar_url &&
      p.bio &&
      p.location &&
      p.job_category &&
      (p.specialties?.length || 0) > 0 &&
      ((p.portfolio_images?.length || 0) > 0 || (p.portfolio_videos?.length || 0) > 0)
  )
}

export interface BusinessCompletenessInput {
  company_logo_url?: string | null
  company_description?: string | null
  city?: string | null
  address?: string | null
  phone?: string | null
}

export function isBusinessProfileComplete(p: BusinessCompletenessInput): boolean {
  return Boolean(p.company_logo_url && p.company_description && p.city && p.address && p.phone)
}
