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

/** Looks up the email associated with a phone number. Returns null if not found - callers must not reveal which case occurred (same generic message either way). */
export async function resolveEmailByPhone(supabase: SupabaseClient, phone: string): Promise<string | null> {
  const variants = phoneLookupVariants(phone)
  if (variants.length === 0) return null

  const { data } = await supabase
    .from("profiles")
    .select("email")
    .in("phone", variants)
    .limit(1)
    .maybeSingle()

  return data?.email || null
}
