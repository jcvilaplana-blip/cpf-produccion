"use client"

import type React from "react"
import { HeroSlider } from "@/components/hero-slider"
import { CategoriesScroll } from "@/components/categories-scroll"
import { VenueTypesScroll } from "@/components/venue-types-scroll"
import { FlashOffersCarousel } from "@/components/flash-offers-carousel"
import { CompaniesCarousel } from "@/components/companies-carousel"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, Zap } from "lucide-react"
import { useRouter } from "next/navigation"

import { useLanguage } from "@/lib/i18n/language-context"
import Image from "next/image"

interface LandingContentProps {
  featuredJobs: any[]
  stats: {
    totalJobs: number
    totalWorkers: number
    totalBusinesses: number
  }
  businesses: any[]
  workers?: any[]
  flashOffers?: any[]
  isLoggedIn?: boolean
}

export function LandingContent({ featuredJobs, stats, businesses, workers: workersData = [], flashOffers = [], isLoggedIn = false }: LandingContentProps) {
  const { t } = useLanguage()
  const router = useRouter()

  // `workersData` sigue llegando por props aunque esta portada ya no pinte
  // candidatos: la portada del establecimiento, que va después, sí los
  // necesita y comparte este mismo componente.

  const featuredFlashOffers = flashOffers.slice(0, 3)

  // Anonymous visitors can see the homepage as a showcase, but any real tap
  // sends them to login/register instead of letting them interact with
  // anything. Using onClickCapture (not a blocking overlay) is deliberate:
  // browsers only ever fire a "click" event for a genuine tap, never for a
  // drag/swipe, so this still lets touch gestures reach scrollable children
  // (e.g. the Empleos carousel) natively instead of eating every touch event
  // outright the way a full-screen overlay div would.
  const handleGateClick = (e: React.MouseEvent) => {
    if (isLoggedIn) return
    e.preventDefault()
    e.stopPropagation()
    router.push("/auth/login")
  }

  return (
    <div className="min-h-screen bg-background" onClickCapture={handleGateClick}>
      <HeroSlider />

      <CategoriesScroll />

      <section className="pt-2 pb-6 md:py-6 bg-gradient-to-b from-background to-teal-50/30">
        <div className="container mx-auto px-4">
          {/* La tarjeta entera lleva a las ofertas. Antes sólo respondía el
              botón, así que pulsar sobre el título, el texto o las fotos no
              hacía nada — que es justo donde cae el dedo en una tarjeta de
              este tamaño. El botón se mantiene porque señala la acción. */}
          <Link
            href="/jobs"
            className="block bg-gradient-to-br from-[#01A89E] to-[#018F86] rounded-2xl overflow-hidden shadow-lg transition-transform active:scale-[0.99]"
          >
            <div className="grid md:grid-cols-2 gap-0">
              {/* Contenido de texto */}
              <div className="p-6 md:p-8 flex flex-col justify-center">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">{t("landing.jobOffersSection")}</h2>
                <p className="text-white/90 mb-6 text-sm md:text-base">{t("landing.jobOffersDescription")}</p>
                {/* Sin `asChild`+Link: la tarjeta entera ya es el enlace y
                    anidar un <a> dentro de otro es HTML inválido. Aquí sólo
                    señala la acción. */}
                <span className="inline-flex h-11 w-full items-center justify-center rounded-md bg-white px-8 text-sm font-medium text-[#018F86] md:w-auto">
                  {t("landing.exploreAllJobs")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </span>
              </div>

              {/* Grid de imagenes */}
              <div className="grid grid-cols-2 gap-1 h-48 md:h-auto">
                <div className="relative">
                  <Image src="/professional-waiter-serving-in-elegant-restaurant.jpg" alt="Camarero profesional" fill className="object-cover" />
                </div>
                <div className="relative">
                  <Image src="/chef-modern-kitchen.png" alt="Chef cocinando" fill className="object-cover" />
                </div>
                <div className="relative">
                  <Image
                    src="/bartender-mixing-cocktails.jpg"
                    alt="Bartender preparando cocteles"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="relative">
                  <Image src="/hotel-receptionist-welcoming-guests.jpg" alt="Recepcionista de hotel" fill className="object-cover" />
                </div>
              </div>
            </div>
          </Link>
        </div>
      </section>

      <section className="py-8 bg-gradient-to-b from-teal-50 to-background">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6 gap-2">
            <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
              <div className="bg-[#01A89E] p-1.5 md:p-2 rounded-lg flex-shrink-0">
                <Zap className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl md:text-2xl lg:text-3xl font-bold whitespace-nowrap">
                  {t("landing.flashOffersTitle")}
                </h2>
                <p className="text-[13px] md:text-sm text-muted-foreground mt-0.5 md:mt-1 truncate">
                  <span className="hidden sm:inline">{t("landing.flashOffersSubtitle")}</span>
                  <span className="sm:hidden">{t("landing.flashOffersSubtitleMobile")}</span>
                </p>
              </div>
            </div>
            <Button
              asChild
              variant="ghost"
              className="text-[#018F86] hover:text-[#017A73] flex-shrink-0 text-sm md:text-base"
            >
              <Link href="/flash-offers">
                <span className="hidden sm:inline">{t("common.viewAllFeminine")}</span>
                <span className="sm:hidden">{t("common.viewMore")}</span>
                <ArrowRight className="ml-1 md:ml-2 h-3 w-3 md:h-4 md:w-4" />
              </Link>
            </Button>
          </div>

          {featuredFlashOffers.length > 0 ? (
            <FlashOffersCarousel offers={featuredFlashOffers} />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No hay ofertas flash disponibles en este momento
            </div>
          )}
        </div>
      </section>

      {/* Tipos de establecimiento. Sustituye a "Últimos Candidatos": en la
          portada del candidato, ver a otros candidatos no le aporta nada — lo
          que busca es dónde trabajar. */}
      <VenueTypesScroll />

      <section className="py-8 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg md:text-2xl font-bold whitespace-nowrap">{t("landing.latestBusinesses")}</h2>
            </div>
            <Button asChild variant="ghost">
              <Link href="/businesses">
                {t("common.viewAllFeminine")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <CompaniesCarousel companies={businesses} />
        </div>
      </section>

      <section className="py-6 pb-12 bg-muted/30">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-balance">{t("landing.readyForNextStep")}</h2>
            <p className="text-lg text-primary-foreground/90 text-pretty mt-0">{t("landing.joinPlatform")}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-1">
            <Button asChild size="lg">
              <Link href="/auth/sign-up?type=worker">{t("landing.createProfileFree")}</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground bg-transparent"
            >
              <Link href="/auth/sign-up?type=business">{t("landing.postJob")}</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
