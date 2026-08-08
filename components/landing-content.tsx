"use client"

import type React from "react"
import { HeroSlider } from "@/components/hero-slider"
import { CategoriesScroll } from "@/components/categories-scroll"
import { WorkerVideoCard } from "@/components/worker-video-card"
import { FlashOffersCarousel } from "@/components/flash-offers-carousel"
import { CompaniesCarousel } from "@/components/companies-carousel"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, Zap } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

import { useLanguage } from "@/lib/i18n/language-context"
import { useAuth } from "@/hooks/use-auth"
import Image from "next/image"
import { VenueTypesScroll } from "@/components/venue-types-scroll"
import { formatLocation } from "@/lib/format-location"

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

const INITIAL_WORKERS_COUNT = 6
const LOAD_MORE_COUNT = 12

export function LandingContent({ featuredJobs, stats, businesses, workers: workersData = [], flashOffers = [], isLoggedIn = false }: LandingContentProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const { user } = useAuth()
  // Un establecimiento no puede abrir las ofertas -son de la competencia,
  // y el guardián de rol se lo impide-, así que tampoco se le ofrecen:
  // enseñar un enlace que rebota al panel sólo desconcierta.
  const esEstablecimiento = user?.userType === "business"
  const esCandidato = user?.userType === "worker"
  const [displayedWorkers, setDisplayedWorkers] = useState(INITIAL_WORKERS_COUNT)

  // Map workers from database format
  const workers = workersData.map((profile: any) => ({
    id: profile.id,
    name: profile.display_name,
    category: profile.job_category || "General",
    location: formatLocation(profile.location),
    rating: profile.rating || 0,
    avatarUrl: profile.avatar_url || "/placeholder.svg",
    experience: `${profile.experience_years || 0} ${t("candidates.years")} ${t("candidates.yearsExperience")}`,
  }))

  const visibleWorkers = workers.slice(0, displayedWorkers)
  const hasMoreWorkers = displayedWorkers < workers.length

  const loadMoreWorkers = () => {
    setDisplayedWorkers((prev) => Math.min(prev + LOAD_MORE_COUNT, workers.length))
  }

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

      {/* Primera sección bajo la cabecera. Al candidato no se le enseñan las
          categorías de empleo -las tiene enteras en su panel y en el buscador-
          sino por qué clase de local puede trabajar, que es la decisión que sí
          toma desde la portada. */}
      {esCandidato ? (
        <section className="py-6">
          <div className="container mx-auto px-4 mb-4">
            <h2 className="text-lg md:text-2xl font-bold">Tipo de Establecimiento</h2>
          </div>
          <VenueTypesScroll />
        </section>
      ) : (
        <CategoriesScroll />
      )}

      {!esEstablecimiento && (
      <section className="pt-2 pb-6 md:py-6 bg-gradient-to-b from-background to-teal-50/30">
        <div className="container mx-auto px-4">
          {/* La tarjeta entera lleva a las ofertas. Antes sólo respondía el
              botón, así que pulsar sobre el título, el texto o las fotos no
              hacía nada — que es justo donde cae el dedo en una tarjeta de
              este tamaño. El botón se mantiene porque señala la acción. */}
          <Link
            href="/jobs"
            className="block bg-[#01A89E] bg-gradient-to-br from-[#01A89E] to-[#018F86] rounded-2xl overflow-hidden shadow-lg transition-transform active:scale-[0.99]"
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
      )}

      {!esEstablecimiento && (
      <section className="pt-4 pb-4 md:py-8 bg-gradient-to-b from-teal-50 to-background">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-3 md:mb-6 gap-2">
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
      )}

      {/* A un candidato no se le enseñan otros candidatos: explorarlos le está
          vedado por rol, así que esta sección era una fila de tarjetas que no
          podía abrir. Su reemplazo -los tipos de establecimiento- vive ahora
          arriba del todo, así que aquí simplemente no hay sección. */}
      {!esCandidato && (
      <section className="pt-4 pb-4 md:py-6 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-3 md:mb-6">
            <div>
              <h2 className="text-lg md:text-2xl font-bold whitespace-nowrap">{t("landing.latestCandidates")}</h2>
            </div>
            <Button asChild variant="ghost">
              <Link href="/candidates">
                {t("common.viewAll")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {visibleWorkers.map((worker) => (
              <WorkerVideoCard key={worker.id} {...worker} />
            ))}
          </div>

          {visibleWorkers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{t("landing.noCandidatesFound")}</p>
            </div>
          )}

          {hasMoreWorkers && (
            <div className="text-center mt-8">
              <Button
                onClick={loadMoreWorkers}
                size="lg"
                variant="outline"
                className="min-w-[200px] bg-background hover:bg-muted"
              >
                {t("common.loadMore")}
              </Button>
              <p className="text-sm text-muted-foreground mt-2">
                {t("common.showing")} {visibleWorkers.length} {t("common.of")} {workers.length}{" "}
                {t("candidates.title").toLowerCase()}
              </p>
            </div>
          )}
        </div>
      </section>
      )}

      {/* Tipos de establecimiento, también sin sesión: quien todavía no se ha
          identificado está explorando, y esto le sitúa por dónde puede buscar.
          Al candidato ya se le muestra arriba del todo, así que aquí no se
          repite. */}
      {!esCandidato && !isLoggedIn && (
        <section className="pt-4 pb-2 md:py-6 bg-background">
          <div className="container mx-auto px-4 mb-3">
            <h2 className="text-lg md:text-2xl font-bold">Tipo de Establecimiento</h2>
          </div>
          <VenueTypesScroll />
        </section>
      )}

      <section className="pt-4 pb-6 md:py-8 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-3 md:mb-6">
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

      <section className="pt-6 pb-12 bg-muted/30">
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
