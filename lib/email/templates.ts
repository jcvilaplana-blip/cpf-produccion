const LOGO_URL = "https://camareroporfavor.com/logo-cpf.png"
const COLOR_PRIMARY = "#10B981"
const COLOR_DARK = "#065F46"
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://camareroporfavor.com"

const baseTemplate = (contenido: string) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>CamareroPorFavor</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          
          <!-- CABECERA -->
          <tr>
            <td style="background:${COLOR_PRIMARY};padding:32px 40px;text-align:center;">
              <img src="${LOGO_URL}" alt="CamareroPorFavor" width="180" style="display:inline-block;max-width:180px;" />
            </td>
          </tr>

          <!-- CONTENIDO -->
          <tr>
            <td style="padding:40px 40px 32px;">
              ${contenido}
            </td>
          </tr>

          <!-- PIE -->
          <tr>
            <td style="background:#f9fafb;padding:24px 40px;border-top:1px solid #e5e7eb;text-align:center;">
              <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">
                Este email fue enviado por <strong>CamareroPorFavor</strong>
              </p>
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                <a href="${APP_URL}/privacy" style="color:#9ca3af;text-decoration:underline;">Política de Privacidad</a>
                &nbsp;·&nbsp;
                <a href="${APP_URL}/terms" style="color:#9ca3af;text-decoration:underline;">Términos de Uso</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`

export const emailVerificacion = (nombre: string, enlace: string) =>
  baseTemplate(`
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#111827;">
      ¡Bienvenido/a, ${nombre}! 👋
    </h1>
    <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
      Gracias por registrarte en <strong>CamareroPorFavor</strong>. Para activar tu cuenta y empezar a conectar con oportunidades laborales, confirma tu dirección de correo electrónico.
    </p>
    <div style="background:#f0fdf4;border-left:4px solid ${COLOR_PRIMARY};border-radius:6px;padding:16px 20px;margin-bottom:28px;">
      <p style="margin:0;font-size:14px;color:#065f46;">
        ✅ Una vez verificada tu cuenta, podrás crear tu perfil con vídeo y destacar entre miles de candidatos.
      </p>
    </div>
    <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
      <tr>
        <td style="border-radius:8px;background:${COLOR_PRIMARY};">
          <a href="${enlace}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">
            Verificar mi cuenta
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 8px;font-size:13px;color:#9ca3af;">
      Si el botón no funciona, copia y pega este enlace en tu navegador:
    </p>
    <p style="margin:0;font-size:12px;word-break:break-all;">
      <a href="${enlace}" style="color:${COLOR_PRIMARY};">${enlace}</a>
    </p>
    <hr style="margin:28px 0;border:none;border-top:1px solid #e5e7eb;" />
    <p style="margin:0;font-size:13px;color:#9ca3af;">
      Si no creaste esta cuenta, puedes ignorar este correo con total seguridad.
    </p>
  `)

export const emailRecuperacionPassword = (nombre: string, enlace: string) =>
  baseTemplate(`
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#111827;">
      Restablecer contraseña 🔑
    </h1>
    <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
      Hola <strong>${nombre}</strong>, hemos recibido una solicitud para restablecer la contraseña de tu cuenta en <strong>CamareroPorFavor</strong>.
    </p>
    <div style="background:#fff7ed;border-left:4px solid #f97316;border-radius:6px;padding:16px 20px;margin-bottom:28px;">
      <p style="margin:0;font-size:14px;color:#9a3412;">
        ⚠️ Este enlace expirará en <strong>1 hora</strong>. Si no solicitaste el cambio, ignora este correo.
      </p>
    </div>
    <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
      <tr>
        <td style="border-radius:8px;background:${COLOR_PRIMARY};">
          <a href="${enlace}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">
            Restablecer contraseña
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 8px;font-size:13px;color:#9ca3af;">
      Si el botón no funciona, copia y pega este enlace:
    </p>
    <p style="margin:0;font-size:12px;word-break:break-all;">
      <a href="${enlace}" style="color:${COLOR_PRIMARY};">${enlace}</a>
    </p>
    <hr style="margin:28px 0;border:none;border-top:1px solid #e5e7eb;" />
    <p style="margin:0;font-size:13px;color:#9ca3af;">
      Si no solicitaste restablecer tu contraseña, tu cuenta sigue siendo segura y puedes ignorar este correo.
    </p>
  `)

export const emailNotificacion = (
  nombre: string,
  titulo: string,
  mensaje: string,
  urlBoton?: string,
  textoBoton?: string
) =>
  baseTemplate(`
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#111827;">
      ${titulo}
    </h1>
    <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
      Hola <strong>${nombre}</strong>,
    </p>
    <p style="margin:0 0 28px;font-size:15px;color:#374151;line-height:1.7;">
      ${mensaje}
    </p>
    ${
      urlBoton && textoBoton
        ? `<table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
        <tr>
          <td style="border-radius:8px;background:${COLOR_PRIMARY};">
            <a href="${urlBoton}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">
              ${textoBoton}
            </a>
          </td>
        </tr>
      </table>`
        : ""
    }
    <hr style="margin:28px 0;border:none;border-top:1px solid #e5e7eb;" />
    <p style="margin:0;font-size:13px;color:#9ca3af;">
      Puedes gestionar tus notificaciones desde tu perfil en <a href="${APP_URL}" style="color:${COLOR_PRIMARY};">camareroporfavor.com</a>
    </p>
  `)

/**
 * Recibo de compra.
 *
 * Stripe sólo manda recibos automáticos en modo real, así que en pruebas la
 * pantalla de éxito prometía un correo que no llegaba nunca. Además éste
 * desglosa base e IVA, que es lo que hace falta para justificar el gasto: el
 * recibo de Stripe da un importe único.
 */
export const emailRecibo = (
  nombre: string,
  concepto: string,
  baseCents: number,
  vatCents: number,
  totalCents: number,
  vatLabel: string,
  referencia: string,
  fecha: string
) => {
  const eur = (c: number) =>
    (c / 100).toLocaleString("es-ES", { style: "currency", currency: "EUR" })
  const fila = (etiqueta: string, valor: string, fuerte = false) => `
    <tr>
      <td style="padding:8px 0;font-size:14px;color:${fuerte ? "#111827" : "#6b7280"};${fuerte ? "font-weight:700;" : ""}">${etiqueta}</td>
      <td style="padding:8px 0;font-size:14px;text-align:right;color:${fuerte ? "#111827" : "#374151"};${fuerte ? "font-weight:700;" : ""}">${valor}</td>
    </tr>`

  return baseTemplate(`
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#111827;">
      Recibo de tu compra
    </h1>
    <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
      Hola <strong>${nombre}</strong>, gracias por tu compra. Aquí tienes el detalle.
    </p>

    <table cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 24px;border:1px solid #e5e7eb;border-radius:8px;padding:16px;">
      ${fila("Concepto", concepto)}
      ${fila("Fecha", fecha)}
      ${fila("Base imponible", eur(baseCents))}
      ${fila(vatLabel, eur(vatCents))}
      <tr><td colspan="2" style="padding:4px 0;"><hr style="border:none;border-top:1px solid #e5e7eb;margin:0;" /></td></tr>
      ${fila("Total", eur(totalCents), true)}
    </table>

    <p style="margin:0 0 8px;font-size:13px;color:#9ca3af;">
      Referencia del pago: <span style="font-family:monospace;">${referencia}</span>
    </p>
    <hr style="margin:28px 0;border:none;border-top:1px solid #e5e7eb;" />
    <p style="margin:0;font-size:13px;color:#9ca3af;">
      Conserva este correo como justificante. Cualquier duda, respóndenos desde
      <a href="${APP_URL}" style="color:${COLOR_PRIMARY};">camareroporfavor.com</a>
    </p>
  `)
}
