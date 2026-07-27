import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"

function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createServiceClient(url, key)
}

export async function verifyAdmin() {
  // Check real Supabase auth
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated", supabase: null, user: null }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, rol, user_type")
    .eq("id", user.id)
    .single()

  // Check is_admin OR rol=1 (superadmin) OR user_type='admin'
  // NOTE: rol=2 is a regular worker (assigned by create-profile-wizard.tsx) and rol=3 is a business —
  // neither grants admin access. Only rol=1 (superadmin) does, matching every other auth check site.
  const isAdmin = profile?.is_admin || profile?.rol === 1 || profile?.user_type === "admin"
  if (!isAdmin) return { error: "Not authorized", supabase: null, user: null }

  // For admins, use service role for full DB access
  const serviceClient = getServiceRoleClient()
  return { error: null, supabase: serviceClient || supabase, user }
}
