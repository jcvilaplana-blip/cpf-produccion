import { createClient } from "@/lib/supabase/server"
import { JobDetailContent } from "@/components/job-detail-content"
import { notFound } from "next/navigation"
import { isValidUUID } from "@/lib/validate-uuid"
import { blockRole } from "@/lib/role-guard"


export function generateStaticParams() {
  return []
}

// Reads cookies (server Supabase client) every request - must stay dynamic
// or Next.js throws DYNAMIC_SERVER_USAGE in production (silent 500). This
// was a live bug: every job detail page 500'd in production before this fix.
export const dynamic = "force-dynamic"

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // La ficha de una oferta es del lado del candidato.
  await blockRole("business", "/business-dashboard")
  const { id } = await params

  if (!isValidUUID(id)) {
    notFound()
  }

  const supabase = await createClient()

  // Get the job from Supabase
  const { data: job, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !job) {
    notFound()
  }

  // Get the business profile
  const { data: businessProfile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url, user_type")
    .eq("id", job.business_id)
    .single()

  const { data: bizProfile } = await supabase
    .from("business_profiles")
    .select("company_name, company_logo_url, business_type")
    .eq("id", job.business_id)
    .single()

  // Get current user and check if they already applied
  const { data: { user } } = await supabase.auth.getUser()
  // El estado, no sólo si existe la fila: una candidatura ya respondida por el
  // establecimiento no es lo mismo que una a la espera, y el botón tiene que
  // decir cosas distintas en cada caso.
  let applicationStatus: string | null = null
  let isSaved = false
  let userProfile = null

  if (user) {
    const [applicationRes, savedRes, profileRes] = await Promise.all([
      supabase
        .from("applications")
        .select("id, status")
        .eq("job_id", id)
        .eq("worker_id", user.id)
        .maybeSingle(),
      supabase
        .from("saved_jobs")
        .select("id")
        .eq("job_id", id)
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single(),
    ])

    applicationStatus = applicationRes.data?.status ?? null
    isSaved = !!savedRes.data
    userProfile = profileRes.data
  }

  // Increment views
  await supabase
    .from("jobs")
    .update({ views: (job.views || 0) + 1 })
    .eq("id", id)

  const jobData = {
    ...job,
    business: {
      display_name: bizProfile?.company_name || businessProfile?.display_name || "Empresa",
      avatar_url: bizProfile?.company_logo_url || businessProfile?.avatar_url || null,
      type: bizProfile?.business_type || null,
    },
  }

  return (
    <JobDetailContent
      job={jobData}
      initialApplicationStatus={applicationStatus}
      initialIsSaved={isSaved}
      userId={user?.id || null}
      userProfile={userProfile}
    />
  )
}
