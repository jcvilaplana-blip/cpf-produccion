import { createClient as createServiceClient } from "@supabase/supabase-js"

/**
 * Cliente de servidor para el escaparate público.
 *
 * Las páginas públicas no pueden consultar Supabase con la clave anónima: esa
 * clave viaja dentro del JavaScript de la aplicación, así que todo lo que ella
 * pueda leer lo puede leer cualquiera. Por eso a `anon` se le retiró el acceso
 * a las columnas personales de `profiles` (teléfono, email, fecha de
 * nacimiento, coordenadas, CV).
 *
 * Consecuencia: el escaparate se sirve desde el servidor, que sí tiene acceso
 * completo y decide qué campos salen. La regla al usarlo es simple —
 * **seleccionar columnas concretas, nunca `*`**— porque aquí no hay red de
 * seguridad: lo que se pida, se expone.
 *
 * Devuelve null si no hay clave configurada, para que quien llame pueda
 * degradar con elegancia en lugar de reventar la página de inicio.
 */
export function createShowcaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createServiceClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/** Campos de un candidato que pueden mostrarse en público. Nada personal. */
export const CAMPOS_PUBLICOS_CANDIDATO =
  "id, display_name, avatar_url, job_category, location, experience_years, rating, specialties"
