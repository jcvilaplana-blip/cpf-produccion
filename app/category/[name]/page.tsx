import { CategoryContent } from "@/components/category-content"

export function generateStaticParams() {
  return []
}

interface CategoryPageProps {
  params: Promise<{ name: string }>
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { name } = await params
  const categoryName = decodeURIComponent(name)

  // Demo mode - no user authentication
  return <CategoryContent categoryName={categoryName} user={null} />
}
