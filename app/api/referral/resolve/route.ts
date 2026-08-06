import { NextResponse } from "next/server"
import { createShowcaseClient } from "@/lib/supabase/public-showcase"

export const dynamic = "force-dynamic"

/**
 * Resuelve un código de invitación al id de quien invita.
 *
 * El asistente de registro consultaba `profiles.referral_code` directamente
 * desde el navegador, pero quien se está registrando todavía no tiene sesión y
 * al rol anónimo se le retiró esa columna. Sin esto, los enlaces de invitación
 * dejarían de funcionar sin dar ningún error visible.
 *
 * Va por el servidor a propósito: si se le devolviera la columna al rol
 * anónimo, cualquiera podría recorrer la tabla y cosechar códigos ajenos para
 * atribuirse invitaciones. Aquí sólo se responde a un código exacto, y lo
 * único que sale es un id.
 */
export async function POST(request: Request) {
  const { code } = await request.json().catch(() => ({ code: null }))

  if (typeof code !== "string" || code.trim().length === 0) {
    return NextResponse.json({ referrerId: null })
  }

  const supabase = createShowcaseClient()
  if (!supabase) return NextResponse.json({ referrerId: null })

  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("referral_code", code.trim())
    .maybeSingle()

  return NextResponse.json({ referrerId: data?.id ?? null })
}
