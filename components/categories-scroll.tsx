"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Utensils, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"

interface CategoryFromDB {
  id: string
  name: string
  slug: string
  icon: string | null
  role_type?: string
}

export function CategoriesScroll() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [categories, setCategories] = useState<CategoryFromDB[]>([])

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((json) => {
        const cats = (json.data || []).filter((c: CategoryFromDB) => (c.role_type || "candidate") === "candidate")
        setCategories(cats)
      })
      .catch(() => {})
  }, [])

  // Mobile-only: autoplay a continuous right-to-left drift through the icons,
  // pausing briefly whenever the user manually touches/drags the strip.
  useEffect(() => {
    const el = scrollRef.current
    if (!el || categories.length === 0) return
    if (!window.matchMedia("(max-width: 767px)").matches) return

    const maxScroll = el.scrollWidth - el.clientWidth
    if (maxScroll <= 0) return

    // `scroll-smooth` (CSS scroll-behavior) fights per-frame scrollLeft writes,
    // so force instant scrolling for the duration of the autoplay loop.
    const previousBehavior = el.style.scrollBehavior
    el.style.scrollBehavior = "auto"

    // Track position as a plain float — reading back the (integer-rounded)
    // el.scrollLeft each frame would quantize a 0.5px step into a no-op.
    let position = 0
    el.scrollLeft = position

    let rafId: number
    let paused = false
    let resumeTimeout: ReturnType<typeof setTimeout> | null = null

    const step = () => {
      if (!paused) {
        position += 0.6
        if (position >= el.scrollWidth - el.clientWidth) {
          position = 0
        }
        el.scrollLeft = position
      }
      rafId = requestAnimationFrame(step)
    }
    rafId = requestAnimationFrame(step)

    const pauseAutoplay = () => {
      paused = true
      if (resumeTimeout) clearTimeout(resumeTimeout)
      resumeTimeout = setTimeout(() => {
        position = el.scrollLeft
        paused = false
      }, 4000)
    }
    el.addEventListener("touchstart", pauseAutoplay, { passive: true })
    el.addEventListener("pointerdown", pauseAutoplay)

    return () => {
      cancelAnimationFrame(rafId)
      if (resumeTimeout) clearTimeout(resumeTimeout)
      el.removeEventListener("touchstart", pauseAutoplay)
      el.removeEventListener("pointerdown", pauseAutoplay)
      el.style.scrollBehavior = previousBehavior
    }
  }, [categories])

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 300
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      })
    }
  }

  return (
    <section className="pt-8 pb-3 md:pb-8 bg-background border-y">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg md:text-2xl font-bold whitespace-nowrap">Empleos</h2>
          <Button asChild variant="link" className="text-primary">
            <Link href="/categories">Ver todos</Link>
          </Button>
        </div>

        <div className="relative group">
          <button
            onClick={() => scroll("left")}
            className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm border rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm border rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div
            ref={scrollRef}
            className="flex gap-1.5 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
          >
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/category/${category.slug}`}
                className="flex-shrink-0 flex flex-col items-center gap-1.5 p-1.5 rounded-xl hover:bg-accent active:scale-95 transition-all min-w-[70px]"
              >
                <div className="w-[72px] h-[72px] flex items-center justify-center">
                  {category.icon ? (
                    <img src={category.icon} alt={category.name} className="w-full h-full object-contain" />
                  ) : (
                    <Utensils className="w-11 h-11 text-[#E73A36]" />
                  )}
                </div>
                <div className="text-center">
                  <div className="font-semibold text-sm leading-tight whitespace-nowrap">{category.name}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
