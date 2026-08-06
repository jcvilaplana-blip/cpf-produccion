import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const metadata = {
  title: "Política de Cookies | CamareroPorFavor",
  description: "Política de cookies de CamareroPorFavor",
}

// Mismo patrón que /privacy y /terms: el texto vive en `site_settings` para
// que sea editable desde el administrador, con un contenido por defecto si
// todavía no se ha guardado ninguno.
export default async function CookiesPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "cookies_content")
    .maybeSingle()

  const content = data?.value || defaultCookies

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#F5A623] mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al inicio
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Política de Cookies</h1>
          <p className="text-sm text-gray-500 mb-8">Última actualización: Agosto 2026</p>

          <div
            className="prose prose-gray max-w-none prose-headings:text-gray-900 prose-p:text-gray-600 prose-li:text-gray-600"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      </div>
    </div>
  )
}

// Recoge y amplía el resumen que ya se mostraba en el diálogo legal del
// registro. Conviene que lo revise un asesor legal antes de publicar.
const defaultCookies = `
<h2>1. Qué son las cookies</h2>
<p>Una cookie es un pequeño fichero de texto que un sitio web guarda en tu dispositivo cuando lo visitas. Sirve para recordar información sobre tu visita, como tu sesión iniciada o tus preferencias.</p>

<h2>2. Cookies que utilizamos</h2>
<h3>Cookies esenciales</h3>
<p>Necesarias para el funcionamiento básico de la aplicación. Sin ellas no es posible navegar ni usar sus funciones. No requieren consentimiento.</p>

<h3>Cookies de sesión</h3>
<p>Mantienen tu sesión activa mientras usas CamareroPorFavor, para que no tengas que volver a identificarte en cada página. Se gestionan a través de nuestro proveedor de autenticación.</p>

<h3>Cookies analíticas</h3>
<p>Nos ayudan a entender cómo se usa la aplicación para poder mejorarla. Recogen información de forma agregada.</p>

<h2>3. Cookies de terceros</h2>
<p>Algunos servicios que utilizamos pueden instalar sus propias cookies:</p>
<ul>
  <li><strong>Supabase:</strong> autenticación y mantenimiento de la sesión.</li>
  <li><strong>Stripe:</strong> procesamiento de pagos y prevención del fraude.</li>
</ul>

<h2>4. Cómo gestionar las cookies</h2>
<p>Puedes configurar tu navegador para aceptar, rechazar o eliminar las cookies. Ten en cuenta que si bloqueas las cookies esenciales o de sesión, no podrás iniciar sesión ni utilizar la aplicación con normalidad.</p>
<p>La mayoría de navegadores permiten gestionarlas desde su apartado de privacidad o configuración.</p>

<h2>5. Cambios en esta política</h2>
<p>Podemos actualizar esta política de cookies para reflejar cambios en la aplicación o en la normativa aplicable. Publicaremos siempre la versión vigente en esta página.</p>

<h2>6. Contacto</h2>
<p>Si tienes dudas sobre el uso de cookies, puedes escribirnos a través de la sección de contacto de la aplicación.</p>
`
