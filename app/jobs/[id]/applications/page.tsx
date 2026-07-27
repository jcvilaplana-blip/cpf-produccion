import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { JobApplicationsContent } from "@/components/job-applications-content"
import { isValidUUID } from "@/lib/validate-uuid"


export function generateStaticParams() {
  return []
}

// Reads cookies (server Supabase client) every request - must stay dynamic
// or Next.js throws DYNAMIC_SERVER_USAGE in production (silent 500).
export const dynamic = "force-dynamic"

export default async function JobApplicationsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  if (!isValidUUID(id)) notFound()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  // Get the job and verify ownership
  const { data: job } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", id)
    .eq("business_id", user.id)
    .single()

  if (!job) notFound()

  // Get all applications with worker profiles
  const { data: applications } = await supabase
    .from("applications")
    .select("*")
    .eq("job_id", id)
    .order("created_at", { ascending: false })

  const workerIds = (applications || []).map(a => a.worker_id)
  let workers: any[] = []

  if (workerIds.length > 0) {
    const { data } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url, rating, total_ratings, location, phone, bio, specialties, job_category, mux_playback_id")
      .in("id", workerIds)

    workers = data || []
  }

  const workerMap = new Map(workers.map(w => [w.id, w]))

  const enrichedApplications = (applications || []).map(app => ({
    ...app,
    worker: workerMap.get(app.worker_id) || null,
  }))

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  return (
    <JobApplicationsContent
      job={job}
      applications={enrichedApplications}
      profile={profile}
    />
  )
}
