import { createClient as createServiceClient } from "@supabase/supabase-js"

function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createServiceClient(url, key)
}

interface NotifyUserOptions {
  title: string
  body: string
  type: "oferta" | "aviso" | "otro" | "entrevista" | "interes"
  link?: string
  createdBy?: string
}

/**
 * Insert a notification row targeting a single user. Uses the service-role
 * client (same pattern as lib/admin-auth.ts) since this writes on behalf of
 * one user (business/worker) into another user's notification feed - not
 * something the acting user's own RLS grants should cover.
 */
export async function notifyUser(userId: string, options: NotifyUserOptions) {
  const supabase = getServiceRoleClient()
  if (!supabase) return { error: "Config missing" }

  const { error } = await supabase.from("notifications").insert({
    title: options.title,
    body: options.body,
    type: options.type,
    target_scope: "user",
    target_user_id: userId,
    link: options.link || null,
    created_by: options.createdBy || null,
  })

  if (error) return { error: error.message }
  return { success: true }
}
