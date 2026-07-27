import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const metadata = {
  title: "Términos y Condiciones | CamareroPorFavor",
  description: "Términos y condiciones de uso de la plataforma CamareroPorFavor",
}

export default async function TermsPage() {
  const supabase = await createClient()
  
  // Try to get terms from database
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "terms_content")
    .single()
  
  const content = data?.value || defaultTerms

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Términos y Condiciones</h1>
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

const defaultTerms = `
<h2>1. Aceptación de los Términos</h2>
<p>Al acceder y utilizar la plataforma CamareroPorFavor, usted acepta estar sujeto a estos Términos y Condiciones de uso. Si no está de acuerdo con alguna parte de estos términos, no podrá acceder al servicio.</p>

<h2>2. Descripción del Servicio</h2>
<p>CamareroPorFavor es una plataforma de empleo que conecta a candidatos con empresas mediante vídeo-currículums. Nuestros servicios incluyen:</p>
<ul>
  <li>Creación y gestión de perfiles profesionales con vídeo</li>
  <li>Búsqueda y aplicación a ofertas de empleo</li>
  <li>Publicación de ofertas de trabajo para empresas</li>
  <li>Sistema de mensajería entre candidatos y empresas</li>
</ul>

<h2>3. Registro de Cuenta</h2>
<p>Para utilizar ciertas funciones de la plataforma, deberá crear una cuenta. Usted es responsable de:</p>
<ul>
  <li>Proporcionar información precisa y actualizada</li>
  <li>Mantener la confidencialidad de su contraseña</li>
  <li>Todas las actividades que ocurran bajo su cuenta</li>
</ul>

<h2>4. Uso Aceptable</h2>
<p>Al utilizar CamareroPorFavor, usted se compromete a:</p>
<ul>
  <li>No publicar contenido falso, engañoso o fraudulento</li>
  <li>No utilizar la plataforma para actividades ilegales</li>
  <li>No acosar, amenazar o discriminar a otros usuarios</li>
  <li>No intentar acceder a cuentas de otros usuarios</li>
  <li>No utilizar bots o sistemas automatizados sin autorización</li>
</ul>

<h2>5. Contenido del Usuario</h2>
<p>Usted mantiene la propiedad de todo el contenido que publique en la plataforma. Sin embargo, al publicar contenido, nos otorga una licencia no exclusiva para usar, mostrar y distribuir dicho contenido en relación con el servicio.</p>

<h2>6. Planes de Suscripción</h2>
<p>CamareroPorFavor ofrece diferentes planes de suscripción con distintas funcionalidades. Los precios y características de cada plan están disponibles en nuestra página de precios. Las suscripciones se renuevan automáticamente a menos que se cancelen antes de la fecha de renovación.</p>

<h2>7. Política de Reembolsos</h2>
<p>Los pagos realizados son generalmente no reembolsables, excepto en casos específicos determinados por nuestra política de reembolsos o cuando lo requiera la ley aplicable.</p>

<h2>8. Limitación de Responsabilidad</h2>
<p>CamareroPorFavor no garantiza que encontrará empleo o candidatos a través de nuestra plataforma. No somos responsables de las decisiones de contratación tomadas por las empresas ni de la veracidad de la información proporcionada por los usuarios.</p>

<h2>9. Modificaciones del Servicio</h2>
<p>Nos reservamos el derecho de modificar o discontinuar el servicio en cualquier momento, con o sin previo aviso. No seremos responsables ante usted o terceros por cualquier modificación, suspensión o discontinuación del servicio.</p>

<h2>10. Propiedad Intelectual</h2>
<p>La plataforma CamareroPorFavor y todo su contenido original, características y funcionalidades son propiedad de CamareroPorFavor y están protegidos por leyes de derechos de autor, marcas registradas y otras leyes de propiedad intelectual.</p>

<h2>11. Contacto</h2>
<p>Si tiene preguntas sobre estos Términos y Condiciones, puede contactarnos en:</p>
<ul>
  <li>Email: legal@camareroporfavor.com</li>
  <li>Dirección: Madrid, España</li>
</ul>
`
