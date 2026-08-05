import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Margen antes de la caducidad a partir del cual merece la pena renovar el
// token aunque técnicamente aún sirva, para que no expire a mitad de una
// navegación.
const REFRESH_MARGIN_SECONDS = 120

/**
 * @param needsVerifiedUser  true sólo en las rutas protegidas. En ellas se
 *   valida el token contra el servidor de Auth (`getUser()`), que es lo único
 *   en lo que se puede confiar para decidir un acceso. En las públicas no hay
 *   nada que proteger y basta con mantener viva la cookie de sesión.
 */
export async function updateSession(request: NextRequest, needsVerifiedUser: boolean) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    // Supabase not configured - pass through
    return { response: supabaseResponse, user: null }
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // `getUser()` NO decodifica el token en local: hace una petición de red al
  // servidor de Auth de Supabase para validarlo. Estaba ejecutándose en cada
  // request que casara con el matcher -cada navegación, cada payload RSC, cada
  // prefetch-, así que sumaba un viaje de ida y vuelta a Supabase a todo lo
  // que hacía el usuario. Era el motivo principal de que navegar entre páginas
  // fuera lento de forma generalizada.
  //
  // `getSession()`, en cambio, lee la cookie en local y sólo sale a la red si
  // el token ya ha caducado y toca renovarlo.
  const { data: { session } } = await supabase.auth.getSession()

  if (!needsVerifiedUser) {
    const expiresAt = session?.expires_at ?? 0
    const stillFresh = expiresAt - Math.floor(Date.now() / 1000) > REFRESH_MARGIN_SECONDS
    // Sin sesión no hay nada que renovar; con una sesión todavía válida
    // tampoco. En ambos casos la página es pública y no se comprueba ningún
    // permiso, así que se responde sin tocar la red.
    if (!session || stillFresh) {
      // Se devuelve null a propósito, no `session.user`: por esta rama no se
      // ha verificado nada contra el servidor de Auth, y el usuario de una
      // sesión sin verificar no debe circular como si lo estuviera. Quien
      // llama sólo mira este campo en rutas protegidas, que nunca pasan por
      // aquí.
      return { response: supabaseResponse, user: null }
    }
  }

  const { data: { user } } = await supabase.auth.getUser()

  return { response: supabaseResponse, user }
}
