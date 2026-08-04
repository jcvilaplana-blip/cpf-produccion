export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { awardPoints, POINTS } from "@/lib/gamification/award-points"

// GET public profile by ID - no auth required
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) {
    return NextResponse.json({ error: "Server config error" }, { status: 500 })
  }

  const supabase = createClient(url, key)

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .eq("is_active", true)
    .single()

  if (error || !profile) {
    return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 })
  }

  // Remove sensitive fields
  const { is_admin, ...safeProfile } = profile

  // "Estado laboral" 5º/4º valor (En entrevista / En contacto) - calculado
  // aquí, no autoinformado, para que no se pueda falsear (ver lib/profile-status.ts).
  let hasActiveInterview = false
  let hasOpenApplication = false
  if (profile.user_type === "worker") {
    const [{ count: interviewCount }, { count: applicationCount }] = await Promise.all([
      supabase.from("interview_requests").select("id", { count: "exact", head: true }).eq("worker_id", id).in("status", ["pending", "confirmed"]),
      supabase.from("applications").select("id", { count: "exact", head: true }).eq("worker_id", id).in("status", ["pending", "interview"]),
    ])
    hasActiveInterview = (interviewCount || 0) > 0
    hasOpenApplication = (applicationCount || 0) > 0
  }

  // Best-effort: log the view + "10 distinct profiles in a day" bonus. Uses
  // the cookie-based server client only to identify the viewer (this route
  // itself stays public/no-auth-required for the profile read above).
  try {
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const sessionClient = await createServerClient()
      const { data: { user: viewer } } = await sessionClient.auth.getUser()
      if (viewer && viewer.id !== id) {
        const serviceClient = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY)
        await serviceClient.from("profile_views").insert({ viewer_id: viewer.id, viewed_profile_id: id })

        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)
        const { data: todaysViews } = await serviceClient
          .from("profile_views")
          .select("viewed_profile_id")
          .eq("viewer_id", viewer.id)
          .gte("created_at", todayStart.toISOString())
        const distinctCount = new Set((todaysViews || []).map((v) => v.viewed_profile_id)).size

        if (distinctCount === 10) {
          const { count: alreadyAwardedToday } = await serviceClient
            .from("points_ledger")
            .select("id", { count: "exact", head: true })
            .eq("user_id", viewer.id)
            .eq("reason", "daily_profile_views")
            .gte("created_at", todayStart.toISOString())
          if (!alreadyAwardedToday) {
            const { data: viewerProfile } = await serviceClient.from("profiles").select("user_type").eq("id", viewer.id).single()
            await awardPoints(
              serviceClient,
              viewer.id,
              POINTS.dailyProfileViewBonus,
              "daily_profile_views",
              undefined,
              viewerProfile?.user_type === "business" ? "business" : "worker"
            )
          }
        }
      }
    }
  } catch (err) {
    console.error("GET /api/profile/[id]: view tracking failed", err)
  }

  const { data: ratingsData } = await supabase
    .from("ratings")
    .select("criteria")
    .eq("to_user_id", id)
    .not("criteria", "is", null)

  const ratingCriteriaSummary: Record<string, number> = {}
  if (ratingsData && Array.isArray(ratingsData)) {
    const totals: Record<string, { sum: number; count: number }> = {}
    ratingsData.forEach((rating) => {
      const rawCriteria = rating.criteria
      let criteria: Record<string, unknown> | null = null
      if (typeof rawCriteria === "string") {
        try {
          criteria = JSON.parse(rawCriteria)
        } catch {
          criteria = null
        }
      } else if (rawCriteria && typeof rawCriteria === "object") {
        criteria = rawCriteria as Record<string, unknown>
      }

      if (!criteria) return
      Object.entries(criteria).forEach(([key, value]) => {
        const numeric = typeof value === "number" ? value : Number(value)
        if (!Number.isFinite(numeric)) return
        if (!totals[key]) totals[key] = { sum: 0, count: 0 }
        totals[key].sum += numeric
        totals[key].count += 1
      })
    })

    Object.entries(totals).forEach(([key, { sum, count }]) => {
      ratingCriteriaSummary[key] = Math.round((sum / count) * 10) / 10
    })
  }

  return NextResponse.json({
    data: {
      ...safeProfile,
      has_active_interview: hasActiveInterview,
      has_open_application: hasOpenApplication,
      rating_criteria_summary: ratingCriteriaSummary,
    },
  })
}
