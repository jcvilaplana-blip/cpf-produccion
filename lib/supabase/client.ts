import { createBrowserClient } from '@supabase/ssr'
import type { Session } from '@supabase/supabase-js'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase not configured: Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// supabase-js's auth.getSession()/getUser() serialize through an internal
// lock with no timeout - if it ever gets stuck (seen in practice on this
// app: a form's submit button spinning forever with no error), the whole
// call hangs indefinitely. This wraps it in our own bounded timeout so the
// app always resolves one way or another instead of hanging silently.
export async function getSessionSafe(
  supabase: ReturnType<typeof createClient>,
  timeoutMs = 6000
): Promise<Session | null> {
  const timeout = new Promise<"timeout">((resolve) => setTimeout(() => resolve("timeout"), timeoutMs))
  const result = await Promise.race([
    supabase.auth.getSession().then((r) => r.data.session),
    timeout,
  ])
  if (result === "timeout") {
    throw new Error("No se pudo verificar la sesión. Comprueba tu conexión e inténtalo de nuevo.")
  }
  return result
}
