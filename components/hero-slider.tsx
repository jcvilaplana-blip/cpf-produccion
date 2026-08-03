"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useLanguage } from "@/lib/i18n/language-context"

export function HeroSlider() {
  const { t } = useLanguage()

  const slide = {
    title: t("hero.slide2Title"),
    description: t("hero.slide2Description"),
    image: "/busy-restaurant-kitchen-team-working.jpg",
    cta: t("hero.slide2CTA"),
    ctaLink: "/search",
  }

  return (
    <div className="relative w-full aspect-[8/9] md:aspect-video overflow-hidden bg-background">
      <div className="absolute inset-0">
        <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" />
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to right, rgba(0, 0, 0, 0.70), rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0.25))",
          }}
        />
      </div>

      <div className="relative h-full flex items-center">
        <div className="container mx-auto px-4 md:px-8 max-w-6xl">
          <div className="max-w-2xl space-y-4 md:space-y-6">
            <h1 className="text-2xl md:text-6xl font-bold text-white text-balance leading-tight">{slide.title}</h1>
            <p className="text-sm md:text-xl text-white/90 text-pretty">{slide.description}</p>
            <div className="flex justify-center md:justify-start">
              <Button asChild size="lg" className="text-lg bg-[#F48221] hover:bg-[#D9721D] text-white">
                <Link href={slide.ctaLink}>{slide.cta}</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
