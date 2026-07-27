export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { enviarEmailRecuperacionPassword } from "@/lib/email/send"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email es obligatorio" }, { status: 400 })
    }

    const supabase = await createClient()
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
      return NextResponse.json({
        ok: true,
        message: "Si el correo existe, recibirás un enlace para restablecer tu contraseña.",
      })
    }

    // Obtener nombre del usuario
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("email", email)
      .single()

    const nombre = profile?.display_name || "Usuario"

    await enviarEmailRecuperacionPassword(email, nombre, data.properties.action_link)

    return NextResponse.json({
      ok: true,
      message: "Si el correo existe, recibirás un enlace para restablecer tu contraseña.",
    })
  } catch (error) {
    console.error("Error en recuperación de contraseña:", error)
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    )
  }
}
