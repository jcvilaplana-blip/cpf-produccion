export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { verifyAdmin } from "@/lib/admin-auth"

// Read-only ledger of Flash (5€) / Destacar (2.5€) job payments. No POST/
// PATCH/DELETE here - these are transactional records, not admin-editable
// config, matching the read-only shape of /api/admin/stats. Reactivating a
// stuck-pending row goes through /api/admin/micropayments/[id]/activate.
export async function GET(req: NextRequest) {
  const { error, supabase } = await verifyAdmin()
  if (error || !supabase) return NextResponse.json({ error }, { status: 401 })

  const url = req.nextUrl
  const page = parseInt(url.searchParams.get("page") || "1")
  const limit = parseInt(url.searchParams.get("limit") || "20")
  const offset = (page - 1) * limit

  const { data, count, error: dbError } = await supabase
    .from("micropayments")
    .select("*", { count: "exact" })
    .in("feature_type", ["flash_job", "highlight_job"])
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  const jobIds = [...new Set((data || []).map((m: any) => m.job_id).filter(Boolean))]
  let jobMap = new Map<string, { title: string; business_id: string }>()
  if (jobIds.length > 0) {
    const { data: jobs } = await supabase.from("jobs").select("id, title, business_id").in("id", jobIds)
    jobMap = new Map((jobs || []).map((j: any) => [j.id, { title: j.title, business_id: j.business_id }]))
  }

  const businessIds = [...new Set(Array.from(jobMap.values()).map((j) => j.business_id).filter(Boolean))]
  let businessMap = new Map<string, string>()
  if (businessIds.length > 0) {
    const { data: businesses } = await supabase.from("business_profiles").select("id, company_name").in("id", businessIds)
    businessMap = new Map((businesses || []).map((b: any) => [b.id, b.company_name]))
  }

  const enriched = (data || []).map((m: any) => {
    const job = m.job_id ? jobMap.get(m.job_id) : null
    return {
      ...m,
      job_title: job?.title || null,
      business_name: job ? businessMap.get(job.business_id) || null : null,
    }
  })

  return NextResponse.json({ data: enriched, total: count ?? 0, page, limit })
}
