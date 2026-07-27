import { BusinessDetailContent } from "@/components/business-detail-content"

export function generateStaticParams() {
  return []
}

export default async function BusinessProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <BusinessDetailContent id={id} />
}
