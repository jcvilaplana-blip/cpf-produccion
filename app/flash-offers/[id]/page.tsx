import { FlashOfferDetailContent } from "@/components/flash-offer-detail-content"

export function generateStaticParams() {
  return []
}

export default async function FlashOfferDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  return <FlashOfferDetailContent id={id} />
}
