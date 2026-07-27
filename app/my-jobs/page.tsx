import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { MyJobsContent } from "@/components/my-jobs-content"


export default async function MyJobsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  // Get all jobs by this business
  const { data: jobs } = await supabase
    .from("jobs")
    .select("*")
    .eq("business_id", user.id)
    .order("created_at", { ascending: false })

  // Get applications for each job with worker profiles
  const jobIds = (jobs || []).map(j => j.id)
  let applicationsMap: Record<string, any[]> = {}

  if (jobIds.length > 0) {
    const { data: applications } = await supabase
      .from("applications")
      .select("id, job_id, worker_id, status, created_at")
      .in("job_id", jobIds)
      .order("created_at", { ascending: false })

    if (applications && applications.length > 0) {
      // Get worker profiles
      const workerIds = [...new Set(applications.map(a => a.worker_id))]
      const { data: workers } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, rating")
        .in("id", workerIds)

      const workerMap = new Map(workers?.map(w => [w.id, w]) || [])

      // Group applications by job
      for (const app of applications) {
        if (!applicationsMap[app.job_id]) {
          applicationsMap[app.job_id] = []
        }
        applicationsMap[app.job_id].push({
          ...app,
          worker: workerMap.get(app.worker_id) || null,
        })
      }
    }
  }

  const enrichedJobs = (jobs || []).map(job => ({
    ...job,
    applications_count: applicationsMap[job.id]?.length || 0,
    applications: applicationsMap[job.id] || [],
  }))

  return <MyJobsContent jobs={enrichedJobs} profile={profile} />
}
