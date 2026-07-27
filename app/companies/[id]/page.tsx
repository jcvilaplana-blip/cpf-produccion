import { notFound, redirect } from "next/navigation"
import { isValidUUID } from "@/lib/validate-uuid"

export function generateStaticParams() {
  return []
}

export default async function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!isValidUUID(id)) notFound()
  redirect(`/business/${id}`)
}
