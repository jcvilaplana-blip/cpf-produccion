"use client"

import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"

import { useState, useEffect } from "react"
import { FlashOfferCard } from "@/components/flash-offer-card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { CityAutocomplete } from "@/components/city-autocomplete"
import { ArrowLeft, Zap, SlidersHorizontal, Loader2, ChevronDown, ChevronUp } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/lib/i18n/language-context"
import { createClient } from "@/lib/supabase/client"

export default function FlashOffersPage() {
  const router = useRouter()
  // Barrera de navegación por rol. Va en el cliente porque esta página es un
  // componente de cliente entero; para las de servidor se usa `blockRole`,
  // que es más sólido. Aquí sirve para no ofrecer lo que no corresponde, no
  // como control de acceso a los datos: eso es cosa de RLS en la base.
  const { user, isLoading: authLoading } = useAuth()
  useEffect(() => {
    if (!authLoading && user?.userType === "business") router.replace("/business-dashboard")
  }, [authLoading, user, router])

  const { t } = useLanguage()
  const [sortBy, setSortBy] = useState("fecha")
  const [filterCity, setFilterCity] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [offers, setOffers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchFlashOffers() {
      const supabase = createClient()
      const { data } = await supabase
        .from("jobs")
        .select("*")
        .eq("is_active", true)
        .eq("is_flash", true)
        .order("created_at", { ascending: false })

      const businessIds = [...new Set((data || []).map((job: any) => job.business_id).filter(Boolean))]
      const businessMap = new Map<string, { name: string; logo: string | null }>()
      if (businessIds.length > 0) {
        const { data: businesses } = await supabase
          .from("business_profiles")
          .select("id, company_name, company_logo_url")
          .in("id", businessIds)
        for (const b of businesses || []) businessMap.set(b.id, { name: b.company_name, logo: b.company_logo_url })
      }

      setOffers((data || []).map((job: any) => {
        const b = businessMap.get(job.business_id)
        const created = new Date(job.created_at).getTime()
        const expiry = job.flash_expires_at ? new Date(job.flash_expires_at).getTime() : created + 24 * 60 * 60 * 1000
        const contractDays = Math.max(1, Math.round((expiry - created) / (1000 * 60 * 60 * 24)))
        return {
          id: job.id,
          title: job.title,
          description: job.description || "",
          jobType: job.category || "Camarero",
          contractDays,
          startDate: job.start_date || job.created_at,
          endDate: job.flash_expires_at || new Date(expiry).toISOString(),
          salary: job.salary_min || 0,
          salaryPeriod: "día",
          location: job.city || job.location || "España",
          business: {
            id: job.business_id,
            name: b?.name || "Empresa",
            logo: b?.logo || "",
            rating: 0,
          },
          requirements: (job.requirements || "").split("\n").filter(Boolean),
          postedAt: job.created_at,
          expiresAt: job.flash_expires_at || new Date(expiry).toISOString(),
          isUrgent: true,
          imageUrl: job.image_url || null,
        }
      }))
      setLoading(false)
    }
    fetchFlashOffers()
  }, [])

  const cities = ["todas", ...new Set(offers.map((o) => o.location.split(",")[0]))]

  const sortedOffers = [...offers].sort((a, b) => {
    if (sortBy === "fecha") return new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime()
    if (sortBy === "salario") return b.salary - a.salary
    return 0
  })

  const filteredOffers = sortedOffers.filter((offer) => {
    if (filterCity && !(offer.location || "").toLowerCase().includes(filterCity.toLowerCase())) return false
    return true
  })

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-background md:pt-14">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          {/* Mismo control de volver que el resto de la aplicación: sólo la
              flecha. El botón con texto rompía la coherencia en móvil. */}
          <Button variant="ghost" size="icon" className="mb-4" onClick={() => router.back()} aria-label="Volver">
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-3 mb-2">
            <div className="bg-[#01A89E] p-3 rounded-lg">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-balance">{t("flashOffers.title")}</h1>
              <p className="text-muted-foreground mt-1">{t("flashOffers.subtitle")}</p>
            </div>
          </div>

          <div className="bg-teal-100 border border-teal-300 rounded-lg p-4 mt-4">
            <p className="text-sm text-[#01A89E]">
              <strong>{t("flashOffers.tip")}</strong> {t("flashOffers.tipMessage")}
            </p>
          </div>
        </div>

        {/* Filtros con el mismo lenguaje que los de Empresas: panel propio,
            campos altos y opciones binarias como chips. El desplegable de
            ciudades se sustituye por el autocompletado de direcciones que usa
            el resto de la aplicación: la lista sólo ofrecía las ciudades donde
            ya había alguna oferta flash publicada. */}
        <div className="mb-6">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm text-sm active:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <SlidersHorizontal className="w-4 h-4 text-gray-500" />
              <span className="font-semibold text-gray-700 dark:text-gray-200">Filtrar</span>
              {filterCity && (
                <Badge className="bg-[#01A89E] text-white text-[12px] px-1.5 py-0 min-w-[20px] h-5 flex items-center justify-center rounded-full">
                  1
                </Badge>
              )}
            </div>
            {showFilters ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {showFilters && (
            <div className="mt-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
              <div className="px-4 py-5 space-y-5">
                <div>
                  <Label className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">
                    Ordenar por
                  </Label>
                  <div className="flex flex-wrap gap-2.5">
                    {[
                      { id: "fecha", label: t("flashOffers.sortByDate") },
                      { id: "salario", label: t("flashOffers.sortBySalary") },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setSortBy(opt.id)}
                        className={`px-4 py-2.5 rounded-full text-[13px] font-semibold transition-all active:scale-95 ${
                          sortBy === opt.id
                            ? "bg-[#01A89E] text-white shadow-md shadow-[#01A89E]/25"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">
                    Ciudad
                  </Label>
                  <CityAutocomplete
                    placeholder="Todas las ciudades"
                    value={filterCity}
                    onChange={setFilterCity}
                    className="h-12 rounded-2xl bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  />
                </div>
              </div>

              <div className="border-t border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/80 px-4 py-3">
                <Button
                  onClick={() => {
                    setSortBy("fecha")
                    setFilterCity("")
                  }}
                  variant="outline"
                  className="w-full h-11 rounded-2xl text-sm font-semibold"
                >
                  Limpiar filtros
                </Button>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOffers.map((offer) => (
              <FlashOfferCard key={offer.id} {...offer} />
            ))}
          </div>
        )}

        {!loading && filteredOffers.length === 0 && (
          <div className="text-center py-12">
            <Zap className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">{t("flashOffers.noOffersWithFilters")}</h3>
            <p className="text-muted-foreground">{t("flashOffers.tryAdjustFilters")}</p>
          </div>
        )}
      </div>
    </div>
  )
}
