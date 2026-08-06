"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2, Utensils, ArrowLeft, Briefcase } from "lucide-react"

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
              <p className="text-[13px] text-gray-500 mt-0.5">{categories.length} categorías de empleo</p>
            </div>
          </div>
        </div>
      </div>

      {/* `pt-2` en lugar de `py-4`: al quitar el buscador la rejilla sube y
          queda más cerca de la cabecera. Tres columnas en vez de cuatro, que
          en móvil dejaban los iconos y los nombres demasiado pequeños. */}
      <div className="container mx-auto px-4 pt-2 pb-4">
        <div className="grid grid-cols-3 gap-3">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/category/${cat.slug}`}
              className="flex flex-col items-center gap-2 rounded-xl border bg-white p-3 text-center transition-all hover:border-[#01A89E] hover:shadow-md active:scale-95"
            >
              <div className="flex h-16 w-16 items-center justify-center">
                {cat.icon ? (
                  <img src={cat.icon} alt="" className="h-full w-full object-contain" />
                ) : (
                  <Utensils className="h-10 w-10 text-[#E73A36]" />
                )}
              </div>
              <span className="line-clamp-2 text-[14px] font-semibold leading-tight text-gray-900">{cat.name}</span>
            </Link>
          ))}
        </div>

        {categories.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-sm text-gray-500">Todavía no hay categorías disponibles.</p>
          </div>
        )}

        {/* Salida hacia las ofertas: quien entra a mirar empleos suele querer
            acabar viendo las ofertas abiertas, no sólo la lista de categorías. */}
        <Link
          href="/jobs"
          className="mt-6 flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#01A89E] text-[15px] font-bold text-white shadow-lg shadow-[#01A89E]/25 transition-colors active:scale-[0.98] active:bg-[#018F86]"
        >
          <Briefcase className="h-5 w-5" />
          Ver Ofertas de trabajo
        </Link>
      </div>
    </div>
  )
}
