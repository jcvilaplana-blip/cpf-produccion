import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { CreateJobContent } from "@/components/create-job-content"

export default async function CreateJobPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  return <CreateJobContent userId={user.id} />
}
