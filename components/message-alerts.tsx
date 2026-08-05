"use client"

import { useEffect, useMemo, useRef } from "react"
import { usePathname, useRouter } from "next/navigation"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"
import { playNotificationSound, vibrateOnce } from "@/lib/notification-sound"

/**
 * Aviso de mensaje nuevo en cualquier página de la app.
 *
 * El chat ya se suscribe a la conversación abierta, pero solo mientras estás
 * dentro de ella. Esto escucha los mensajes dirigidos al usuario esté donde
 * esté: suena, vibra y muestra un aviso con enlace a la conversación.
 *
 * OJO: esto solo funciona con la aplicación abierta. Un aviso con la app
 * cerrada exige notificaciones push reales (Firebase Cloud Messaging), que
 * este proyecto todavía no tiene configuradas.
 */
export function MessageAlerts() {
  const { user, isAuthenticated } = useAuth()
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const pathname = usePathname()

  // La ruta cambia constantemente; guardarla en una ref evita rehacer la
  // suscripción en cada navegación.
  const pathnameRef = useRef(pathname)
  useEffect(() => {
    pathnameRef.current = pathname
  }, [pathname])

  const userId = user?.id

  useEffect(() => {
    if (!isAuthenticated || !userId) return

    const channel = supabase
      .channel(`message-alerts:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${userId}`,
        },
        async (payload) => {
          const message = payload.new as { sender_id?: string; content?: string }

          // Dentro de la mensajería ya se ve llegar el mensaje: no molestar.
          if (pathnameRef.current?.startsWith("/messages")) return

          playNotificationSound()
          vibrateOnce()

          let senderName = "Nuevo mensaje"
          if (message.sender_id) {
            const { data } = await supabase
              .from("profiles")
              .select("display_name")
              .eq("id", message.sender_id)
              .single()
            if (data?.display_name) senderName = data.display_name
          }

          toast(senderName, {
            description: (message.content || "").slice(0, 120),
            action: {
              label: "Ver",
              onClick: () => router.push("/messages"),
            },
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [isAuthenticated, userId, supabase, router])

  return null
}
