export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { enviarEmailNotificacion } from "@/lib/email/send"

export async function POST(request: Request) {
  try {
    const { userId, email, nombre, titulo, mensaje, urlBoton, textoBoton } =
      await request.json()

    // Se puede pasar userId o email+nombre directamente
    let destinatarioEmail = email
    let destinatarioNombre = nombre

    if (userId && !email) {
      const supabase = await createClient()
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, display_name")
        .eq("id", userId)
        .single()

      if (!profile?.email) {
        return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
      }

      destinatarioEmail = profile.email
      destinatarioNombre = profile.display_name || "Usuario"
    }

    if (!destinatarioEmail || !titulo || !mensaje) {
      return NextResponse.json(
        { error: "Faltan parámetros: email/userId, titulo y mensaje son obligatorios" },
        { status: 400 }
      )
    }

    await enviarEmailNotificacion(
      destinatarioEmail,
      destinatarioNombre || "Usuario",
      titulo,
      mensaje,
      urlBoton,
      textoBoton
    )

    return NextResponse.json({ ok: true, message: "Notificación enviada" })
  } catch (error) {
    console.error("Error enviando notificación:", error)
    return NextResponse.json(
      { error: "Error al enviar la notificación" },
      { status: 500 }
    )
  }
}
