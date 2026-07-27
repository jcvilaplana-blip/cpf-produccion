export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { enviarEmailVerificacion } from "@/lib/email/send"

export async function POST(request: Request) {
  try {
    const { email, nombre, enlace } = await request.json()

    if (!email || !nombre || !enlace) {
      return NextResponse.json(
        { error: "Faltan parámetros: email, nombre y enlace son obligatorios" },
        { status: 400 }
      )
    }

    await enviarEmailVerificacion(email, nombre, enlace)

    return NextResponse.json({ ok: true, message: "Email de verificación enviado" })
  } catch (error) {
    console.error("Error enviando email de verificación:", error)
    return NextResponse.json(
      { error: "Error al enviar el email de verificación" },
      { status: 500 }
    )
  }
}
