export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { verifyAdmin } from "@/lib/admin-auth"
import { activateFeature, type MicropaymentRow } from "@/lib/payments/activate-feature"
import { notifyFlashOfferCandidates } from "@/lib/payments/flash-fanout"
import { notifyMatchingCandidates } from "@/lib/matching/notify-match-alerts"

// Manual reconciliation for a micropayment stuck in "pending" because its
// Stripe webhook never arrived (bad secret, network blip, etc). This app has
// no cron, so without this an admin has no way to unstick a lost payment
// short of a manual SQL update - this performs the exact same activation the
// webhook would have, after the admin has confirmed the charge went through
// on Stripe's own dashboard.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error, supabase } = await verifyAdmin()
  if (error || !supabase) return NextResponse.json({ error: error || "No autorizado" }, { status: 401 })

  const { id } = await params

  const { data: micropayment } = await supabase
    .from("micropayments")
    .select("id, user_id, feature_type, job_id, status")
    .eq("id", id)
    .single()

  if (!micropayment) return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 })
  if (micropayment.status === "completed") {
    return NextResponse.json({ alreadyProcessed: true })
  }

  await supabase.from("micropayments").update({ status: "completed" }).eq("id", id)

  const row: MicropaymentRow = {
    id: micropayment.id,
    user_id: micropayment.user_id,
    feature_type: micropayment.feature_type,
    job_id: micropayment.job_id,
    status: "completed",
  }

  await activateFeature(supabase, row)

  if (row.feature_type === "flash_job" && row.job_id) {
    try {
      const { data: job } = await supabase
        .from("jobs")
        .select("id, title, city, location, contract_type, category, position")
        .eq("id", row.job_id)
        .single()

      let notifiedUserIds = new Set<string>()
      if (job) {
        const result = await notifyMatchingCandidates(supabase, job)
        notifiedUserIds = result.notifiedUserIds
      }
      await notifyFlashOfferCandidates(supabase, row.job_id, notifiedUserIds)
    } catch (err) {
      console.error("Admin reconcile: flash offer notification fan-out failed", err)
    }
  }

  return NextResponse.json({ success: true })
}
