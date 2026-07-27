import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { EditProfileContent } from "@/components/edit-profile-content"


export const metadata = {
  title: "Editar Perfil | CamareroPorFavor",
  description: "Completa tu perfil profesional con tus datos, experiencia, habilidades y video de presentacion.",
}

export default async function EditProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If no user, we still allow beta/demo users (handled client-side)
  let profile = null
  let userEmail = ""

  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()
    profile = data
    userEmail = user.email || ""
  }

  return <EditProfileContent profile={profile} userEmail={userEmail} />
}
