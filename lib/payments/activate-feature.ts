import type { SupabaseClient } from "@supabase/supabase-js"

// Shared activation logic for a completed micropayment, keyed by feature_type.
// Called from the Stripe webhook (app/api/webhooks/stripe/route.ts) once a
// payment is server-verified, and from the admin manual-reconcile endpoint
// for payments whose webhook never arrived. Both callers pass a service-role
// client so activation can write across users/tables regardless of RLS.

export interface MicropaymentRow {
  id: string
  user_id: string
  feature_type: string
  job_id: string | null
  status: string
}

export interface ActivationMetadata {
  flashDurationHours?: number
}

export async function activateFeature(
  supabase: SupabaseClient,
  micropayment: MicropaymentRow,
  metadata: ActivationMetadata = {}
): Promise<void> {
  switch (micropayment.feature_type) {
    case "highlight_profile": {
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + 7)
      await supabase.from("highlighted_profiles").insert({
        profile_id: micropayment.user_id,
        micropayment_id: micropayment.id,
        end_date: endDate.toISOString(),
        is_active: true,
      })
      await supabase.from("profiles").update({ is_premium: true }).eq("id", micropayment.user_id)
      break
    }

    case "view_matches":
    case "boost_visibility": {
      // No extra state to flip today beyond the micropayment itself being
      // completed - matches the pre-existing (client-side) behavior for
      // these two feature types.
      break
    }

    case "flash_job": {
      if (!micropayment.job_id) break
      // Computed from activation time, not job-insert time, so checkout
      // latency doesn't eat into an already-short flash window.
      const hours = metadata.flashDurationHours || 24
      const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000)
      await supabase
        .from("jobs")
        .update({ is_active: true, flash_expires_at: expiresAt.toISOString() })
        .eq("id", micropayment.job_id)
      break
    }

    case "highlight_job": {
      if (!micropayment.job_id) break
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
      await supabase
        .from("jobs")
        .update({ is_highlighted: true, highlight_expires_at: expiresAt.toISOString() })
        .eq("id", micropayment.job_id)
      break
    }

    default:
      break
  }
}
