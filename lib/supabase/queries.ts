// =====================================================
// SUPABASE QUERIES - Real Database Operations
// =====================================================

import { createClient } from "@/lib/supabase/client"

// =====================================================
// AUTH & PROFILES
// =====================================================

export async function getCurrentUser() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session?.user ?? null
}

export async function getCurrentProfile() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) return { data: null, error: null }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  return { data, error }
}

export async function updateProfile(id: string, updates: Record<string, unknown>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  return { data, error }
}

export async function getProfileById(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single()

  return { data, error }
}

// =====================================================
// BUSINESS PROFILES
// =====================================================

export async function getBusinessProfile(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("business_profiles")
    .select("*")
    .eq("id", userId)
    .single()

  return { data, error }
}

export async function upsertBusinessProfile(userId: string, updates: Record<string, unknown>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("business_profiles")
    .upsert({ id: userId, ...updates })
    .select()
    .single()

  return { data, error }
}

export async function getAllBusinessProfiles(filters?: {
  city?: string
  business_type?: string
  limit?: number
  offset?: number
}) {
  const supabase = createClient()
  let query = supabase
    .from("business_profiles")
    .select("*")

  if (filters?.city) {
    query = query.ilike("city", `%${filters.city}%`)
  }
  if (filters?.business_type) {
    query = query.eq("business_type", filters.business_type)
  }
  if (filters?.limit) {
    query = query.limit(filters.limit)
  }
  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
  }

  query = query.order("created_at", { ascending: false })
  const { data, error } = await query

  return { data, error }
}

// =====================================================
// JOBS
// =====================================================

export async function getJobs(filters?: {
  category?: string
  city?: string
  contract_type?: string
  is_active?: boolean
  business_id?: string
  limit?: number
  offset?: number
}) {
  const supabase = createClient()
  let query = supabase
    .from("jobs")
    .select("*")

  if (filters?.is_active !== undefined) {
    query = query.eq("is_active", filters.is_active)
  } else {
    query = query.eq("is_active", true)
  }
  if (filters?.category) {
    query = query.eq("category", filters.category)
  }
  if (filters?.city) {
    query = query.ilike("city", `%${filters.city}%`)
  }
  if (filters?.contract_type) {
    query = query.eq("contract_type", filters.contract_type)
  }
  if (filters?.business_id) {
    query = query.eq("business_id", filters.business_id)
  }
  if (filters?.limit) {
    query = query.limit(filters.limit)
  }
  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
  }

  query = query.order("created_at", { ascending: false })
  const { data, error } = await query

  return { data, error }
}

export async function getJobById(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", id)
    .single()

  return { data, error }
}

export async function createJob(job: Record<string, unknown>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("jobs")
    .insert(job)
    .select()
    .single()

  return { data, error }
}

export async function updateJob(id: string, updates: Record<string, unknown>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("jobs")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  return { data, error }
}

export async function deleteJob(id: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from("jobs")
    .delete()
    .eq("id", id)

  return { error }
}

// =====================================================
// APPLICATIONS
// =====================================================

export async function getApplicationsForJob(jobId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .eq("job_id", jobId)
    .order("created_at", { ascending: false })

  return { data, error }
}

export async function getApplicationsForWorker(workerId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .eq("worker_id", workerId)
    .order("created_at", { ascending: false })

  return { data, error }
}

export async function createApplication(application: Record<string, unknown>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("applications")
    .insert(application)
    .select()
    .single()

  return { data, error }
}

export async function updateApplicationStatus(id: string, status: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("applications")
    .update({ status })
    .eq("id", id)
    .select()
    .single()

  return { data, error }
}

// =====================================================
// SAVED JOBS
// =====================================================

export async function getSavedJobs(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("saved_jobs")
    .select("*, jobs(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  return { data, error }
}

export async function saveJob(userId: string, jobId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("saved_jobs")
    .insert({ user_id: userId, job_id: jobId })
    .select()
    .single()

  return { data, error }
}

export async function unsaveJob(userId: string, jobId: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from("saved_jobs")
    .delete()
    .eq("user_id", userId)
    .eq("job_id", jobId)

  return { error }
}

export async function isJobSaved(userId: string, jobId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("saved_jobs")
    .select("id")
    .eq("user_id", userId)
    .eq("job_id", jobId)
    .maybeSingle()

  return { isSaved: !!data, error }
}

// =====================================================
// RATINGS
// =====================================================

export async function getRatingsForUser(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("ratings")
    .select("*")
    .eq("to_user_id", userId)
    .order("created_at", { ascending: false })

  return { data, error }
}

export async function createRating(rating: Record<string, unknown>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("ratings")
    .insert(rating)
    .select()
    .single()

  return { data, error }
}

// =====================================================
// MESSAGES
// =====================================================

export async function getConversations(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order("created_at", { ascending: false })

  return { data, error }
}

export async function getMessagesBetweenUsers(userId1: string, userId2: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .or(
      `and(sender_id.eq.${userId1},receiver_id.eq.${userId2}),and(sender_id.eq.${userId2},receiver_id.eq.${userId1})`
    )
    .order("created_at", { ascending: true })

  return { data, error }
}

export async function sendMessage(message: Record<string, unknown>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("messages")
    .insert(message)
    .select()
    .single()

  return { data, error }
}

export async function markMessagesAsRead(senderId: string, receiverId: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from("messages")
    .update({ read: true })
    .eq("sender_id", senderId)
    .eq("receiver_id", receiverId)
    .eq("read", false)

  return { error }
}

// =====================================================
// SAVED PROFILES (businesses save workers)
// =====================================================

export async function getSavedProfiles(businessId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("saved_profiles")
    .select("*, profile:profiles(*)")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })

  return { data, error }
}

export async function saveProfile(businessId: string, profileId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("saved_profiles")
    .insert({ business_id: businessId, worker_id: profileId })
    .select()
    .single()

  return { data, error }
}

export async function unsaveProfile(businessId: string, profileId: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from("saved_profiles")
    .delete()
    .eq("business_id", businessId)
    .eq("worker_id", profileId)

  return { error }
}

export async function isProfileSaved(businessId: string, profileId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("saved_profiles")
    .select("id")
    .eq("business_id", businessId)
    .eq("worker_id", profileId)
    .maybeSingle()

  return { isSaved: !!data, error }
}

// =====================================================
// WORKER PROFILES (search/browse)
// =====================================================

export async function getWorkerProfiles(filters?: {
  category?: string
  city?: string
  limit?: number
  offset?: number
}) {
  const supabase = createClient()
  let query = supabase
    .from("profiles")
    .select("*")
    .eq("user_type", "worker")
    .eq("is_active", true)

  if (filters?.category) {
    query = query.eq("job_category", filters.category)
  }
  if (filters?.city) {
    query = query.ilike("location", `%${filters.city}%`)
  }
  if (filters?.limit) {
    query = query.limit(filters.limit)
  }
  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
  }

  query = query.order("rating", { ascending: false })
  const { data, error } = await query

  return { data, error }
}
