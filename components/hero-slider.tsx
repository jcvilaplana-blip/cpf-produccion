"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { MapPin, Zap, Search, X } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/lib/i18n/language-context"

const SLIDE_DURATION = 5000

export function HeroSlider() {
  const { t } = useLanguage()

  const slides = [
    {
      title: t("hero.slide1Title"),
      description: t("hero.slide1Description"),
      image: "/professional-waiter-in-elegant-restaurant-uniform.jpg",
      videoUrl: "/reel-home1.mp4",
      hasVideo: true,
      icon: null,
      cta: t("hero.slide1CTA"),
      ctaLink: "/create-profile",
    },
    {
      title: t("hero.slide2Title"),
      description: t("hero.slide2Description"),
      image: "/city-map-with-location-pins-restaurants.jpg",
      icon: MapPin,
      cta: t("hero.slide2CTA"),
      ctaLink: "/search",
    },
    {
      title: t("hero.slide3Title"),
      description: t("hero.slide3Description"),
      image: "/busy-restaurant-kitchen-team-working.jpg",
      icon: Zap,
      cta: t("hero.slide3CTA"),
      ctaLink: "/flash-offers",
    },
    {
      title: t("hero.slide5Title"),
      description: t("hero.slide5Description"),
      image: "/search-map-interface.jpg",
      icon: Search,
      cta: t("hero.slide5CTA"),
      ctaLink: "/search",
    },
  ]

  const [currentSlide, setCurrentSlide] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const touchStartX = useRef<number>(0)
  const touchEndX = useRef<number>(0)
  const previewVideoRef = useRef<HTMLVideoElement | null>(null)
  const fullscreenVideoRef = useRef<HTMLVideoElement | null>(null)

  // Autoplay the muted preview video whenever slide 1 is active
  useEffect(() => {
    if (currentSlide === 0 && previewVideoRef.current) {
      previewVideoRef.current.currentTime = 0
      previewVideoRef.current.play().catch(() => {})
    }
  }, [currentSlide])

  // Advance slides every 5 seconds, paused while the fullscreen video is open
  useEffect(() => {
    if (isFullscreen) return
    timerRef.current = setTimeout(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, SLIDE_DURATION)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [currentSlide, slides.length, isFullscreen])

  useEffect(() => {
    if (isFullscreen && fullscreenVideoRef.current) {
      fullscreenVideoRef.current.currentTime = 0
      fullscreenVideoRef.current.play().catch(() => {})
    }
  }, [isFullscreen])

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX
  }

  const handleTouchEnd = () => {
    const swipeThreshold = 50
    const diff = touchStartX.current - touchEndX.current
    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        setCurrentSlide((prev) => (prev + 1) % slides.length)
      } else {
        setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
      }
    }
  }

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  return (
    <>
      <div
        className="relative w-full aspect-[8/9] md:aspect-video overflow-hidden bg-background"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="relative h-full">
          {slides.map((slide, index) => {
            const Icon = slide.icon
            return (
              <div
                key={index}
                className="absolute inset-0 transition-transform duration-700 ease-in-out"
                style={{
                  transform:
                    index === currentSlide
                      ? "translateX(0)"
                      : index < currentSlide
                        ? "translateX(-100%)"
                        : "translateX(100%)",
                }}
              >
                <div
                  className={`absolute inset-0 ${slide.hasVideo ? "cursor-pointer" : ""}`}
                  onClick={() => slide.hasVideo && setIsFullscreen(true)}
                >
                  {slide.hasVideo && slide.videoUrl ? (
                    <video
                      ref={index === 0 ? previewVideoRef : null}
                      src={slide.videoUrl}
                      className="w-full h-full object-cover pointer-events-none"
                      muted
                      loop
                      playsInline
                      preload="auto"
                      controls={false}
                    />
                  ) : (
                    <img
                      src={slide.image || "/placeholder.svg"}
                      alt={slide.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(to right, rgba(0, 0, 0, 0.70), rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0.25))",
                    }}
                  />
                </div>

                <div className="relative h-full flex items-center pointer-events-none">
                  <div className="container mx-auto px-4 md:px-8 max-w-6xl">
                    <div className="max-w-2xl space-y-4 md:space-y-6">
                      <h1 className="text-2xl md:text-6xl font-bold text-white text-balance leading-tight">
                        {slide.title}
                      </h1>
                      <p className="text-sm md:text-xl text-white/90 text-pretty">{slide.description}</p>
                      <div className="flex justify-center md:justify-start pointer-events-auto">
                        <Button asChild size="lg" className="text-lg bg-[#F48221] hover:bg-[#D9721D] text-white">
                          <Link href={slide.ctaLink}>{slide.cta}</Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentSlide ? "w-8 bg-white" : "w-2 bg-white/50 hover:bg-white/75"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {isFullscreen && (
        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 z-10 h-10 w-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Cerrar"
          >
            <X className="h-6 w-6" />
          </button>
          <video
            ref={fullscreenVideoRef}
            src={slides[0].videoUrl}
            className="w-full h-full object-contain"
            playsInline
            controls={false}
            onEnded={() => setIsFullscreen(false)}
          />
        </div>
      )}
    </>
  )
}
