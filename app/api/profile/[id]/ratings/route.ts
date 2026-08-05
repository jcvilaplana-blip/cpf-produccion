export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

/**
 * Real ratings for a profile: the reviews themselves, who wrote them and for
 * which job, plus the aggregates the ratings page needs (distribution and
 * per-criterion averages). Reviewers are resolved in a second query instead of
 * a PostgREST join so this does not depend on the FK constraint name.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) {
    return NextResponse.json({ error: "Server config error" }, { status: 500 })
  }

  const supabase = createClient(url, key)

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, job_category, specialties, rating, total_ratings, user_type")
    .eq("id", id)
    .eq("is_active", true)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 })
  }

  const { data: ratings } = await supabase
    .from("ratings")
    .select("id, from_user_id, job_id, score, comment, criteria, created_at")
    .eq("to_user_id", id)
    .order("created_at", { ascending: false })

  const rows = ratings || []

  const reviewerIds = [...new Set(rows.map((r) => r.from_user_id).filter(Boolean))]
  const jobIds = [...new Set(rows.map((r) => r.job_id).filter(Boolean))]

  const [{ data: reviewers }, { data: jobs }] = await Promise.all([
    reviewerIds.length
      ? supabase.from("profiles").select("id, display_name, avatar_url, user_type").in("id", reviewerIds)
      : Promise.resolve({ data: [] as any[] }),
    jobIds.length
      ? supabase.from("jobs").select("id, title").in("id", jobIds)
      : Promise.resolve({ data: [] as any[] }),
  ])

  const reviewerById = new Map((reviewers || []).map((r) => [r.id, r]))
  const jobById = new Map((jobs || []).map((j) => [j.id, j]))

  const reviews = rows.map((r) => {
    const reviewer = reviewerById.get(r.from_user_id)
    return {
      id: r.id,
      score: r.score,
      comment: r.comment,
      created_at: r.created_at,
      criteria: typeof r.criteria === "string" ? safeParse(r.criteria) : r.criteria || null,
      job_title: jobById.get(r.job_id)?.title || null,
      reviewer_name: reviewer?.display_name || "Empresa",
      reviewer_avatar: reviewer?.avatar_url || null,
      reviewer_type: reviewer?.user_type || "business",
    }
  })

  // Distribution 1..5
  const distribution: Record<string, number> = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 }
  rows.forEach((r) => {
    const rounded = Math.round(Number(r.score))
    if (rounded >= 1 && rounded <= 5) distribution[String(rounded)] += 1
  })

  // Per-criterion averages
  const totals: Record<string, { sum: number; count: number }> = {}
  reviews.forEach((review) => {
    if (!review.criteria || typeof review.criteria !== "object") return
    Object.entries(review.criteria as Record<string, unknown>).forEach(([k, v]) => {
      const numeric = typeof v === "number" ? v : Number(v)
      if (!Number.isFinite(numeric)) return
      if (!totals[k]) totals[k] = { sum: 0, count: 0 }
      totals[k].sum += numeric
      totals[k].count += 1
    })
  })
  const criteriaSummary: Record<string, number> = {}
  Object.entries(totals).forEach(([k, { sum, count }]) => {
    criteriaSummary[k] = Math.round((sum / count) * 10) / 10
  })

  const average =
    rows.length > 0 ? Math.round((rows.reduce((s, r) => s + Number(r.score), 0) / rows.length) * 10) / 10 : 0

  return NextResponse.json({
    data: {
      profile,
      reviews,
      distribution,
      criteria_summary: criteriaSummary,
      average,
      total: rows.length,
    },
  })
}

function safeParse(value: string) {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}
