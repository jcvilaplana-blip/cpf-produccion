import { BusinessJobsContent } from "@/components/business-jobs-content"

export function generateStaticParams() {
  return []
}

export default async function BusinessJobsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <BusinessJobsContent businessId={id} />
}
