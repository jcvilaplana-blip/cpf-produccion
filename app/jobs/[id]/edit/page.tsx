import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { EditJobContent } from "@/components/edit-job-content"

export function generateStaticParams() {
  return []
}

// Reads cookies (server Supabase client) every request - must stay dynamic
// or Next.js throws DYNAMIC_SERVER_USAGE in production (silent 500).
export const dynamic = "force-dynamic"

export default async function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  return <EditJobContent jobId={id} userId={user.id} />
}
