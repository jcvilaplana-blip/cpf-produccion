export const dynamic = "force-dynamic"
import { redirect } from "next/navigation"
import { after } from "next/server"
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

  const [
    { data: jobsData },
    { data: catsData },
    { count: unread },
    { count: savedJobs },
    { count: applications },
    { data: ratingRow },
  ] = await Promise.all([
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
    // Cifras de las tarjetas del panel. Se piden aquí, con el resto, para que
    // el panel llegue pintado y no aparezcan los números un instante después.
    supabase.from("saved_jobs").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("applications").select("id", { count: "exact", head: true }).eq("worker_id", user.id),
    // La media ya está agregada en la fila del perfil: no hace falta recorrer
    // la tabla de valoraciones entera.
    supabase.from("profiles").select("rating, total_ratings").eq("id", user.id).maybeSingle(),
  ])

  const candidateMatchInput = {
    location: profile?.location || null,
    contractTypeSought: profile?.contract_type_sought || null,
    jobCategory: profile?.job_category || null,
    specialties: profile?.specialties || null,
  }

  // La unión a `profiles` es de uno-a-uno, pero PostgREST la tipa como array.
  // Se normaliza aquí: si algún día llega como array, el nombre del
  // establecimiento seguiría pintándose en la tarjeta.
  const jobsWithMatch = (jobsData || []).map((job) => ({
    ...job,
    business: Array.isArray(job.business) ? job.business[0] ?? null : job.business ?? null,
    matchPercent: computeMatchScore(candidateMatchInput, job).percent,
  }))

  // Enviar recordatorios es un efecto secundario, no un dato que la página
  // necesite para pintarse. Estaba con `await` delante del return, así que su
  // consulta y sus inserciones se sumaban íntegras al tiempo de respuesta del
  // panel en CADA carga. `after()` lo ejecuta una vez enviada la respuesta.
  after(async () => {
    try {
      await checkAndSendInterviewReminders(supabase, user.id, "worker")
    } catch (err) {
      console.error("dashboard: interview reminder check failed", err)
    }
  })

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
      savedJobsCount={savedJobs || 0}
      applicationsCount={applications || 0}
      ratingStats={{ average: ratingRow?.rating || 0, total: ratingRow?.total_ratings || 0 }}
    />
  )
}
