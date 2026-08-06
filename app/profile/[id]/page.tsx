import { notFound } from "next/navigation"
import { ProfileDetailContent } from "@/components/profile-detail-content"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Lock } from "lucide-react"

export const dynamic = "force-dynamic"
export const revalidate = 0

export function generateStaticParams() {
  return []
}

/** Aviso para un candidato que abre por URL la ficha de otro candidato. */
function PerfilBloqueado() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-200">
        <Lock className="h-7 w-7 text-slate-500" />
      </div>
      <h1 className="text-[19px] font-bold text-slate-900">
        No puedes consultar los perfiles de otros candidatos
      </h1>
      <p className="mt-2 max-w-xs text-[14px] leading-relaxed text-slate-500">
        Las fichas de candidatos son para los establecimientos que buscan personal.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 rounded-2xl bg-[#01A89E] px-6 py-3 text-[15px] font-semibold text-white"
      >
        Volver a mi panel
      </Link>
    </div>
  )
}

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const supabase = await createClient()
  // getUser() resolves to { data: { user } }, so the viewer is data.user - not
  // data itself. Reading `.id` off the wrapper silently yielded undefined, which
  // left viewerId/viewerType null for everyone and hid the business-only actions
  // (guardar, solicitar entrevista) even from logged-in businesses.
  const [{ data: authData }, { data: profileData, error: profileError }] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .eq("is_active", true)
      .single(),
  ])

  if (profileError || !profileData) {
    return notFound()
  }

  const viewer = authData?.user ?? null

  let viewerType: "worker" | "business" | "admin" | null = null
  if (viewer) {
    const { data: viewerProfile } = await supabase
      .from("profiles")
      .select("user_type, is_admin")
      .eq("id", viewer.id)
      .single()
    viewerType = viewerProfile?.is_admin ? "admin" : viewerProfile?.user_type || null
  }

  // Un candidato no puede consultar la ficha de otro candidato. Sí la suya:
  // desde el panel se entra aquí para ver cómo lo ven los establecimientos.
  //
  // Al pulsar una tarjeta el aviso sale como ventana modal (lo hace
  // `WorkerVideoCard`); esto cubre la entrada directa por URL, donde no hay
  // ninguna tarjeta que interceptar. Se explica en lugar de redirigir en
  // silencio, que dejaría al usuario sin saber por qué acabó en otro sitio.
  if (viewerType === "worker" && viewer?.id !== id) {
    return <PerfilBloqueado />
  }

  return (
    <ProfileDetailContent
      id={id}
      viewerId={viewer?.id || null}
      viewerType={viewerType}
      initialProfile={profileData}
    />
  )
}
