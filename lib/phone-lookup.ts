import type { SupabaseClient } from "@supabase/supabase-js"

// profiles.phone is stored however the user typed it at signup (with or
// without +34, spaces, dashes) - toE164() in phone-verification.tsx only
// normalizes right before calling Firebase, the DB value itself is raw. To
// look someone up by phone for login/recovery we generate the plausible
// stored variants instead of requiring one canonical format.
export function phoneLookupVariants(raw: string): string[] {
  const digits = raw.trim().replace(/\D/g, "")
  if (!digits) return []

  // Strip a leading country code (34 or 0034) to get the bare 9-digit
  // Spanish local number, then build every format someone might have saved.
  let local = digits
  if (local.startsWith("0034")) local = local.slice(4)
  else if (local.startsWith("34") && local.length > 9) local = local.slice(2)

  const spaced = local.replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3")

  return [...new Set([
    raw.trim(),
    digits,
    local,
    spaced,
    `+34${local}`,
    `34${local}`,
    `0034${local}`,
  ])].filter(Boolean)
}

/**
 * Sólo los dígitos significativos de un teléfono español: los nueve locales.
 *
 * Compara "+34 647 14 81 75" con "647148175" o con "0034 647-148-175" sin
 * que importe cómo lo escribiera cada usuario al registrarse.
 */
export function phoneDigits(raw: string): string {
  let d = String(raw || "").replace(/\D/g, "")
  if (d.startsWith("0034")) d = d.slice(4)
  else if (d.startsWith("34") && d.length > 9) d = d.slice(2)
  return d.slice(-9)
}

/**
 * Correo asociado a un teléfono. Devuelve null si no hay ninguno: quien llame
 * NO debe revelar cuál de los dos casos ocurrió (mismo mensaje genérico), o la
 * pantalla de login se convierte en un comprobador de números registrados.
 *
 * Se compara por dígitos en lugar de por variantes de formato. El listado de
 * variantes fallaba con cualquier agrupación distinta de la prevista: un
 * número guardado como "+34 647 14 81 75" no coincidía con ninguna de las que
 * se generaban para "647148175", así que ese usuario no podía entrar nunca.
 *
 * El correo se saca de `auth.users`, no de `profiles.email`: esa columna no se
 * rellena siempre -hay perfiles con null- y era el otro motivo por el que la
 * búsqueda no devolvía nada.
 *
 * OJO al crecer: esto recorre los perfiles con teléfono. Con unos miles va
 * sobrado; a partir de ahí conviene una columna normalizada con índice.
 */
export async function resolveEmailByPhone(supabase: SupabaseClient, phone: string): Promise<string | null> {
  const buscado = phoneDigits(phone)
  if (buscado.length < 9) return null

  const { data: perfiles } = await supabase
    .from("profiles")
    .select("id, phone")
    .not("phone", "is", null)
    .neq("phone", "")

  const encontrado = (perfiles || []).find((p: any) => phoneDigits(p.phone) === buscado)
  if (!encontrado) return null

  const { data } = await supabase.auth.admin.getUserById(encontrado.id)
  return data?.user?.email || null
}
