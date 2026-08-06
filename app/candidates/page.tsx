import { CandidatesBrowser } from "@/components/candidates-browser"
import { blockRole } from "@/lib/role-guard"

export const metadata = {
  title: "Candidatos - CamareroPorFavor",
  description: "Explora candidatos con video-reels de todas las categorias profesionales",
}

// Se lee la sesión en cada petición para saber el rol de quien mira.
export const dynamic = "force-dynamic"

export default async function CandidatesPage() {
  // Un candidato no explora a otros candidatos: son su competencia, no su
  // mercado. Los establecimientos y los visitantes sin cuenta sí pasan.
  await blockRole("worker", "/dashboard")
  return <CandidatesBrowser />
}
