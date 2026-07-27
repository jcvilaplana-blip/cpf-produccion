import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { MapView, type MapUserRole } from "@/components/map-view"


export const metadata = {
  title: "Mapa - CamareroPorFavor",
  description: "Explora candidatos, empresas y ofertas de empleo en el mapa interactivo de CamareroPorFavor",
}

export default async function MapPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Determine user role
  const { data: profile } = await supabase
    .from("profiles")
    .select("user_type, is_admin")
    .eq("id", user.id)
    .single()

  let userRole: MapUserRole = "candidate"
  if (profile?.is_admin) {
    userRole = "admin"
  } else if (profile?.user_type === "business") {
    userRole = "business"
  }

  return <MapView userRole={userRole} />
}
