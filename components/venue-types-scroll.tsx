"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"

/**
 * Carrusel de tipos de establecimiento.
 *
 * Ocupa el sitio de "Últimos Candidatos" cuando quien mira la portada es un
 * candidato: explorar a otros candidatos le está vedado por rol, así que esa
 * sección era una fila de tarjetas que no podía abrir. Aquí se le ofrece lo
 * que sí le sirve — por qué clase de local quiere trabajar.
 *
 * La lista viene de la base de datos, igual que el carrusel de categorías, para
 * que dar de alta un tipo nuevo no obligue a tocar código. Los iconos, en
 * cambio, se sirven desde `public/tipos-negocio`: la mayoría de las filas de
 * `categories` tiene `icon` a null, y un carrusel a medio ilustrar se ve peor
 * que uno entero.
 */

interface CategoriaNegocio {
  id: string
  name: string
  slug: string
  icon: string | null
  role_type?: string
}

/** Slug de la categoría → fichero del icono. */
const ICONOS: Record<string, string> = {
  bar: "bar",
  pub: "bar-de-copas-pub",
  cafeteria: "cafeteria",
  catering: "catering",
  chiringuito: "chiringuito-beach-club",
  discoteca: "discoteca-club",
  "eventos-privados": "eventos-privados",
  "hotel-hostal-resort": "hotel-hostal-resort",
  "restaurante-fast-food": "restaurante-comida-rapida",
  "restaurante-negocio": "restaurante",
  "terraza-bar": "terraza-bar",
}

function iconoDe(cat: CategoriaNegocio): string | null {
  const fichero = ICONOS[cat.slug]
  if (fichero) return `/tipos-negocio/${fichero}.webp`
  return cat.icon || null
}

export function VenueTypesScroll() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [categorias, setCategorias] = useState<CategoriaNegocio[]>([])

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((json) => {
        setCategorias((json.data || []).filter((c: CategoriaNegocio) => c.role_type === "business"))
      })
      .catch(() => {})
  }, [])

  // Mismo desplazamiento continuo que el carrusel de categorías: avanza solo en
  // móvil y se detiene un momento cuando el usuario lo toca.
  useEffect(() => {
    const el = scrollRef.current
    if (!el || categorias.length === 0) return
    if (!window.matchMedia("(max-width: 767px)").matches) return

    const maxScroll = el.scrollWidth - el.clientWidth
    if (maxScroll <= 0) return

    // `scroll-smooth` pelea con las escrituras por fotograma de scrollLeft.
    const comportamientoPrevio = el.style.scrollBehavior
    el.style.scrollBehavior = "auto"

    // La posición se lleva como float: releer el scrollLeft (entero) cada
    // fotograma convertiría un paso de 0,5 px en no moverse nunca.
    let posicion = 0
    el.scrollLeft = posicion

    let rafId: number
    let pausado = false
    let reanudar: ReturnType<typeof setTimeout> | null = null

    const paso = () => {
      if (!pausado) {
        posicion += 0.6
        if (posicion >= el.scrollWidth - el.clientWidth) posicion = 0
        el.scrollLeft = posicion
      }
      rafId = requestAnimationFrame(paso)
    }

    const alTocar = () => {
      pausado = true
      if (reanudar) clearTimeout(reanudar)
      reanudar = setTimeout(() => {
        posicion = el.scrollLeft
        pausado = false
      }, 2500)
    }

    el.addEventListener("touchstart", alTocar, { passive: true })
    el.addEventListener("touchmove", alTocar, { passive: true })
    rafId = requestAnimationFrame(paso)

    return () => {
      cancelAnimationFrame(rafId)
      if (reanudar) clearTimeout(reanudar)
      el.removeEventListener("touchstart", alTocar)
      el.removeEventListener("touchmove", alTocar)
      el.style.scrollBehavior = comportamientoPrevio
    }
  }, [categorias.length])

  if (categorias.length === 0) return null

  return (
    <div
      ref={scrollRef}
      className="flex gap-4 overflow-x-auto scroll-smooth px-4 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {categorias.map((cat) => {
        const icono = iconoDe(cat)
        return (
          <Link
            key={cat.id}
            href={`/businesses?type=${encodeURIComponent(cat.name)}`}
            className="flex w-[92px] shrink-0 flex-col items-center gap-2"
          >
            <div className="flex h-[76px] w-[76px] items-center justify-center overflow-hidden rounded-2xl bg-muted/60">
              {icono ? (
                <Image
                  src={icono}
                  alt={cat.name}
                  width={76}
                  height={76}
                  className="h-full w-full object-cover"
                />
              ) : null}
            </div>
            <span className="text-center text-[12px] font-medium leading-tight text-foreground">
              {cat.name}
            </span>
          </Link>
        )
      })}
    </div>
  )
}
