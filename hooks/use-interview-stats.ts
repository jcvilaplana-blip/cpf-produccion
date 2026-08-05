"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export interface InterviewStats {
  /** Entrevistas celebradas: contratado + no contratado. */
  completed: number
  /** Propuestas o confirmadas, aún por celebrarse. */
  upcoming: number
  /** De las celebradas, cuántas acabaron en contratación. */
  hired: number
}

/**
 * Entrevistas de un usuario, sirva de candidato o de establecimiento.
 *
 * "Realizadas" son las que llegaron a celebrarse: `approved` (hubo
 * contratación) y `not_hired` (se hizo y no la hubo). Las `cancelled` quedan
 * fuera a propósito, porque nunca ocurrieron: contarlas inflaría el historial
 * de ambas partes con citas que se cayeron.
 */
export function useInterviewStats(userId?: string | null, role?: "worker" | "business" | null) {
  const supabase = useMemo(() => createClient(), [])
  const [stats, setStats] = useState<InterviewStats>({ completed: 0, upcoming: 0, hired: 0 })

  useEffect(() => {
    if (!userId) return
    let cancelled = false

    const column = role === "business" ? "business_id" : "worker_id"

    const load = async () => {
      const { data } = await supabase
        .from("interview_requests")
        .select("status")
        .eq(column, userId)

      if (cancelled || !data) return

      setStats({
        completed: data.filter((i) => i.status === "approved" || i.status === "not_hired").length,
        upcoming: data.filter((i) => i.status === "pending" || i.status === "confirmed").length,
        hired: data.filter((i) => i.status === "approved").length,
      })
    }

    load()

    const channel = supabase
      .channel(`interview-stats:${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "interview_requests", filter: `${column}=eq.${userId}` },
        () => load()
      )
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [supabase, userId, role])

  return stats
}
