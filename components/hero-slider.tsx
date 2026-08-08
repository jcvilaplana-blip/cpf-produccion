"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"

/**
 * Cabecera de la portada.
 *
 * Dos mensajes, uno por cada lado del mercado, sobre una única imagen. Lo que
 * se funde es sólo el texto: el fondo permanece fijo durante la transición,
 * porque cambiarlo también convertiría un cambio de mensaje en un parpadeo de
 * toda la cabecera.
 */
const SLIDES = [
  {
    titulo: "Encuentra el trabajo que quieres en Hostelería",
    subtitulo: "Todo tipo de negocios de Hostelería te están esperando",
    cta: "Ver Ofertas",
    ctaLink: "/jobs",
    /** Su destino está vedado a los establecimientos. */
    ocultarPara: "business" as const,
  },
  {
    titulo: "Conecta, Confía, Contrata",
    subtitulo: "Encuentra el empleado ideal para tu Establecimiento de hostelería",
    cta: "Buscar Candidatos",
    ctaLink: "/candidates",
    /** Su destino está vedado a los candidatos. */
    ocultarPara: "worker" as const,
  },
]

const IMAGEN = "/busy-restaurant-kitchen-team-working.jpg"
const DURACION_MS = 6000

export function HeroSlider() {
  const { user } = useAuth()
  const [indice, setIndice] = useState(0)

  // A cada rol se le muestra sólo el mensaje que puede seguir: el botón del
  // otro lleva a una página que el guardián de rol le cerraría, y ofrecer un
  // botón que rebota desconcierta más que no ofrecerlo.
  //
  // Sin sesión se muestran los dos: todavía no se sabe qué busca quien mira, y
  // cualquier toque le lleva a identificarse de todas formas.
  const slides = useMemo(
    () => SLIDES.filter((s) => !user?.userType || s.ocultarPara !== user.userType),
    [user?.userType]
  )

  // Si el rol se resuelve después de la primera pintada, la lista se acorta y
  // el índice podría apuntar fuera.
  useEffect(() => {
    setIndice((i) => (i < slides.length ? i : 0))
  }, [slides.length])

  useEffect(() => {
    if (slides.length < 2) return
    const id = setInterval(() => setIndice((i) => (i + 1) % slides.length), DURACION_MS)
    return () => clearInterval(id)
  }, [slides.length])

  return (
    <div className="relative w-full aspect-[8/9] md:aspect-video overflow-hidden bg-background">
      <div className="absolute inset-0">
        {/* Fondo fijo: no entra en la transición. */}
        <img src={IMAGEN} alt="" aria-hidden="true" className="w-full h-full object-cover" />
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to right, rgba(0, 0, 0, 0.70), rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0.25))",
          }}
        />
      </div>

      <div className="relative h-full flex items-center">
        <div className="container mx-auto px-4 md:px-8 max-w-6xl">
          {/* Los textos se apilan en la misma celda de una rejilla para que la
              cabecera no dé saltos de altura al cambiar de mensaje: el alto lo
              fija siempre el más largo de los dos. */}
          <div className="grid max-w-2xl">
            {slides.map((slide, i) => (
              <div
                key={slide.titulo}
                aria-hidden={i !== indice}
                className={`col-start-1 row-start-1 space-y-4 md:space-y-6 transition-opacity duration-700 ${
                  i === indice ? "opacity-100" : "pointer-events-none opacity-0"
                }`}
              >
                <h1 className="pt-6 md:pt-8 text-3xl md:text-7xl font-bold text-white text-balance leading-tight">
                  {slide.titulo}
                </h1>
                <p className="text-base md:text-2xl text-white/90 text-pretty">{slide.subtitulo}</p>
                {/* El botón cae dos líneas por debajo del subtítulo: pegado a
                    él competía con el texto en lugar de rematarlo. */}
                <div className="flex justify-center md:justify-start pt-8 md:pt-10">
                  <Button asChild size="lg" className="text-lg bg-[#F48221] hover:bg-[#D9721D] text-white">
                    <Link href={slide.ctaLink} tabIndex={i === indice ? undefined : -1}>
                      {slide.cta}
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Indicadores. Con un solo mensaje no hay nada entre lo que saltar. */}
          {slides.length > 1 && (
          <div className="mt-6 flex gap-2 justify-center md:justify-start">
            {slides.map((slide, i) => (
              <button
                key={slide.titulo}
                type="button"
                onClick={() => setIndice(i)}
                aria-label={`Ver mensaje ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === indice ? "w-8 bg-white" : "w-4 bg-white/40"
                }`}
              />
            ))}
          </div>
          )}
        </div>
      </div>
    </div>
  )
}
