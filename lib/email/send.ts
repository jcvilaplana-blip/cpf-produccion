import { emailVerificacion, emailRecuperacionPassword, emailNotificacion, emailRecibo } from "./templates"

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = process.env.EMAIL_FROM || "CamareroPorFavor <noreply@camareroporfavor.com>"

async function enviarEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) {
  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY no está configurada")
    throw new Error("Servicio de email no configurado")
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    }),
  })

  if (!res.ok) {
    const error = await res.text()
    console.error("Error Resend:", error)
    throw new Error("Error al enviar el email")
  }

  return res.json()
}

export async function enviarEmailVerificacion(
  email: string,
  nombre: string,
  enlaceVerificacion: string
) {
  return enviarEmail({
    to: email,
    subject: "✅ Verifica tu cuenta en CamareroPorFavor",
    html: emailVerificacion(nombre, enlaceVerificacion),
  })
}

export async function enviarEmailRecuperacionPassword(
  email: string,
  nombre: string,
  enlaceReset: string
) {
  return enviarEmail({
    to: email,
    subject: "🔑 Restablecer contraseña - CamareroPorFavor",
    html: emailRecuperacionPassword(nombre, enlaceReset),
  })
}

export async function enviarEmailNotificacion(
  email: string,
  nombre: string,
  titulo: string,
  mensaje: string,
  urlBoton?: string,
  textoBoton?: string
) {
  return enviarEmail({
    to: email,
    subject: `${titulo} - CamareroPorFavor`,
    html: emailNotificacion(nombre, titulo, mensaje, urlBoton, textoBoton),
  })
}

export async function enviarEmailRecibo(
  email: string,
  nombre: string,
  concepto: string,
  baseCents: number,
  vatCents: number,
  totalCents: number,
  vatLabel: string,
  referencia: string,
  fecha: string
) {
  return enviarEmail({
    to: email,
    subject: `Recibo de tu compra: ${concepto} - CamareroPorFavor`,
    html: emailRecibo(nombre, concepto, baseCents, vatCents, totalCents, vatLabel, referencia, fecha),
  })
}
