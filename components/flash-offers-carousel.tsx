"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, MapPin, Calendar, Euro } from "lucide-react"
import Link from "next/link"

interface FlashOffer {
  id: string
  title: string
  jobType: string
  contractDays: number
  salary: number
  salaryPeriod: string
  location: string
  expiresAt: string
  imageUrl?: string | null
}

interface FlashOffersCarouselProps {
  offers: FlashOffer[]
}

export function FlashOffersCarousel({ offers }: FlashOffersCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [timeRemaining, setTimeRemaining] = useState<{ [key: string]: string }>({})

  // Calculate time remaining for each offer
  useEffect(() => {
    const updateTimeRemaining = () => {
      const newTimeRemaining: { [key: string]: string } = {}
      offers.forEach((offer) => {
        const now = new Date().getTime()
        const expiry = new Date(offer.expiresAt).getTime()
        const diff = expiry - now

        if (diff > 0) {
          const hours = Math.floor(diff / (1000 * 60 * 60))
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
          newTimeRemaining[offer.id] = `${hours}h ${minutes}m`
        } else {
          newTimeRemaining[offer.id] = "Expirada"
        }
      })
      setTimeRemaining(newTimeRemaining)
    }

    updateTimeRemaining()
    const interval = setInterval(updateTimeRemaining, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [offers])

  // Auto-scroll effect
  useEffect(() => {
    const scrollContainer = scrollRef.current
    if (!scrollContainer) return

    let scrollInterval: NodeJS.Timeout

    const startAutoScroll = () => {
      scrollInterval = setInterval(() => {
        if (scrollContainer) {
          const maxScroll = scrollContainer.scrollWidth - scrollContainer.clientWidth
          const currentScroll = scrollContainer.scrollLeft

          if (currentScroll >= maxScroll) {
            // Reset to start
            scrollContainer.scrollTo({ left: 0, behavior: "smooth" })
          } else {
            scrollContainer.scrollBy({ left: 456, behavior: "smooth" })
          }
        }
      }, 3000) // Scroll every 3 seconds
    }

    startAutoScroll()

    return () => {
      if (scrollInterval) clearInterval(scrollInterval)
    }
  }, [])

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {offers.map((offer) => (
          <Link key={offer.id} href={`/flash-offers/${offer.id}`} className="flex-shrink-0">
            <Card className="w-[220px] py-0 gap-0 border-2 border-[#E73A36]/30 bg-gradient-to-br from-[#E73A36]/5 to-white hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer overflow-hidden">
              {offer.imageUrl && (
                <img src={offer.imageUrl} alt={offer.title} className="w-full h-20 object-cover block" />
              )}
              <CardContent className="p-2.5 space-y-1.5">
                {/* Job Type Badge */}
                <Badge className="bg-[#E73A36] text-white text-[13px]">{offer.jobType}</Badge>

                {/* Contract Days */}
                <div className="flex items-center gap-1.5 text-[13px]">
                  <Calendar className="w-3.5 h-3.5 text-[#E73A36]" />
                  <span className="font-semibold">{offer.contractDays} días</span>
                </div>

                {/* Salary */}
                <div className="flex items-center gap-1.5">
                  <Euro className="w-4 h-4 text-green-600" />
                  <span className="text-base font-bold text-green-600">
                    €{offer.salary}
                    <span className="text-[13px] font-normal text-muted-foreground">/{offer.salaryPeriod}</span>
                  </span>
                </div>

                {/* Location */}
                <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="truncate">{offer.location}</span>
                </div>

                {/* Time Remaining */}
                <div className="flex items-center gap-1.5 text-[13px]">
                  <Clock className="w-3.5 h-3.5 text-red-500" />
                  <span className="font-semibold text-red-500">{timeRemaining[offer.id] || "Calculando..."}</span>
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
