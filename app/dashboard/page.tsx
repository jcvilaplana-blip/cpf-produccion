export const dynamic = "force-dynamic"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { CandidateDashboardContent } from "@/components/candidate-dashboard-content"
import { computeMatchScore } from "@/lib/matching"
import { checkAndSendInterviewReminders } from "@/lib/interview-reminders"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url, job_category, location, contract_type_sought, specialties, user_type, rol, is_admin")
    .eq("id", user.id)
    .single()

  const isAdmin = profile?.is_admin || profile?.rol === 1 || profile?.user_type === "admin"
  const isBusiness = profile?.user_type === "business" || profile?.rol === 3
  if (isAdmin) redirect("/admin")
  if (isBusiness) redirect("/business-dashboard")

  const [{ data: jobsData }, { data: catsData }, { count: unread }] = await Promise.all([
    supabase
      .from("jobs")
      .select(`
        id, title, location, city, category, position, contract_type,
        salary_min, salary_max, is_flash, is_highlighted, flash_expires_at, created_at,
        business:profiles!jobs_business_id_fkey(display_name, avatar_url)
      `)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase.from("categories").select("id, name").order("name"),
    supabase.from("messages").select("id", { count: "exact", head: true }).eq("receiver_id", user.id).eq("read", false),
  ])

  const candidateMatchInput = {
    location: profile?.location || null,
    contractTypeSought: profile?.contract_type_sought || null,
    jobCategory: profile?.job_category || null,
    specialties: profile?.specialties || null,
  }

  const jobsWithMatch = (jobsData || []).map((job) => ({
    ...job,
    matchPercent: computeMatchScore(candidateMatchInput, job).percent,
  }))

  try {
    await checkAndSendInterviewReminders(supabase, user.id, "worker")
  } catch (err) {
    console.error("dashboard: interview reminder check failed", err)
  }

  return (
    <CandidateDashboardContent
      userId={user.id}
      userName={profile?.display_name?.split(" ")[0] || "Usuario"}
      userAvatar={profile?.avatar_url || null}
      myCategory={profile?.job_category || null}
      candidateMatchInput={candidateMatchInput}
      initialJobs={jobsWithMatch}
      initialCategories={catsData || []}
      initialUnreadCount={unread || 0}
    />
  )
}
