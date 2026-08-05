import { notFound } from "next/navigation"
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
  const [{ data: user }, { data: profileData, error: profileError }] = await Promise.all([
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

  let viewerType: "worker" | "business" | "admin" | null = null
  if (user) {
    const { data: viewerProfile } = await supabase
      .from("profiles")
      .select("user_type")
      .eq("id", user.id)
      .single()
    viewerType = viewerProfile?.user_type || null
  }

  return (
    <ProfileDetailContent
      id={id}
      viewerId={user?.id || null}
      viewerType={viewerType}
      initialProfile={profileData}
    />
  )
}
