import { ProfileDetailContent } from "@/components/profile-detail-content"

export function generateStaticParams() {
  return []
}

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ProfileDetailContent id={id} />
}
