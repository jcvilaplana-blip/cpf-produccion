"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Store, ChevronLeft, ChevronRight } from "lucide-react"

interface TipoNegocio {
  id: string
  name: string
  slug: string
  role_type?: string
}

/**
 * Carrusel de tipos de establecimiento, para la portada del candidato.
 *
 * La tabla `categories` guarda dos taxonomías distintas separadas por
 * `role_type`: los puestos de candidato (Camarero, Cocinero…) y los tipos de
 * local (Bar, Discoteca…). Aquí interesan los segundos.
 *
 * Los iconos van en `public/iconos/establecimientos/<slug>.png` en lugar de en
 * la columna `icon`: se nombran igual que el slug, así que no hace falta ni
 * tabla de equivalencias ni tenerlos cargados en la base. Si algún día se
 * quiere que sean editables desde el administrador, bastará con leer `icon`
 * cuando venga informado y caer en el fichero local si no.
 */
export function VenueTypesScroll() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [tipos, setTipos] = useState<TipoNegocio[]>([])

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((json) => {
        setTipos((json.data || []).filter((c: TipoNegocio) => c.role_type === "business"))
      })
      .catch(() => {})
  }, [])

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current
    if (!el) return
    const scrollAmount = el.clientWidth * 0.8
    el.scrollBy({ left: direction === "left" ? -scrollAmount : scrollAmount, behavior: "smooth" })
  }

  if (tipos.length === 0) return null

  return (
    <section className="pt-8 pb-3 md:pb-8 bg-background border-y">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg md:text-2xl font-bold whitespace-nowrap">Tipo de Establecimiento</h2>
          <Button asChild variant="link" className="text-primary">
            <Link href="/businesses">Ver todos</Link>
          </Button>
        </div>

        <div className="relative group">
          <button
            onClick={() => scroll("left")}
            className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm border rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Desplazar a la izquierda"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm border rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Desplazar a la derecha"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div ref={scrollRef} className="flex gap-1.5 overflow-x-auto scrollbar-hide scroll-smooth pb-2">
            {tipos.map((tipo) => (
              <Link
                key={tipo.slug}
                href={`/businesses?type=${encodeURIComponent(tipo.slug)}`}
                className="flex-shrink-0 flex flex-col items-center gap-1.5 p-1.5 rounded-xl hover:bg-accent active:scale-95 transition-all min-w-[70px]"
              >
                <div className="w-[72px] h-[72px] flex items-center justify-center">
                  {/* Si falta el fichero del icono se cae al genérico en vez de
                      dejar el hueco roto de una imagen que no carga. */}
                  <img
                    src={`/iconos/establecimientos/${tipo.slug}.png`}
                    alt=""
                    className="w-full h-full object-contain"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none" }}
                  />
                  <Store className="hidden w-11 h-11 text-[#E73A36]" />
                </div>
                <div className="text-center">
                  <div className="font-semibold text-sm leading-tight whitespace-nowrap">{tipo.name}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
