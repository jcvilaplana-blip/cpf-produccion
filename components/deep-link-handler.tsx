"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

/**
 * Enlaces que abren la aplicación en lugar del navegador.
 *
 * Cuando el usuario pulsa el enlace del correo de verificación desde el móvil,
 * Android entrega la URL a la app en vez de abrir Chrome — siempre que sea del
 * esquema `camareroporfavor://`, declarado en el AndroidManifest.
 *
 * Tiene que ser un esquema propio y no una URL `https` de nuestro dominio: el
 * enlace del correo apunta primero a Supabase, que sólo después redirige a
 * nosotros, y Android no entrega a una app los saltos que ya ocurren dentro
 * del navegador. Con el esquema, el navegador sí cede el control.
 *
 * Aquí sólo se completa la sesión y se lleva al usuario a su panel. En web
 * este componente no hace absolutamente nada.
 */
export function DeepLinkHandler() {
  const router = useRouter()

  useEffect(() => {
    let quitarListener: (() => void) | undefined
    let cancelado = false

    const iniciar = async () => {
      try {
        const { Capacitor } = await import("@capacitor/core")
        if (!Capacitor.isNativePlatform()) return

        const { App } = await import("@capacitor/app")

        const manejar = async (url: string) => {
          try {
            const parsed = new URL(url)

            // Supabase devuelve el código en la query (flujo PKCE) o los
            // tokens en el fragmento (flujo implícito). Se contemplan los dos
            // porque cuál llega depende de la configuración del proyecto.
            const code = parsed.searchParams.get("code")
            const fragmento = new URLSearchParams((parsed.hash || "").replace(/^#/, ""))
            const accessToken = fragmento.get("access_token")
            const refreshToken = fragmento.get("refresh_token")

            const supabase = createClient()

            if (code) {
              await supabase.auth.exchangeCodeForSession(code)
            } else if (accessToken && refreshToken) {
              await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              })
            } else {
              // Un enlace compartido (una oferta, un perfil): se abre su ruta.
              const destino = parsed.pathname && parsed.pathname !== "/" ? parsed.pathname : "/"
              router.push(destino + (parsed.search || ""))
              return
            }

            // Con sesión abierta, el destino depende del rol, y de eso ya se
            // encarga /dashboard: si es un establecimiento, redirige él solo.
            router.push("/dashboard")
          } catch (err) {
            console.error("DeepLinkHandler: no se pudo procesar el enlace", err)
          }
        }

        const listener = await App.addListener("appUrlOpen", ({ url }) => {
          if (url) manejar(url)
        })
        if (cancelado) {
          listener.remove()
          return
        }
        quitarListener = () => listener.remove()

        // La app puede haberse abierto DESDE el enlace, en cuyo caso el evento
        // ya ocurrió antes de montar este componente.
        const inicial = await App.getLaunchUrl()
        if (inicial?.url) manejar(inicial.url)
      } catch {
        // Sin Capacitor disponible no hay enlaces que atender.
      }
    }

    iniciar()
    return () => {
      cancelado = true
      quitarListener?.()
    }
  }, [router])

  return null
}
