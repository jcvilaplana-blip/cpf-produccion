"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// =====================================================
// JOB ACTIONS
// =====================================================

export async function createJobAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" }

  const { error } = await supabase.from("jobs").insert({
    business_id: user.id,
    title: formData.get("title") as string,
    description: formData.get("description") as string,
    category: formData.get("category") as string,
    city: formData.get("location") as string,
    location: formData.get("location") as string,
    contract_type: formData.get("workType") as string,
    work_schedule: formData.get("schedule") as string,
    salary_min: Number(formData.get("salaryMin")) || null,
    salary_max: Number(formData.get("salaryMax")) || null,
    salary_display: formData.get("salaryDisplay") as string || null,
    experience_required: formData.get("experience") as string,
    requirements: formData.get("requirements") as string,
    benefits: formData.get("benefits") as string,
    position: formData.get("position") as string || "Junior",
    is_active: true,
  })

  if (error) return { error: error.message }

  revalidatePath("/my-jobs")
  revalidatePath("/dashboard")
  return { success: true }
}

export async function updateJobAction(jobId: string, updates: Record<string, unknown>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" }

  const { error } = await supabase
    .from("jobs")
    .update(updates)
    .eq("id", jobId)
    .eq("business_id", user.id)

  if (error) return { error: error.message }

  revalidatePath("/my-jobs")
  revalidatePath(`/jobs/${jobId}`)
  return { success: true }
}

export async function deleteJobAction(jobId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" }

  const { error } = await supabase
    .from("jobs")
    .delete()
    .eq("id", jobId)
    .eq("business_id", user.id)

  if (error) return { error: error.message }

  revalidatePath("/my-jobs")
  revalidatePath("/dashboard")
  return { success: true }
}

export async function toggleJobActiveAction(jobId: string, isActive: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" }

  const { error } = await supabase
    .from("jobs")
    .update({ is_active: isActive })
    .eq("id", jobId)
    .eq("business_id", user.id)

  if (error) return { error: error.message }

  revalidatePath("/my-jobs")
  return { success: true }
}

// =====================================================
// APPLICATION ACTIONS
// =====================================================

export async function applyToJobAction(jobId: string, coverLetter?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" }

  // Check if already applied
  const { data: existing } = await supabase
    .from("applications")
    .select("id")
    .eq("job_id", jobId)
    .eq("worker_id", user.id)
    .maybeSingle()

  if (existing) return { error: "Ya has aplicado a esta oferta" }

  const { error } = await supabase.from("applications").insert({
    job_id: jobId,
    worker_id: user.id,
    cover_letter: coverLetter || null,
    status: "pending",
  })

  if (error) return { error: error.message }

  revalidatePath(`/jobs/${jobId}`)
  revalidatePath("/profile")
  return { success: true }
}

export async function updateApplicationStatusAction(
  applicationId: string,
  status: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" }

  const { error } = await supabase
    .from("applications")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", applicationId)

  if (error) return { error: error.message }

  revalidatePath("/my-jobs")
  return { success: true }
}

export async function withdrawApplicationAction(applicationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" }

  const { error } = await supabase
    .from("applications")
    .update({ status: "withdrawn" })
    .eq("id", applicationId)
    .eq("worker_id", user.id)

  if (error) return { error: error.message }

  revalidatePath("/profile")
  return { success: true }
}

// =====================================================
// SAVED JOBS ACTIONS
// =====================================================

export async function saveJobAction(jobId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" }

  const { data: existing } = await supabase
    .from("saved_jobs")
    .select("id")
    .eq("user_id", user.id)
    .eq("job_id", jobId)
    .maybeSingle()

  if (existing) {
    // Unsave
    await supabase
      .from("saved_jobs")
      .delete()
      .eq("user_id", user.id)
      .eq("job_id", jobId)

    revalidatePath("/saved")
    return { saved: false }
  }

  // Save
  const { error } = await supabase.from("saved_jobs").insert({
    user_id: user.id,
    job_id: jobId,
  })

  if (error) return { error: error.message }

  revalidatePath("/saved")
  return { saved: true }
}

// =====================================================
// SAVED PROFILES ACTIONS
// =====================================================

export async function saveProfileAction(workerId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" }

  const { data: existing } = await supabase
    .from("saved_profiles")
    .select("id")
    .eq("business_id", user.id)
    .eq("worker_id", workerId)
    .maybeSingle()

  if (existing) {
    await supabase
      .from("saved_profiles")
      .delete()
      .eq("business_id", user.id)
      .eq("worker_id", workerId)
    return { saved: false }
  }

  const { error } = await supabase.from("saved_profiles").insert({
    business_id: user.id,
    worker_id: workerId,
  })

  if (error) return { error: error.message }
  return { saved: true }
}

// =====================================================
// PROFILE ACTIONS
// =====================================================

export async function updateProfileAction(updates: Record<string, unknown>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" }

  const { error } = await supabase
    .from("profiles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", user.id)

  if (error) return { error: error.message }

  revalidatePath("/profile")
  revalidatePath("/edit-profile")
  revalidatePath("/dashboard")
  return { success: true }
}

export async function updateBusinessProfileAction(updates: Record<string, unknown>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" }

  const { error } = await supabase
    .from("business_profiles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", user.id)

  if (error) return { error: error.message }

  revalidatePath("/profile")
  revalidatePath("/business-profile-view")
  return { success: true }
}

// =====================================================
// RATING ACTIONS
// =====================================================

export async function createRatingAction(
  toUserId: string,
  jobId: string,
  score: number,
  comment: string,
  criteria?: Record<string, number>
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" }

  const { error } = await supabase.from("ratings").insert({
    from_user_id: user.id,
    to_user_id: toUserId,
    job_id: jobId,
    score,
    comment,
    criteria: criteria || null,
  })

  if (error) return { error: error.message }

  // Update average rating on the profile
  const { data: ratings } = await supabase
    .from("ratings")
    .select("score")
    .eq("to_user_id", toUserId)

  if (ratings && ratings.length > 0) {
    const avg = ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length
    await supabase
      .from("profiles")
      .update({
        rating: Math.round(avg * 10) / 10,
        total_ratings: ratings.length,
      })
      .eq("id", toUserId)
  }

  revalidatePath(`/profile/${toUserId}`)
  return { success: true }
}
