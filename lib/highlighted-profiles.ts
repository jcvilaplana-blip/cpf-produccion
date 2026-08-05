import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * Perfiles con "Destacar mi perfil" pagado y vigente.
 *
 * La tabla `highlighted_profiles` se rellenaba al cobrar (lib/payments/
 * activate-feature.ts) pero **no la leía nadie**: el candidato pagaba, la
 * pantalla de éxito le prometía aparecer primero en las búsquedas durante 7
 * días, y su perfil no se movía de sitio. Esto es lo que faltaba para que esa
 * promesa fuera cierta.
 *
 * Se filtra por fecha además de por `is_active` porque nada expira la fila
 * automáticamente: pasados los 7 días sigue marcada como activa.
 */
export async function getHighlightedProfileIds(
  supabase: SupabaseClient<any, any, any>
): Promise<Set<string>> {
  try {
    const { data } = await supabase
      .from("highlighted_profiles")
      .select("profile_id")
      .eq("is_active", true)
      .gt("end_date", new Date().toISOString())

    return new Set((data || []).map((row: { profile_id: string }) => row.profile_id))
  } catch {
    // Que falle la consulta no puede dejar el listado vacío: sin destacados,
    // simplemente se ordena como siempre.
    return new Set<string>()
  }
}

/**
 * Coloca delante a los destacados, conservando el orden original dentro de
 * cada grupo (el criterio que ya usara la pantalla: valoración, cercanía…).
 */
export function sortHighlightedFirst<T extends { id: string }>(
  items: T[],
  highlightedIds: Set<string>
): T[] {
  if (highlightedIds.size === 0) return items
  const highlighted: T[] = []
  const rest: T[] = []
  for (const item of items) {
    (highlightedIds.has(item.id) ? highlighted : rest).push(item)
  }
  return [...highlighted, ...rest]
}
