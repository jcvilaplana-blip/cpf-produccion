"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"

/**
 * Mensajes recibidos y sin leer, en vivo.
 *
 * Los paneles cargan sus datos una sola vez, así que sin esto el contador solo
 * cambiaría al recargar la página. Se suscribe a la tabla `messages` filtrando
 * por destinatario, de modo que sube al recibir y baja al marcar como leído.
 *
 * @param userId  usuario cuyos mensajes se cuentan
 * @param initial valor de partida (por ejemplo, el que ya calculó el servidor),
 *                para que el badge no parpadee de 0 al número correcto.
 */
export function useUnreadMessages(userId?: string | null, initial = 0) {
  const supabase = useMemo(() => createClient(), [])
  const [count, setCount] = useState(initial)

  const refresh = useCallback(async () => {
    if (!userId) return
    const { count: unread } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("receiver_id", userId)
      .eq("read", false)
    setCount(unread || 0)
  }, [supabase, userId])

  useEffect(() => {
    if (!userId) return

    refresh()

    // "*" y no solo INSERT: marcar como leído es un UPDATE, y el contador
    // tiene que bajar igual que sube.
    const channel = supabase
      .channel(`unread-messages:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${userId}`,
        },
        () => refresh()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, userId, refresh])

  return count
}
