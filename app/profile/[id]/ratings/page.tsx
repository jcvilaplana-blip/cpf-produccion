import type { Metadata } from "next"
import { CandidateRatingsContent } from "@/components/candidate-ratings-content"

export function generateStaticParams() {
  return []
}

export const metadata: Metadata = {
  title: "Valoraciones - CamareroPorFavor",
  description: "Valoraciones y comentarios del candidato",
}

export default function CandidateRatingsPage({ params }: { params: { id: string } }) {
  return <CandidateRatingsContent candidateId={params.id} />
}
