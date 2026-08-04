import type { SupabaseClient } from "@supabase/supabase-js"
import { notifyUser } from "@/lib/notifications/create-notification"

// This app has no cron/scheduler, so "recordatorio" (5.1) uses a pull
// pattern instead: whenever either party's dashboard loads, check for their
// own upcoming (next 24h) interviews that haven't been reminded about yet.
// Whichever side visits first sends the reminder to BOTH parties and stamps
// reminder_sent_at, so the other side's later visit is a no-op for that
// interview - a single shared column is enough since the check spans both.
export async function checkAndSendInterviewReminders(
  supabase: SupabaseClient,
  userId: string,
  role: "worker" | "business"
): Promise<void> {
  const now = new Date()
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const column = role === "worker" ? "worker_id" : "business_id"

  const { data: upcoming } = await supabase
    .from("interview_requests")
    .select("id, scheduled_at, worker_id, business_id")
    .eq(column, userId)
    .in("status", ["pending", "confirmed"])
    .is("reminder_sent_at", null)
    .gte("scheduled_at", now.toISOString())
    .lte("scheduled_at", in24h.toISOString())

  for (const interview of upcoming || []) {
    const when = new Date(interview.scheduled_at).toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short" })
    await notifyUser(interview.worker_id, {
      title: "Recordatorio: entrevista próxima",
      body: `Tienes una entrevista programada para el ${when}`,
      type: "entrevista",
      link: "/interviews",
    })
    await notifyUser(interview.business_id, {
      title: "Recordatorio: entrevista próxima",
      body: `Tienes una entrevista programada para el ${when}`,
      type: "entrevista",
      link: "/interviews",
    })
    await supabase.from("interview_requests").update({ reminder_sent_at: new Date().toISOString() }).eq("id", interview.id)
  }
}
