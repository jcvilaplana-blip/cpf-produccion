import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { BusinessRatingsContent } from "@/components/business-ratings-content"

export function generateStaticParams() {
  return []
}

// This page reads cookies (via the server Supabase client) on every request
// to check auth - it must never be statically optimized, or Next.js throws
// DYNAMIC_SERVER_USAGE in production builds (silently 500s the route).
export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Valoraciones de Empresa - CamareroPorFavor",
  description: "Valoraciones y comentarios de la empresa",
}

export default async function BusinessRatingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect(`/auth/login?redirect=/business/${id}/ratings`)

  return <BusinessRatingsContent businessId={id} currentUserId={user.id} />
}
