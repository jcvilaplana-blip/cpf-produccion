import { FlashOfferDetailContent } from "@/components/flash-offer-detail-content"
import { blockRole } from "@/lib/role-guard"

export function generateStaticParams() {
  return []
}

export const dynamic = "force-dynamic"

export default async function FlashOfferDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Una oferta flash sigue siendo una oferta: lado del candidato.
  await blockRole("business", "/business-dashboard")
  const { id } = await params

  return <FlashOfferDetailContent id={id} />
}
