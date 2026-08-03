import { ProfileDetailContent } from "@/components/profile-detail-content"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export function generateStaticParams() {
  return []
}

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let viewerType: "worker" | "business" | "admin" | null = null
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_type")
      .eq("id", user.id)
      .single()
    viewerType = profile?.user_type || null
  }

  return <ProfileDetailContent id={id} viewerId={user?.id || null} viewerType={viewerType} />
}
