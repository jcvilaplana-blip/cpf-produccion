import type { Metadata } from "next"
import { CandidateRatingsContent } from "@/components/candidate-ratings-content"

export function generateStaticParams() {
  return []
}

export const metadata: Metadata = {
  title: "Valoraciones - CamareroPorFavor",
  description: "Valoraciones y comentarios del candidato",
}

export default async function CandidateRatingsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <CandidateRatingsContent candidateId={id} />
}
