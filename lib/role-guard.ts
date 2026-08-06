import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export type ViewerRole = "anon" | "worker" | "business" | "admin"

/**
 * Rol de quien mira, leído de la sesión verificada.
 *
 * `anon` no es un fallo: buena parte de la aplicación es escaparate público y
 * un visitante sin cuenta sigue pudiendo ver ofertas y candidatos. Las
 * restricciones de este módulo son entre roles con sesión, no contra el
 * público.
 */
export async function getViewerRole(): Promise<{ role: ViewerRole; userId: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { role: "anon", userId: null }

  const { data } = await supabase
    .from("profiles")
    .select("user_type, is_admin, rol")
    .eq("id", user.id)
    .maybeSingle()

  if (data?.is_admin || data?.rol === 1 || data?.user_type === "admin") {
    return { role: "admin", userId: user.id }
  }
  if (data?.user_type === "business" || data?.rol === 3) {
    return { role: "business", userId: user.id }
  }
  return { role: "worker", userId: user.id }
}

/**
 * Corta el paso a un rol concreto y lo manda a su sitio.
 *
 * Un candidato no tiene por qué ver a otros candidatos, ni un establecimiento
 * las ofertas de la competencia: son datos del otro lado del mercado. El
 * administrador pasa siempre, porque su panel necesita verlo todo.
 *
 * Esto es una barrera de navegación, no de datos: quien vaya a por los datos
 * de verdad tiene que encontrarse con RLS en la base. Sirve para que la
 * aplicación no ofrezca lo que no debe, no para sustituir a las políticas de
 * la base de datos.
 */
export async function blockRole(blocked: ViewerRole, redirectTo: string): Promise<ViewerRole> {
  const { role } = await getViewerRole()
  if (role === blocked) redirect(redirectTo)
  return role
}
