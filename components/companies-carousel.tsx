"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent } from "@/components/ui/card" 
import { Badge } from "@/components/ui/badge"
import { MapPin, Star, Briefcase, CheckCircle2, ImageOff } from "lucide-react"
import Link from "next/link"

interface Company {
  id: string
  name: string
  type: string
  location: string
  rating: number
  activeJobs: number
  logo: string
  verified: boolean
}

interface CompaniesCarouselProps {
  companies: Company[]
}

export function CompaniesCarousel({ companies }: CompaniesCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isPaused, setIsPaused] = useState(false)
  const [imgErrors, setImgErrors] = useState<Set<string>>(new Set())

  // Auto-scroll effect
  useEffect(() => {
    const scrollContainer = scrollRef.current
    if (!scrollContainer) return

    const scrollInterval = setInterval(() => {
      if (isPaused || !scrollContainer) return
      const maxScroll = scrollContainer.scrollWidth - scrollContainer.clientWidth
      if (scrollContainer.scrollLeft >= maxScroll - 10) {
        scrollContainer.scrollTo({ left: 0, behavior: "smooth" })
      } else {
        scrollContainer.scrollBy({ left: 260, behavior: "smooth" })
      }
    }, 3500)

    return () => clearInterval(scrollInterval)
  }, [isPaused])

  if (!companies || companies.length === 0) return null

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => { setTimeout(() => setIsPaused(false), 5000) }}
      >
        {companies.map((company) => (
          <Link key={company.id} href={`/business/${company.id}`} className="flex-shrink-0">
            <Card className="w-[220px] border hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer overflow-hidden">
              <CardContent className="p-0">
                {/* Company image */}
                <div className="relative w-full h-32 bg-gradient-to-br from-teal-100 to-teal-50 overflow-hidden">
                  {imgErrors.has(company.id) ? (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 bg-gradient-to-br from-[#01A89E]/10 to-[#01A89E]/5">
                      <div className="w-14 h-14 rounded-2xl bg-[#01A89E]/15 flex items-center justify-center">
                        <span className="text-2xl font-bold text-[#01A89E]">{company.name?.[0] || "E"}</span>
                      </div>
                      <span className="text-xs text-muted-foreground font-medium">{company.type}</span>
                    </div>
                  ) : (
                    <img
                      src={company.logo || "/images/companies/el-gourmet.jpg"}
                      alt={company.name || "Empresa"}
                      className="w-full h-full object-cover"
                      crossOrigin="anonymous"
                      onError={() => setImgErrors(prev => new Set(prev).add(company.id))}
                    />
                  )}
                  {company.verified && (
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-[#01A89E] text-white text-[10px] gap-1 px-1.5 py-0.5 shadow-sm">
                        <CheckCircle2 className="w-3 h-3" />
                        Verificada
                      </Badge>
                    </div>
                  )}
                  {company.activeJobs > 0 && (
                    <div className="absolute bottom-2 left-2">
                      <Badge className="bg-[#E73A36] text-white text-[10px] px-1.5 py-0.5 shadow-sm">
                        {company.activeJobs} {company.activeJobs === 1 ? "oferta" : "ofertas"}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Company info */}
                <div className="p-3 space-y-2">
                  <div>
                    <h3 className="font-bold text-sm truncate">{company.name || "Empresa"}</h3>
                    <Badge variant="secondary" className="mt-1 text-[10px] px-1.5 py-0">
                      {company.type || "General"}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-[#01A89E]" />
                    <span className="truncate font-medium">{company.location || "Espana"}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1.5 border-t">
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="font-bold">{company.rating || "4.5"}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Briefcase className="w-3.5 h-3.5" />
                      <span className="font-medium">{company.activeJobs || 0} ofertas</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}
