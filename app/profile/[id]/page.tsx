import { notFound, redirect } from "next/navigation"
import { ProfileDetailContent } from "@/components/profile-detail-content"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const revalidate = 0

export function generateStaticParams() {
  return []
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
  if (viewerType === "worker" && viewer?.id !== id) {
    redirect("/dashboard")
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
