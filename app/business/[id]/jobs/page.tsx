import { redirect } from "next/navigation"
import { BusinessJobsContent } from "@/components/business-jobs-content"
import { getViewerRole } from "@/lib/role-guard"

export function generateStaticParams() {
  return []
}

export const dynamic = "force-dynamic"

export default async function BusinessJobsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // Un establecimiento puede ver sus propias ofertas, no las de la competencia.
  const { role, userId } = await getViewerRole()
  if (role === "business" && userId !== id) {
    redirect("/business-dashboard")
  }

  return <BusinessJobsContent businessId={id} />
}
