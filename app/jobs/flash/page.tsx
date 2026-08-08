import { redirect } from "next/navigation"

/**
 * Alias histórico de la página de ofertas flash.
 *
 * Era un `redirect("/")` de cuando la aplicación estaba en modo demostración,
 * así que todos los enlaces de "Ver todas" acababan en la portada. Se mantiene
 * la ruta porque hay enlaces publicados que apuntan aquí, pero ahora lleva
 * donde debe.
 */
export default function FlashJobsPage() {
  redirect("/flash-offers")
}
