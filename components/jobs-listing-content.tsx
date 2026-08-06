"use client"

import { useRouter } from "next/navigation"

import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, MapPin, Briefcase, SlidersHorizontal, Search, Euro, Zap } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { BottomNavigation } from "@/components/bottom-navigation"
import { FlashOffersCarousel } from "@/components/flash-offers-carousel"
import { useLanguage } from "@/lib/i18n/language-context"
import { CityAutocomplete } from "@/components/city-autocomplete"
import { BUSINESS_VENUE_TYPES } from "@/lib/business-venue-types"

interface Job {
  id: string
  title: string
  description: string
  location: string
  salary_min?: number
  salary_max?: number
  is_active: boolean
  created_at: string
  business_id: string
  jobType?: string
  business: {
    display_name: string
    avatar_url: string
    type?: string
  }
  isFlash?: boolean
  isHighlighted?: boolean
  matchPercent?: number
  expiresAt?: string
}

interface FlashOffer {
  id: string
  title: string
  description: string
  jobType: string
  contractDays: number
  startDate: string
  endDate: string
  salary: number
  salaryPeriod: string
  location: string
  business: {
    id: string
    name: string
    logo: string
    rating: number
  }
  requirements: string[]
  postedAt: string
  expiresAt: string
  isUrgent: boolean
  imageUrl?: string | null
}

interface JobsListingContentProps {
  jobs: Job[]
  flashOffers: FlashOffer[]
}

export function JobsListingContent({ jobs, flashOffers }: JobsListingContentProps) {
  const router = useRouter()
  const { t } = useLanguage()
  const [searchQuery, setSearchQuery] = useState("")
  const [locationFilter, setLocationFilter] = useState("")
  const [salaryFilter, setSalaryFilter] = useState("")
  const [jobTypeFilter, setJobTypeFilter] = useState("all")
  const [companyTypeFilter, setCompanyTypeFilter] = useState("all")
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [visibleCount, setVisibleCount] = useState(8) // 4 rows x 2 columns

  // Seed filters from the search wizard (/search) via URL query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const jobType = params.get("jobType")
    const companyType = params.get("companyType")
    const location = params.get("location")
    const salary = params.get("salary")
    const q = params.get("q")
    if (jobType) setJobTypeFilter(jobType)
    if (companyType) setCompanyTypeFilter(companyType)
    if (location) setLocationFilter(location)
    if (salary) setSalaryFilter(salary)
    if (q) setSearchQuery(q)
  }, [])

  // `jobs` already includes flash offers (server-side query no longer
  // excludes is_flash) so they get real "visibilidad prioritaria" in the
  // main grid instead of only living in the carousel below. Sort ladder:
  // flash -> highlighted -> best profile match -> most recent.
  const allJobs = useMemo(() => {
    return [...jobs].sort((a, b) => {
      if (!!a.isFlash !== !!b.isFlash) return a.isFlash ? -1 : 1
      if (!!a.isHighlighted !== !!b.isHighlighted) return a.isHighlighted ? -1 : 1
      const matchDiff = (b.matchPercent || 0) - (a.matchPercent || 0)
      if (matchDiff !== 0) return matchDiff
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [jobs])

  const jobTypes = useMemo(() => {
    const types = new Set<string>()
    allJobs.forEach((job) => {
      if (job.jobType) types.add(job.jobType)
    })
    return Array.from(types).sort()
  }, [allJobs])

  const filteredJobs = allJobs.filter((job) => {
    const matchesSearch =
      searchQuery === "" ||
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.business.display_name.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesLocation = locationFilter === "" || job.location.toLowerCase().includes(locationFilter.toLowerCase())

    const matchesSalary =
      salaryFilter === "" ||
      (job.salary_min && job.salary_min >= Number.parseInt(salaryFilter)) ||
      (job.salary_max && job.salary_max >= Number.parseInt(salaryFilter))

    const matchesJobType = jobTypeFilter === "all" || job.jobType === jobTypeFilter

    const matchesCompanyType = companyTypeFilter === "all" || job.business.type === companyTypeFilter

    return matchesSearch && matchesLocation && matchesSalary && matchesJobType && matchesCompanyType && job.is_active
  })

  const visibleJobs = filteredJobs.slice(0, visibleCount)
  const hasMore = visibleCount < filteredJobs.length

  const loadMore = () => {
    setVisibleCount((prev) => prev + 8)
  }

  const clearFilters = () => {
    setSearchQuery("")
    setLocationFilter("")
    setSalaryFilter("")
    setJobTypeFilter("all")
    setCompanyTypeFilter("all")
  }

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date().getTime()
    const expiry = new Date(expiresAt).getTime()
    const diff = expiry - now
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return { hours, minutes, isExpired: diff <= 0 }
  }

  return (
    <div className="min-h-screen bg-background pb-24 md:pt-14">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white pt-[env(safe-area-inset-top,0px)]">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
              <Image src="/logo-cpf.png" alt="CamareroPorFavor" width={36} height={36} className="object-contain rounded-full" />
              <h1 className="text-lg font-bold">{t("jobs.available")}</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Flash Offers Carousel */}
        {flashOffers.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-[#01A89E] p-1.5 rounded-lg">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{t("flash.offers")}</h2>
                <p className="text-[13px] text-muted-foreground">{t("flash.expiring")}</p>
              </div>
            </div>
            <FlashOffersCarousel offers={flashOffers} />
          </section>
        )}

        {/* Search and Filter Bar */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("search.jobSearchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-base"
              />
            </div>
            <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full sm:w-auto sm:min-w-[140px] h-12 bg-white border-2 border-gray-200 hover:bg-gray-50"
                >
                  <SlidersHorizontal className="w-5 h-5 mr-2" />
                  <span className="font-semibold">{t("filters.title")}</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>{t("filters.sheetTitle")}</SheetTitle>
                  <SheetDescription>{t("filters.sheetDescription")}</SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-6 pb-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("filters.jobType")}</label>
                    <Select value={jobTypeFilter} onValueChange={setJobTypeFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("filters.allJobTypes")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("filters.allJobTypes")}</SelectItem>
                        {jobTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("filters.companyType")}</label>
                    <Select value={companyTypeFilter} onValueChange={setCompanyTypeFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("filters.allCompanyTypes")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("filters.allCompanyTypes")}</SelectItem>
                        {BUSINESS_VENUE_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("filters.location")}</label>
                    <CityAutocomplete
                      value={locationFilter}
                      onChange={setLocationFilter}
                      placeholder={t("filters.locationPlaceholder")}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("filters.salary")}</label>
                    <div className="relative">
                      <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        placeholder={t("filters.salaryPlaceholder")}
                        value={salaryFilter}
                        onChange={(e) => setSalaryFilter(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button onClick={() => setIsFilterOpen(false)} className="flex-1 bg-primary hover:bg-primary/90">
                      {t("filters.apply")}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        clearFilters()
                        setIsFilterOpen(false)
                      }}
                      className="flex-1"
                    >
                      {t("filters.clear")}
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Active Filters Display */}
          {(searchQuery ||
            locationFilter ||
            salaryFilter ||
            jobTypeFilter !== "all" ||
            companyTypeFilter !== "all") && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm text-muted-foreground">{t("filters.active")}</span>
              {searchQuery && (
                <Badge variant="secondary" className="gap-1">
                  {t("filters.search")}: {searchQuery}
                  <button onClick={() => setSearchQuery("")} className="ml-1 hover:text-destructive">
                    ×
                  </button>
                </Badge>
              )}
              {jobTypeFilter !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  {t("filters.type")}: {jobTypeFilter}
                  <button onClick={() => setJobTypeFilter("all")} className="ml-1 hover:text-destructive">
                    ×
                  </button>
                </Badge>
              )}
              {companyTypeFilter !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  {t("filters.company")}: {companyTypeFilter}
                  <button onClick={() => setCompanyTypeFilter("all")} className="ml-1 hover:text-destructive">
                    ×
                  </button>
                </Badge>
              )}
              {locationFilter && (
                <Badge variant="secondary" className="gap-1">
                  {t("filters.locationBadge")}: {locationFilter}
                  <button onClick={() => setLocationFilter("")} className="ml-1 hover:text-destructive">
                    ×
                  </button>
                </Badge>
              )}
              {salaryFilter && (
                <Badge variant="secondary" className="gap-1">
                  {t("filters.salaryBadge")}: €{salaryFilter}+
                  <button onClick={() => setSalaryFilter("")} className="ml-1 hover:text-destructive">
                    ×
                  </button>
                </Badge>
              )}
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 text-[13px]">
                {t("filters.clearAll")}
              </Button>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            {filteredJobs.length} {filteredJobs.length === 1 ? t("jobs.found") : t("jobs.foundPlural")}
          </p>
        </div>

        {/* Jobs Grid */}
        <div className="grid grid-cols-2 gap-2">
          {filteredJobs.length === 0 ? (
            <div className="col-span-2">
              <Card>
                <CardContent className="p-12 text-center">
                  <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{t("jobs.noJobsFound")}</h3>
                  <p className="text-muted-foreground mb-4">{t("jobs.adjustFilters")}</p>
                  <Button onClick={clearFilters} variant="outline">
                    {t("filters.clear")}
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            visibleJobs.map((job) => (
              <Link key={job.id} href={`/jobs/${job.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full overflow-hidden">
                  <div className="relative w-full h-16 bg-gradient-to-br from-gray-100 to-gray-200">
                    <Image
                      src={job.business.avatar_url || "/placeholder.svg?height=96&width=200"}
                      alt={job.business.display_name}
                      fill
                      className="object-cover"
                    />
                    {job.isFlash && (
                      <Badge className="absolute top-1 left-1 bg-[#F97316] text-white text-[12px] px-1 py-0 h-4 gap-0.5">
                        <Zap className="h-2 w-2" /> Flash
                      </Badge>
                    )}
                    {!job.isFlash && job.isHighlighted && (
                      <Badge className="absolute top-1 left-1 bg-[#F48221] text-white text-[12px] px-1 py-0 h-4">
                        Destacada
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-0.5">
                    <h3 className="font-semibold text-sm line-clamp-1 leading-tight mb-0.5">{job.title}</h3>
                    <p className="text-[13px] text-muted-foreground line-clamp-1 mb-0.5">{job.business.display_name}</p>
                    <div className="space-y-0 border-t pt-0">
                      <div className="flex items-center gap-0.5 text-sm text-muted-foreground">
                        <MapPin className="h-2.5 w-2.5 flex-shrink-0" />
                        <span className="truncate">{job.location}</span>
                      </div>
                      {(job.salary_min || job.salary_max) && (
                        <div className="flex items-center gap-0.5 text-sm font-medium text-green-600">
                          <Euro className="h-2.5 w-2.5 flex-shrink-0" />
                          <span className="truncate">
                            {job.salary_min && job.salary_max && job.salary_min === job.salary_max
                              ? `€${job.salary_min}`
                              : job.salary_min && job.salary_max
                                ? `€${job.salary_min}-${job.salary_max}`
                                : job.salary_min
                                  ? `€${job.salary_min}+`
                                  : `€${job.salary_max}`}
                          </span>
                        </div>
                      )}
                      {job.jobType && (
                        <Badge variant="outline" className="text-[13px] w-full justify-center py-0 h-4 mt-0.5">
                          {job.jobType}
                        </Badge>
                      )}
                      {typeof job.matchPercent === "number" && job.matchPercent > 0 && (
                        <Badge className="bg-[#01A89E]/10 text-[#01A89E] border-[#01A89E]/30 text-[13px] w-full justify-center py-0 h-4 mt-0.5">
                          {job.matchPercent}% coincidencia
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>

        {/* Load More button section */}
        {hasMore && filteredJobs.length > 0 && (
          <div className="text-center mt-8 mb-8">
            <Button
              onClick={loadMore}
              size="lg"
              className="min-w-[200px] bg-[#01A89E] hover:bg-[#018F86] text-white font-semibold"
            >
              CARGAR MÁS
            </Button>
            <p className="text-sm text-muted-foreground mt-3">
              Mostrando {visibleJobs.length} de {filteredJobs.length}{" "}
              {filteredJobs.length === 1 ? t("jobs.found") : t("jobs.foundPlural")}
            </p>
          </div>
        )}
      </div>

      <BottomNavigation profile={null} />
    </div>
  )
}
