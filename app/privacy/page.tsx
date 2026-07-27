import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const metadata = {
  title: "Política de Privacidad | CamareroPorFavor",
  description: "Política de privacidad y protección de datos de CamareroPorFavor",
}

export default async function PrivacyPage() {
  const supabase = await createClient()
  
  // Try to get privacy policy from database
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "privacy_content")
    .single()
  
  const content = data?.value || defaultPrivacy

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Política de Privacidad</h1>
          <p className="text-sm text-gray-500 mb-8">Última actualización: Marzo 2026</p>
          
          <div 
            className="prose prose-gray max-w-none prose-headings:text-gray-900 prose-p:text-gray-600 prose-li:text-gray-600"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      </div>
    </div>
  )
}

const defaultPrivacy = `
<h2>1. Información que Recopilamos</h2>
<p>En CamareroPorFavor recopilamos diferentes tipos de información para proporcionar y mejorar nuestros servicios:</p>

<h3>Información proporcionada por usted:</h3>
<ul>
  <li><strong>Datos de cuenta:</strong> nombre, email, contraseña, foto de perfil</li>
  <li><strong>Información profesional:</strong> experiencia laboral, habilidades, vídeo-currículum</li>
  <li><strong>Datos de contacto:</strong> teléfono, dirección, ciudad</li>
  <li><strong>Información de empresa:</strong> nombre de empresa, sector, ubicación (para empresas)</li>
</ul>

<h3>Información recopilada automáticamente:</h3>
<ul>
  <li>Dirección IP y datos de ubicación aproximada</li>
  <li>Tipo de navegador y dispositivo</li>
  <li>Páginas visitadas y tiempo de uso</li>
  <li>Cookies y tecnologías similares</li>
</ul>

<h2>2. Uso de la Información</h2>
<p>Utilizamos su información personal para:</p>
<ul>
  <li>Proporcionar, mantener y mejorar nuestros servicios</li>
  <li>Conectar candidatos con ofertas de empleo relevantes</li>
  <li>Procesar transacciones y enviar notificaciones relacionadas</li>
  <li>Enviar comunicaciones de marketing (con su consentimiento)</li>
  <li>Detectar y prevenir fraudes y abusos</li>
  <li>Cumplir con obligaciones legales</li>
</ul>

<h2>3. Compartición de Datos</h2>
<p>Podemos compartir su información en las siguientes circunstancias:</p>
<ul>
  <li><strong>Con empresas:</strong> Cuando aplica a una oferta, la empresa puede ver su perfil y vídeo</li>
  <li><strong>Con candidatos:</strong> Las empresas pueden publicar ofertas visibles para candidatos</li>
  <li><strong>Proveedores de servicios:</strong> Trabajamos con terceros que nos ayudan a operar la plataforma</li>
  <li><strong>Por requerimiento legal:</strong> Cuando sea necesario para cumplir con la ley</li>
</ul>

<h2>4. Sus Derechos (RGPD)</h2>
<p>De acuerdo con el Reglamento General de Protección de Datos (RGPD), usted tiene derecho a:</p>
<ul>
  <li><strong>Acceso:</strong> Solicitar una copia de sus datos personales</li>
  <li><strong>Rectificación:</strong> Corregir datos inexactos o incompletos</li>
  <li><strong>Supresión:</strong> Solicitar la eliminación de sus datos</li>
  <li><strong>Portabilidad:</strong> Recibir sus datos en un formato estructurado</li>
  <li><strong>Oposición:</strong> Oponerse al procesamiento de sus datos</li>
  <li><strong>Limitación:</strong> Restringir el procesamiento de sus datos</li>
</ul>

<h2>5. Seguridad de los Datos</h2>
<p>Implementamos medidas de seguridad técnicas y organizativas para proteger su información personal:</p>
<ul>
  <li>Encriptación de datos en tránsito y en reposo</li>
  <li>Acceso restringido a datos personales</li>
  <li>Monitorización continua de seguridad</li>
  <li>Auditorías de seguridad periódicas</li>
</ul>

<h2>6. Retención de Datos</h2>
<p>Conservamos sus datos personales durante el tiempo necesario para cumplir con los fines descritos en esta política, a menos que la ley requiera o permita un período de retención más largo.</p>

<h2>7. Cookies</h2>
<p>Utilizamos cookies y tecnologías similares para:</p>
<ul>
  <li>Mantener su sesión iniciada</li>
  <li>Recordar sus preferencias</li>
  <li>Analizar el uso del sitio</li>
  <li>Personalizar su experiencia</li>
</ul>
<p>Puede gestionar sus preferencias de cookies en cualquier momento desde la configuración de su navegador.</p>

<h2>8. Menores de Edad</h2>
<p>Nuestros servicios no están dirigidos a menores de 16 años. No recopilamos intencionalmente información de menores de esta edad.</p>

<h2>9. Cambios en esta Política</h2>
<p>Podemos actualizar esta política de privacidad periódicamente. Le notificaremos sobre cambios significativos publicando la nueva política en esta página y, si es apropiado, mediante email.</p>

<h2>10. Contacto</h2>
<p>Para ejercer sus derechos o realizar consultas sobre privacidad:</p>
<ul>
  <li>Email: privacidad@camareroporfavor.com</li>
  <li>Delegado de Protección de Datos: dpo@camareroporfavor.com</li>
  <li>Dirección: Madrid, España</li>
</ul>

<h2>11. Autoridad de Control</h2>
<p>Si considera que el tratamiento de sus datos personales infringe la normativa, puede presentar una reclamación ante la Agencia Española de Protección de Datos (AEPD).</p>
`
