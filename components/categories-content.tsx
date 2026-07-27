"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Search, Loader2, Utensils, ArrowLeft } from "lucide-react"
import { Input } from "@/components/ui/input"

interface CategoryFromDB {
  id: string
  name: string
  slug: string
  icon: string | null
  role_type?: string
  sort_order: number
  subcategories: { id: string; name: string; slug: string; icon: string | null; sort_order: number }[]
}

export function CategoriesContent() {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [categories, setCategories] = useState<CategoryFromDB[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => {
        const cats = (d.data || []).filter((c: CategoryFromDB) => (c.role_type || "candidate") === "candidate")
        setCategories(cats)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filtered = categories.filter((cat) => {
    const q = search.toLowerCase()
    if (!q) return true
    return (
      cat.name.toLowerCase().includes(q) ||
      cat.subcategories?.some((s) => s.name.toLowerCase().includes(q))
    )
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#01A89E]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pt-14">
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-1.5 -ml-1.5 rounded-full hover:bg-gray-100 active:scale-90 transition-transform flex-shrink-0"
              aria-label="Volver"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <div className="min-w-0">
              <h1 className="text-lg md:text-xl font-bold text-gray-900 whitespace-nowrap truncate">Todos los empleos</h1>
              <p className="text-xs text-gray-500 mt-0.5">{categories.length} categorías de empleo</p>
            </div>
          </div>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar categoría o especialidad..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4">
        <div className="grid grid-cols-4 gap-3">
          {filtered.map((cat) => (
            <Link
              key={cat.slug}
              href={`/category/${cat.slug}`}
              className="flex flex-col items-center gap-2 p-2.5 rounded-xl bg-white border hover:border-[#01A89E] hover:shadow-md active:scale-95 transition-all text-center"
            >
              <div className="w-12 h-12 flex items-center justify-center">
                {cat.icon ? (
                  <img src={cat.icon} alt="" className="w-full h-full object-contain" />
                ) : (
                  <Utensils className="w-8 h-8 text-[#E73A36]" />
                )}
              </div>
              <span className="font-semibold text-[11px] leading-tight text-gray-900 line-clamp-2">{cat.name}</span>
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-sm">No se encontraron empleos para &ldquo;{search}&rdquo;</p>
          </div>
        )}
      </div>
    </div>
  )
}
