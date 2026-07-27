import { CategoryContent } from "@/components/category-content"

export default async function SavedCandidatesPage() {
  return <CategoryContent categoryName="Guardados" user={null} />
}

// const supabase = await createClient()

// const {
//   data: { user },
// } = await supabase.auth.getUser()

// if (!user) {
//   redirect("/auth/login")
// }

// const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

// // Get saved jobs
// const { data: savedJobs } = await supabase
//   .from("saved_jobs")
//   .select(
//     `
//     id,
//     created_at,
//     job:jobs(
//       *,
//       business:profiles!jobs_business_id_fkey(
//         display_name,
//         avatar_url
//       )
//     )
//   `,
//   )
//   .eq("user_id", user.id)
//   .order("created_at", { ascending: false })

// return <SavedJobsContent savedJobs={savedJobs || []} profile={profile} />
