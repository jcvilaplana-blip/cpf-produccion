import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export const metadata = {
  title: "Admin - CamareroPorFavor",
  description: "Panel de administracion de CamareroPorFavor",
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get profile to check admin status
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, rol, user_type")
    .eq("id", user.id)
    .single()

  // Admin check: is_admin=true OR rol=1 OR rol=2 OR user_type='admin'
  const isAdmin = profile?.is_admin === true || 
                  profile?.rol === 1 || 
                   
                  profile?.user_type === "admin"
  
  if (!isAdmin) {
    redirect("/dashboard")
  }

  return <>{children}</>
}
