import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { createShowcaseClient } from "@/lib/supabase/public-showcase"

export const dynamic = "force-dynamic"

type Invitador = {
  nombre: string
  imagen: string | null
  esEmpresa: boolean
}

/**
 * Resuelve el código de invitación a los datos de quien invita.
 *
 * Va por el cliente de servicio porque `referral_code` no está al alcance del
 * rol anónimo —si lo estuviera, cualquiera podría recorrer la tabla cosechando
 * códigos ajenos— y quien abre la invitación todavía no tiene sesión.
 */
async function buscarInvitador(code: string): Promise<Invitador | null> {
  const supabase = createShowcaseClient()
  if (!supabase) return null

  const { data: perfil } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, user_type, rol")
    .eq("referral_code", code)
    .maybeSingle()

  if (!perfil) return null

  const esEmpresa = perfil.user_type === "business" || perfil.rol === 3

  // Una empresa se presenta con su nombre comercial y su logotipo, no con el
  // nombre de la persona que abrió la cuenta.
  if (esEmpresa) {
    const { data: empresa } = await supabase
      .from("business_profiles")
      .select("company_name, company_logo_url")
      .eq("id", perfil.id)
      .maybeSingle()

    return {
      nombre: empresa?.company_name || perfil.display_name || "Un establecimiento",
      imagen: empresa?.company_logo_url || perfil.avatar_url || null,
      esEmpresa: true,
    }
  }

  return {
    nombre: perfil.display_name || "Un profesional",
    imagen: perfil.avatar_url || null,
    esEmpresa: false,
  }
}

function textoInvitacion(inv: Invitador): string {
  return inv.esEmpresa
    ? `${inv.nombre} te invita a ver sus ofertas de trabajo en CPF (Camarero Por Favor)`
    : `${inv.nombre} te invita a ver su perfil profesional si eres una Empresa o establecimiento hostelero en CPF (Camarero Por Favor)`
}

/**
 * Metadatos Open Graph para la vista previa del enlace.
 *
 * Es lo que WhatsApp, Telegram o LinkedIn leen al pegar la URL: sin esto el
 * enlace aparece como texto pelado. Por eso se comparte esta página y no
 * `/create-profile?ref=` directamente — aquélla no puede saber quién invita
 * hasta que el navegador ejecuta JavaScript, y los rastreadores no lo ejecutan.
 */
export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params
  const inv = await buscarInvitador(code)

  if (!inv) {
    return {
      title: "Invitación · CamareroPorFavor",
      description: "Únete a CPF (Camarero Por Favor), la plataforma de empleo en hostelería.",
    }
  }

  const texto = textoInvitacion(inv)
  const imagenes = inv.imagen ? [{ url: inv.imagen, width: 400, height: 400, alt: inv.nombre }] : undefined

  return {
    title: texto,
    description: "Únete a CPF (Camarero Por Favor), la plataforma de empleo en hostelería.",
    openGraph: {
      title: texto,
      description: "Únete a CPF (Camarero Por Favor), la plataforma de empleo en hostelería.",
      type: "website",
      images: imagenes,
    },
    twitter: {
      card: inv.imagen ? "summary_large_image" : "summary",
      title: texto,
      description: "Únete a CPF (Camarero Por Favor), la plataforma de empleo en hostelería.",
      images: inv.imagen ? [inv.imagen] : undefined,
    },
  }
}

export default async function InvitePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const inv = await buscarInvitador(code)
  const destino = `/create-profile?ref=${encodeURIComponent(code)}`

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#01A89E]/10 via-white to-[#F48221]/10 px-6 py-12 text-center">
      {inv?.imagen ? (
        <Image
          src={inv.imagen}
          alt={inv.nombre}
          width={104}
          height={104}
          className="h-26 w-26 rounded-full border-4 border-white object-cover shadow-lg"
          style={{ width: "104px", height: "104px" }}
        />
      ) : (
        <Image src="/lazo-512-transp.png" alt="" aria-hidden="true" width={104} height={104} className="h-auto w-[104px]" />
      )}

      <h1 className="mt-5 max-w-md text-[22px] font-extrabold leading-tight text-slate-900">
        {inv ? textoInvitacion(inv) : "Te damos la bienvenida a CamareroPorFavor"}
      </h1>

      <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-slate-600">
        {inv?.esEmpresa
          ? "Regístrate como profesional y podrás inscribirte en sus ofertas."
          : inv
            ? "Regístrate como establecimiento y podrás ver su perfil y contactarle."
            : "La plataforma de empleo en hostelería."}
      </p>

      <Link
        href={destino}
        className="mt-8 w-full max-w-xs rounded-2xl bg-[#01A89E] px-6 py-4 text-[16px] font-bold text-white shadow-lg shadow-[#01A89E]/25 active:scale-[0.98]"
      >
        Crear mi cuenta gratis
      </Link>

      <Link href="/auth/login" className="mt-4 text-[14px] font-medium text-slate-500 underline underline-offset-4">
        Ya tengo cuenta
      </Link>

      <Image
        src="/logo-completo-texto-APP.png"
        alt="CamareroPorFavor"
        width={180}
        height={38}
        className="mt-10 h-auto w-[180px] opacity-70"
      />
    </div>
  )
}
