import { CategoryContent } from "@/components/category-content"
import { blockRole } from "@/lib/role-guard"

export function generateStaticParams() {
  return []
}

interface CategoryPageProps {
  params: Promise<{ name: string }>
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  // Esta página lista candidatos de la categoría, así que queda fuera del
  // alcance de otro candidato.
  await blockRole("worker", "/dashboard")

  const { name } = await params
  const categoryName = decodeURIComponent(name)

  // Demo mode - no user authentication
  return <CategoryContent categoryName={categoryName} user={null} />
}
