export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { enviarEmailRecuperacionPassword } from "@/lib/email/send"
import { resolveEmailByPhone } from "@/lib/phone-lookup"

const GENERIC_RESPONSE = {
  ok: true,
  message: "Si la cuenta existe, recibirás un enlace para restablecer tu contraseña en su email.",
}

export async function POST(request: Request) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !serviceKey) {
      return NextResponse.json({ error: "Server config error" }, { status: 500 })
    }
    // auth.admin.generateLink requires the service-role key - the previous
    // version of this route used the anon client here, which would have
    // failed on every real request (this endpoint was never actually
    // reachable, not just unlinked from the UI).
    const supabase = createServiceClient(url, serviceKey)

    const { email: rawEmail, phone } = await request.json()
    let email = rawEmail

    // Recovery "by phone" still delivers the reset link to the email on
    // file - the phone is only used to find the account. No SMS provider
    // is configured for this app, so there's no channel to text a code to.
    if (!email && phone) {
      email = await resolveEmailByPhone(supabase, phone)
      if (!email) {
        // Same generic response as "email not found" below - don't reveal
        // whether the phone number is registered.
        return NextResponse.json(GENERIC_RESPONSE)
      }
    }

    if (!email) {
      return NextResponse.json({ error: "Email o teléfono es obligatorio" }, { status: 400 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://camareroporfavor.com"

    // Generar enlace de reset con Supabase
    const { data, error } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo: `${appUrl}/auth/callback`,
      },
    })

    if (error || !data?.properties?.action_link) {
      // No revelar si el email existe o no por seguridad
      return NextResponse.json(GENERIC_RESPONSE)
    }

    // Obtener nombre del usuario
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("email", email)
      .single()

    const nombre = profile?.display_name || "Usuario"

    await enviarEmailRecuperacionPassword(email, nombre, data.properties.action_link)

    return NextResponse.json(GENERIC_RESPONSE)
  } catch (error) {
    console.error("Error en recuperación de contraseña:", error)
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    )
  }
}
