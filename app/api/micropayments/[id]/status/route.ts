export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Auth-scoped polling endpoint for /micropayment/success, which no longer
// performs its own writes - real activation only happens server-side in the
// Stripe webhook once the charge is verified.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const { data: micropayment } = await supabase
    .from("micropayments")
    .select("id, user_id, feature_type, job_id, status")
    .eq("id", id)
    .single()

  if (!micropayment || micropayment.user_id !== user.id) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 })
  }

  return NextResponse.json({
    status: micropayment.status,
    featureType: micropayment.feature_type,
    jobId: micropayment.job_id,
  })
}
