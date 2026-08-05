"use server"

import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import { notifyUser } from "@/lib/notifications/create-notification"
import { notifyMatchingCandidates } from "@/lib/matching/notify-match-alerts"
import { notifyFlashOfferCandidates } from "@/lib/payments/flash-fanout"
import { checkAndSendInterviewReminders } from "@/lib/interview-reminders"
import { awardPoints, hasRecentAward, getPointsBalance, POINTS } from "@/lib/gamification/award-points"
import { checkBadges } from "@/lib/gamification/check-badges"
import { isWorkerProfileComplete, isBusinessProfileComplete } from "@/lib/gamification/profile-completeness"

function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createServiceClient(url, key)
}

// =====================================================
// JOB ACTIONS
// =====================================================

export interface CreateJobPayload {
  title: string
  description: string
  category: string
  position: string
  city: string
  latitude?: number | null
  longitude?: number | null
  contract_type: string
  work_schedule?: string | null
  salary_min?: number | null
  salary_max?: number | null
  experience_required?: string | null
  requirements?: string | null
  benefits?: string | null
  image_url?: string | null
  vacancies?: number | null
  start_date?: string | null
  uniform_required?: boolean
  languages_required?: string[]
  tpv_required?: boolean
}

// Non-flash job publishing only - flash offers go through
// /api/micropayments/create instead, since they stay inactive until the
// Stripe webhook confirms the 5€ charge (see components/create-job-content.tsx).
// Centralizing regular publishing here (instead of the client inserting
// directly) gives 7.2's match-alert fan-out a single, reliable trigger point.
export async function createJobAction(payload: CreateJobPayload) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" }

  const { data: job, error } = await supabase
    .from("jobs")
    .insert({
      business_id: user.id,
      ...payload,
      is_active: true,
      is_flash: false,
    })
    .select("id, title, city, location, contract_type, category, position")
    .single()

  if (error || !job) return { error: error?.message || "Error al publicar la oferta" }

  revalidatePath("/my-jobs")
  revalidatePath("/dashboard")
  revalidatePath("/jobs")

  // Best-effort: a notification failure must never block the job from
  // publishing - the insert above already succeeded and is authoritative.
  try {
    const serviceClient = getServiceRoleClient()
    if (serviceClient) {
      await notifyMatchingCandidates(serviceClient, job)
    }
  } catch (err) {
    console.error("createJobAction: match-alert fan-out failed", err)
  }

  return { success: true, jobId: job.id }
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

  const { data: application } = await supabase
    .from("applications")
    .select("id, worker_id, job_id")
    .eq("id", applicationId)
    .single()

  const { error } = await supabase
    .from("applications")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", applicationId)

  if (error) return { error: error.message }

  // "Contratación efectiva" - covers both a direct accept here AND
  // resolveInterviewRequestAction's approval path, since that function
  // routes through this same one. Points both parties; best-effort.
  if (status === "accepted" && application) {
    try {
      const serviceClient = getServiceRoleClient()
      if (serviceClient) {
        const { data: job } = await serviceClient.from("jobs").select("business_id").eq("id", application.job_id).single()
        await awardPoints(serviceClient, application.worker_id, POINTS.hired, "hired", applicationId, "worker")
        await checkBadges(serviceClient, application.worker_id, "worker")
        if (job?.business_id) {
          await awardPoints(serviceClient, job.business_id, POINTS.hired, "hired", applicationId, "business")
          await checkBadges(serviceClient, job.business_id, "business")
        }
      }
    } catch (err) {
      console.error("updateApplicationStatusAction: points award failed", err)
    }
  }

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
  } else {
    try {
      const serviceClient = getServiceRoleClient()
      if (serviceClient) {
        await awardPoints(serviceClient, user.id, POINTS.interviewConfirmed, "interview_confirmed", interviewId, "worker")
        await checkBadges(serviceClient, user.id, "worker")
      }
    } catch (err) {
      console.error("respondToInterviewRequestAction: points award failed", err)
    }
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
// CANDIDATE PREMIUM ACTIONS
// =====================================================

// 7.1: lets a premium candidate signal direct interest in a venue itself
// (not tied to any specific open job posting), unlike applyToJobAction.
// Modeled on createInterviewRequestAction's shape, one-shot with no
// response workflow - a notification row is enough, no dedicated table.
export async function requestToWorkHereAction(businessId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, user_type, is_premium, premium_expires_at")
    .eq("id", user.id)
    .single()

  if (!profile || profile.user_type !== "worker") return { error: "No autorizado" }

  const isPremiumActive =
    profile.is_premium && (!profile.premium_expires_at || new Date(profile.premium_expires_at) > new Date())
  if (!isPremiumActive) return { error: "Esta función es exclusiva para candidatos premium" }

  await notifyUser(businessId, {
    title: "Un candidato quiere trabajar contigo",
    body: `${profile.display_name || "Un candidato"} ha marcado tu negocio como donde le gustaría trabajar`,
    type: "interes",
    link: `/profile/${user.id}`,
    createdBy: user.id,
  })

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
  try {
    return await updateProfile(updates)
  } catch (err) {
    // Any throw here reaches the browser as an opaque server-action failure,
    // so convert it into a message the edit screen can actually show.
    console.error("updateProfileAction failed:", err)
    return { error: err instanceof Error ? err.message : "Error al guardar el perfil" }
  }
}

async function updateProfile(updates: Record<string, unknown>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" }

  const { data: before } = await supabase
    .from("profiles")
    .select("availability_status, availability_updated_at, portfolio_images, portfolio_videos, profile_completed_at, avatar_url, bio, location, job_category, specialties, referred_by")
    .eq("id", user.id)
    .single()

  const finalUpdates: Record<string, unknown> = { ...updates, updated_at: new Date().toISOString() }

  // Weekly availability-update bonus: only stamp a fresh availability_updated_at
  // (and award) if the value actually changed and ≥7 days passed since the last one.
  let awardAvailability = false
  if ("availability_status" in updates && updates.availability_status !== before?.availability_status) {
    const last = before?.availability_updated_at ? new Date(before.availability_updated_at).getTime() : 0
    if (Date.now() - last >= 7 * 24 * 60 * 60 * 1000) {
      finalUpdates.availability_updated_at = new Date().toISOString()
      awardAvailability = true
    }
  }

  const { error } = await supabase.from("profiles").update(finalUpdates).eq("id", user.id)
  if (error) return { error: error.message }

  // Best-effort gamification side effects - never block a profile save.
  try {
    const serviceClient = getServiceRoleClient()
    if (serviceClient) {
      if (awardAvailability) {
        await awardPoints(serviceClient, user.id, POINTS.availabilityUpdatedWeekly, "availability_updated", undefined, "worker")
      }

      const beforePhotos = (before?.portfolio_images as string[] | null)?.length || 0
      const afterPhotos = Array.isArray(updates.portfolio_images) ? (updates.portfolio_images as string[]).length : beforePhotos
      if (afterPhotos > beforePhotos && !(await hasRecentAward(serviceClient, user.id, "portfolio_photo", 30))) {
        await awardPoints(serviceClient, user.id, POINTS.portfolioPhotoMonthly, "portfolio_photo", undefined, "worker")
      }

      if (!before?.profile_completed_at) {
        const merged = { ...before, ...updates } as any
        if (isWorkerProfileComplete(merged)) {
          await supabase.from("profiles").update({ profile_completed_at: new Date().toISOString() }).eq("id", user.id)
          await awardPoints(serviceClient, user.id, POINTS.profileComplete, "profile_complete", undefined, "worker")
          if (before?.referred_by) {
            await awardPoints(serviceClient, before.referred_by, POINTS.referralCompleted, "referral_completed", user.id)
          }
        }
      }

      await checkBadges(serviceClient, user.id, "worker")
    }
  } catch (err) {
    console.error("updateProfileAction: gamification side effects failed", err)
  }

  revalidatePath("/profile")
  revalidatePath("/edit-profile")
  revalidatePath("/dashboard")
  return { success: true }
}

export async function updateBusinessProfileAction(updates: Record<string, unknown>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" }

  const { data: before } = await supabase
    .from("business_profiles")
    .select("profile_completed_at, company_logo_url, company_description, city, address, phone")
    .eq("id", user.id)
    .single()

  const { error } = await supabase
    .from("business_profiles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", user.id)

  if (error) return { error: error.message }

  try {
    const serviceClient = getServiceRoleClient()
    if (serviceClient) {
      if (!before?.profile_completed_at) {
        const merged = { ...before, ...updates } as any
        if (isBusinessProfileComplete(merged)) {
          await supabase.from("business_profiles").update({ profile_completed_at: new Date().toISOString() }).eq("id", user.id)
          await awardPoints(serviceClient, user.id, POINTS.profileComplete, "profile_complete", undefined, "business")
        }
      }
      await checkBadges(serviceClient, user.id, "business")
    }
  } catch (err) {
    console.error("updateBusinessProfileAction: gamification side effects failed", err)
  }

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

  // Only businesses/workers that actually interacted over this job (hired,
  // or an interview that was at least confirmed) can rate each other - a
  // plain "any authenticated user with a jobId" check let anyone rate
  // anyone before this.
  const { data: job } = await supabase.from("jobs").select("business_id").eq("id", jobId).single()
  if (!job) return { error: "Oferta no encontrada" }

  const isRaterBusiness = job.business_id === user.id
  const isRateeBusiness = job.business_id === toUserId
  if (!isRaterBusiness && !isRateeBusiness) return { error: "No autorizado" }
  const workerId = isRaterBusiness ? toUserId : user.id

  const { data: application } = await supabase
    .from("applications")
    .select("id, status")
    .eq("job_id", jobId)
    .eq("worker_id", workerId)
    .maybeSingle()

  let hasRealInteraction = application?.status === "accepted"
  if (!hasRealInteraction && application) {
    const { count } = await supabase
      .from("interview_requests")
      .select("id", { count: "exact", head: true })
      .eq("application_id", application.id)
      .in("status", ["confirmed", "approved"])
    hasRealInteraction = (count || 0) > 0
  }
  if (!hasRealInteraction) return { error: "Solo puedes valorar tras una entrevista confirmada o una contratación" }

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

  try {
    const serviceClient = getServiceRoleClient()
    if (serviceClient) {
      await awardPoints(serviceClient, user.id, POINTS.ratingLeft, "rating_left", toUserId, isRaterBusiness ? "business" : "worker")
      // The ratee's average just changed - re-check their badges (Profesional / Alta Satisfacción).
      await checkBadges(serviceClient, toUserId, isRateeBusiness ? "business" : "worker")
    }
  } catch (err) {
    console.error("createRatingAction: points award failed", err)
  }

  revalidatePath(`/profile/${toUserId}`)
  return { success: true }
}

// =====================================================
// GAMIFICATION - REWARD REDEMPTION
// =====================================================

interface RewardDef {
  cost: number
  roles: Array<"worker" | "business">
  label: string
}

// NOT exported: this file is "use server", where every export must be an async
// function. Exporting this object made Next throw "A \"use server\" file can
// only export async functions, found object" while rendering any page that
// imports this module - which is what broke saving the profile.
const REWARD_CATALOG: Record<string, RewardDef> = {
  premium_profile: { cost: 500, roles: ["worker", "business"], label: "Perfil Premium (7 días)" },
  free_flash_offer: { cost: 300, roles: ["business"], label: "Oferta Flash gratuita" },
  highlight_credit: { cost: 200, roles: ["business"], label: "Destacar oferta gratis" },
  cosmetic_theme_bronze: { cost: 100, roles: ["worker", "business"], label: "Personalización — Bronce" },
  cosmetic_theme_silver: { cost: 150, roles: ["worker", "business"], label: "Personalización — Plata" },
  cosmetic_theme_gold: { cost: 200, roles: ["worker", "business"], label: "Personalización — Oro" },
}

const THEME_BY_REWARD: Record<string, string> = {
  cosmetic_theme_bronze: "bronze",
  cosmetic_theme_silver: "silver",
  cosmetic_theme_gold: "gold",
}

export async function redeemRewardAction(rewardKey: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" }

  const { data: profile } = await supabase.from("profiles").select("user_type").eq("id", user.id).single()
  const role: "worker" | "business" = profile?.user_type === "business" ? "business" : "worker"

  const reward = REWARD_CATALOG[rewardKey]
  if (!reward || !reward.roles.includes(role)) return { error: "Recompensa no disponible" }

  const serviceClient = getServiceRoleClient()
  if (!serviceClient) return { error: "Error de configuración" }

  const balance = await getPointsBalance(serviceClient, user.id, role)
  if (balance < reward.cost) return { error: "No tienes puntos suficientes" }

  const table = role === "business" ? "business_profiles" : "profiles"

  if (rewardKey === "premium_profile") {
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + 7)
    await serviceClient.from(table).update({ is_premium: true, premium_expires_at: endDate.toISOString() }).eq("id", user.id)
  } else if (rewardKey === "free_flash_offer") {
    const { data: biz } = await serviceClient.from("business_profiles").select("flash_credits").eq("id", user.id).single()
    await serviceClient.from("business_profiles").update({ flash_credits: (biz?.flash_credits || 0) + 1 }).eq("id", user.id)
  } else if (rewardKey === "highlight_credit") {
    const { data: biz } = await serviceClient.from("business_profiles").select("highlight_credits").eq("id", user.id).single()
    await serviceClient.from("business_profiles").update({ highlight_credits: (biz?.highlight_credits || 0) + 1 }).eq("id", user.id)
  } else if (THEME_BY_REWARD[rewardKey]) {
    await serviceClient.from(table).update({ profile_theme: THEME_BY_REWARD[rewardKey] }).eq("id", user.id)
  }

  await awardPoints(serviceClient, user.id, -reward.cost, `redeem_${rewardKey}`, undefined, role)

  revalidatePath("/rewards")
  revalidatePath("/profile")
  return { success: true }
}

// Spends a flash_credits/highlight_credits unit earned via redeemRewardAction
// to activate a job without going through Stripe - same activation +
// notification fan-out the webhook performs after a real payment.
export async function activateFlashWithCreditAction(jobId: string, flashDurationHours: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" }

  const { data: job } = await supabase.from("jobs").select("id, business_id").eq("id", jobId).single()
  if (!job || job.business_id !== user.id) return { error: "No autorizado" }

  const { data: biz } = await supabase.from("business_profiles").select("flash_credits").eq("id", user.id).single()
  if (!biz || (biz.flash_credits || 0) <= 0) return { error: "no_credit" }

  await supabase.from("business_profiles").update({ flash_credits: biz.flash_credits - 1 }).eq("id", user.id)

  const expiresAt = new Date(Date.now() + flashDurationHours * 60 * 60 * 1000).toISOString()
  const { error } = await supabase.from("jobs").update({ is_active: true, flash_expires_at: expiresAt }).eq("id", jobId)
  if (error) return { error: error.message }

  try {
    const serviceClient = getServiceRoleClient()
    if (serviceClient) {
      const { data: fullJob } = await serviceClient
        .from("jobs")
        .select("id, title, city, location, contract_type, category, position")
        .eq("id", jobId)
        .single()
      let notifiedUserIds = new Set<string>()
      if (fullJob) {
        const result = await notifyMatchingCandidates(serviceClient, fullJob)
        notifiedUserIds = result.notifiedUserIds
      }
      await notifyFlashOfferCandidates(serviceClient, jobId, notifiedUserIds)
    }
  } catch (err) {
    console.error("activateFlashWithCreditAction: fan-out failed", err)
  }

  revalidatePath("/my-jobs")
  revalidatePath("/jobs")
  return { success: true }
}

export async function activateHighlightWithCreditAction(jobId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" }

  const { data: job } = await supabase.from("jobs").select("id, business_id").eq("id", jobId).single()
  if (!job || job.business_id !== user.id) return { error: "No autorizado" }

  const { data: biz } = await supabase.from("business_profiles").select("highlight_credits").eq("id", user.id).single()
  if (!biz || (biz.highlight_credits || 0) <= 0) return { error: "no_credit" }

  await supabase.from("business_profiles").update({ highlight_credits: biz.highlight_credits - 1 }).eq("id", user.id)

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  const { error } = await supabase.from("jobs").update({ is_highlighted: true, highlight_expires_at: expiresAt }).eq("id", jobId)
  if (error) return { error: error.message }

  revalidatePath("/my-jobs")
  revalidatePath(`/jobs/${jobId}`)
  return { success: true }
}

// 5.1: called from the business dashboard (a client component, unlike the
// candidate one) on load - same pull-based reminder check.
export async function checkInterviewRemindersAction() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" }

  try {
    await checkAndSendInterviewReminders(supabase, user.id, "business")
  } catch (err) {
    console.error("checkInterviewRemindersAction failed", err)
  }
  return { success: true }
}
