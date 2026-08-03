import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { InterviewsContent, type BusinessInterview } from "@/components/interviews-content"

export const dynamic = "force-dynamic"

export default async function InterviewsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("user_type")
    .eq("id", user.id)
    .single()

  if (profile?.user_type !== "business") redirect("/dashboard")

  const { data: rawInterviews } = await supabase
    .from("interview_requests")
    .select("id, application_id, worker_id, interview_type, other_type_detail, scheduled_at, status, notes")
    .eq("business_id", user.id)
    .order("scheduled_at", { ascending: false })

  const interviews = rawInterviews || []
  const workerIds = [...new Set(interviews.map((i) => i.worker_id))]
  const applicationIds = [...new Set(interviews.map((i) => i.application_id))]

  const [{ data: workers }, { data: applications }] = await Promise.all([
    workerIds.length
      ? supabase.from("profiles").select("id, display_name, avatar_url, phone").in("id", workerIds)
      : Promise.resolve({ data: [] as any[] }),
    applicationIds.length
      ? supabase.from("applications").select("id, job_id").in("id", applicationIds)
      : Promise.resolve({ data: [] as any[] }),
  ])

  const jobIds = [...new Set((applications || []).map((a: any) => a.job_id))]
  const { data: jobs } = jobIds.length
    ? await supabase.from("jobs").select("id, title").in("id", jobIds)
    : { data: [] as any[] }

  const workerMap = new Map((workers || []).map((w: any) => [w.id, w]))
  const jobByApplicationId = new Map(
    (applications || []).map((a: any) => [a.id, (jobs || []).find((j: any) => j.id === a.job_id)?.title || "Oferta"])
  )

  const enriched: BusinessInterview[] = interviews.map((i) => {
    const worker = workerMap.get(i.worker_id)
    return {
      id: i.id,
      workerId: i.worker_id,
      workerName: worker?.display_name || "Candidato",
      workerAvatar: worker?.avatar_url || null,
      workerPhone: worker?.phone || null,
      jobTitle: jobByApplicationId.get(i.application_id) || "Oferta",
      scheduledAt: i.scheduled_at,
      interviewType: i.interview_type,
      otherTypeDetail: i.other_type_detail,
      status: i.status,
      notes: i.notes,
    }
  })

  return <InterviewsContent interviews={enriched} />
}
