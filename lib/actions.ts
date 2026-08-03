"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { notifyUser } from "@/lib/notifications/create-notification"

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
// INTERVIEW REQUEST ACTIONS
// =====================================================

const INTERVIEW_TYPE_LABELS: Record<string, string> = {
  call: "una llamada",
  in_person: "una entrevista presencial",
  video_call: "una videoconferencia",
  other: "una entrevista",
}

export async function createInterviewRequestAction(
  jobId: string,
  workerId: string,
  interviewType: "call" | "in_person" | "video_call" | "other",
  scheduledAt: string,
  otherTypeDetail?: string,
  notes?: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" }

  const { data: job } = await supabase
    .from("jobs")
    .select("id, business_id, title")
    .eq("id", jobId)
    .single()

  if (!job || job.business_id !== user.id) return { error: "No autorizado" }

  // Find an existing application for this (job, worker) pair, or create one -
  // a business can request an interview with a candidate it found by browsing,
  // not only with someone who already applied.
  let applicationId: string
  const { data: existingApplication } = await supabase
    .from("applications")
    .select("id")
    .eq("job_id", jobId)
    .eq("worker_id", workerId)
    .maybeSingle()

  if (existingApplication) {
    applicationId = existingApplication.id
    await updateApplicationStatusAction(applicationId, "interview")
  } else {
    const { data: newApplication, error: createError } = await supabase
      .from("applications")
      .insert({ job_id: jobId, worker_id: workerId, status: "interview" })
      .select("id")
      .single()
    if (createError || !newApplication) return { error: createError?.message || "No se pudo crear la solicitud" }
    applicationId = newApplication.id
  }

  const { data: interview, error } = await supabase
    .from("interview_requests")
    .insert({
      application_id: applicationId,
      business_id: user.id,
      worker_id: workerId,
      interview_type: interviewType,
      other_type_detail: interviewType === "other" ? otherTypeDetail || null : null,
      scheduled_at: scheduledAt,
      notes: notes || null,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  const { data: businessProfile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single()

  await notifyUser(workerId, {
    title: "Nueva solicitud de entrevista",
    body: `${businessProfile?.display_name || "Una empresa"} te ha propuesto ${INTERVIEW_TYPE_LABELS[interviewType]} para el puesto de ${job.title}`,
    type: "entrevista",
    link: `/messages?businessId=${user.id}`,
    createdBy: user.id,
  })

  revalidatePath("/messages")
  revalidatePath("/interviews")
  return { success: true, data: interview }
}

export async function respondToInterviewRequestAction(
  interviewId: string,
  response: "confirmed" | "cancelled"
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" }

  const { data: interview } = await supabase
    .from("interview_requests")
    .select("id, application_id, business_id, worker_id, status")
    .eq("id", interviewId)
    .single()

  if (!interview) return { error: "Entrevista no encontrada" }
  if (interview.worker_id !== user.id) return { error: "No autorizado" }
  if (interview.status !== "pending") return { error: "Esta entrevista ya no está pendiente" }

  const { error } = await supabase
    .from("interview_requests")
    .update({ status: response, updated_at: new Date().toISOString() })
    .eq("id", interviewId)

  if (error) return { error: error.message }

  if (response === "cancelled") {
    await updateApplicationStatusAction(interview.application_id, "pending")
  }

  const { data: workerProfile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single()

  await notifyUser(interview.business_id, {
    title: response === "confirmed" ? "Entrevista confirmada" : "Entrevista cancelada",
    body: `${workerProfile?.display_name || "El candidato"} ha ${response === "confirmed" ? "confirmado" : "cancelado"} la entrevista propuesta`,
    type: "entrevista",
    link: `/messages?candidateId=${user.id}`,
    createdBy: user.id,
  })

  revalidatePath("/messages")
  return { success: true }
}

export async function resolveInterviewRequestAction(
  interviewId: string,
  resolution: "approved" | "cancelled"
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" }

  const { data: interview } = await supabase
    .from("interview_requests")
    .select("id, application_id, business_id, worker_id, status")
    .eq("id", interviewId)
    .single()

  if (!interview) return { error: "Entrevista no encontrada" }
  if (interview.business_id !== user.id) return { error: "No autorizado" }
  if (interview.status !== "confirmed") return { error: "Esta entrevista aún no ha sido confirmada por el candidato" }

  const { error } = await supabase
    .from("interview_requests")
    .update({ status: resolution, updated_at: new Date().toISOString() })
    .eq("id", interviewId)

  if (error) return { error: error.message }

  await updateApplicationStatusAction(interview.application_id, resolution === "approved" ? "accepted" : "rejected")

  const { data: businessProfile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single()

  await notifyUser(interview.worker_id, {
    title: resolution === "approved" ? "¡Has sido contratado!" : "Proceso finalizado",
    body: resolution === "approved"
      ? `${businessProfile?.display_name || "La empresa"} te ha contratado tras la entrevista`
      : `${businessProfile?.display_name || "La empresa"} ha decidido no continuar el proceso`,
    type: "entrevista",
    link: `/messages?businessId=${user.id}`,
    createdBy: user.id,
  })

  revalidatePath("/messages")
  revalidatePath(`/profile/${interview.worker_id}`)
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
