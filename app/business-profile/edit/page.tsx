export const dynamic = "force-dynamic"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { EditBusinessProfileContent } from "@/components/edit-business-profile-content"

export default async function EditBusinessProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("user_type, rol")
    .eq("id", user.id)
    .single()

  const isBusiness = profile?.user_type === "business" || profile?.rol === 3
  if (!isBusiness) redirect("/dashboard")

  return <EditBusinessProfileContent userId={user.id} />
}
