export type UserType = "worker" | "business"
export type ContractType = "full_time" | "part_time" | "flash_offer" | "one_time_event"
// Categories are now dynamic strings matching the slug in the categories/subcategories DB tables
export type JobCategory = string
export type BusinessType = string

export type ApplicationStatus = "pending" | "accepted" | "rejected" | "withdrawn"

export interface Profile {
  id: string
  user_type: UserType
  display_name: string
  phone?: string
  location?: string
  bio?: string
  avatar_url?: string
  rating: number
  total_ratings: number
  rating_criteria_summary?: Record<string, number>
  is_active: boolean
  job_category?: JobCategory
  job_subcategory?: string
  specialties?: string[]
  availability_status?: string
  points?: number
  level?: number
  badges?: string[]
  certificates?: string[]
  is_admin?: boolean
  is_premium?: boolean
  premium_expires_at?: string
  // CV fields
  cv_url?: string
  cv_filename?: string
  // Portfolio images (max 3)
  portfolio_images?: string[]
  // Portfolio videos (max 3, 1 min each, shown fullscreen on tap)
  portfolio_videos?: string[]
  // Experience
  experience_years?: number
  contract_type_sought?: string[]
  match_alert_threshold?: number
  date_of_birth?: string
  skills?: string[]
  work_experience?: Array<{ company: string; position: string; startDate: string; endDate: string; current: boolean; description: string }>
  referral_code?: string
  referred_by?: string | null
  languages?: Array<{ language: string; level: string }> | string[]
  created_at: string
  updated_at: string
}

export interface BusinessProfile {
  id: string
  company_name: string
  company_logo_url?: string
  company_description?: string
  website?: string
  verified: boolean
  business_type?: BusinessType
  city?: string
  address?: string
  subscription_plan?: string
  subscription_expires_at?: string
  photos?: string[]
  is_premium?: boolean
  premium_expires_at?: string
  badges?: string[]
  created_at: string
  updated_at: string
}

export interface Job {
  id: string
  business_id: string
  title: string
  category: JobCategory
  contract_type: ContractType
  position: string
  description: string
  requirements?: string
  salary_min?: number
  salary_max?: number
  salary_display?: string
  city?: string
  location: string
  latitude?: number
  longitude?: number
  start_date?: string
  work_schedule?: string
  experience_required?: string
  benefits?: string
  vacancies?: number
  is_flash?: boolean
  is_highlighted?: boolean
  flash_expires_at?: string
  highlight_expires_at?: string
  uniform_required?: boolean
  languages_required?: string[]
  tpv_required?: boolean
  is_active: boolean
  views: number
  created_at: string
  updated_at: string
}

export interface Application {
  id: string
  job_id: string
  worker_id: string
  cv_url?: string
  cover_letter?: string
  status: ApplicationStatus
  created_at: string
  updated_at: string
}
