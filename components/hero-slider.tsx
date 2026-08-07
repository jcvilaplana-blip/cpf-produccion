"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

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
    titulo: "Encuentra el trabajo en Hostelería que quieres",
    subtitulo: "Todo tipo de negocios de Hostelería te están esperando",
    cta: "Ver Ofertas",
    ctaLink: "/jobs",
  },
  {
    titulo: "Conecta, Contrata, Confía",
    subtitulo: "Encuentra el empleado ideal para tu Establecimiento de hostelería",
    cta: "Buscar Candidatos",
    ctaLink: "/candidates",
  },
]

const IMAGEN = "/busy-restaurant-kitchen-team-working.jpg"
const DURACION_MS = 6000

export function HeroSlider() {
  const [indice, setIndice] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setIndice((i) => (i + 1) % SLIDES.length), DURACION_MS)
    return () => clearInterval(id)
  }, [])

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
            {SLIDES.map((slide, i) => (
              <div
                key={slide.titulo}
                aria-hidden={i !== indice}
                className={`col-start-1 row-start-1 space-y-4 md:space-y-6 transition-opacity duration-700 ${
                  i === indice ? "opacity-100" : "pointer-events-none opacity-0"
                }`}
              >
                <h1 className="text-2xl md:text-6xl font-bold text-white text-balance leading-tight">
                  {slide.titulo}
                </h1>
                <p className="text-sm md:text-xl text-white/90 text-pretty">{slide.subtitulo}</p>
                <div className="flex justify-center md:justify-start">
                  <Button asChild size="lg" className="text-lg bg-[#F48221] hover:bg-[#D9721D] text-white">
                    <Link href={slide.ctaLink} tabIndex={i === indice ? undefined : -1}>
                      {slide.cta}
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Indicadores, también para poder saltar de uno a otro sin esperar. */}
          <div className="mt-6 flex gap-2 justify-center md:justify-start">
            {SLIDES.map((slide, i) => (
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
        </div>
      </div>
    </div>
  )
}
