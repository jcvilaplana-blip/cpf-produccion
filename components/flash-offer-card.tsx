"use client"

import { Card, CardContent } from "@/components/ui/card" 
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Calendar, Clock, Euro, Zap } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface FlashOfferCardProps {
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

export function FlashOfferCard({
  id,
  title,
  description,
  jobType,
  contractDays,
  startDate,
  endDate,
  salary,
  salaryPeriod,
  location,
  business,
  requirements,
  expiresAt,
  isUrgent,
  imageUrl,
}: FlashOfferCardProps) {
  const router = useRouter()

  const handleAcceptOffer = () => {
    router.push(`/messages?businessId=${business.id}&businessName=${encodeURIComponent(business.name)}&offerId=${id}`)
  }

  const getTimeRemaining = () => {
    const now = new Date().getTime()
    const expiry = new Date(expiresAt).getTime()
    const diff = expiry - now
    const hours = Math.floor(diff / (1000 * 60 * 60))
    return hours > 0 ? `${hours}h restantes` : "Expira pronto"
  }

  return (
    <Card className="hover:shadow-lg transition-all border-2 border-teal-200 bg-gradient-to-br from-teal-50 to-white overflow-hidden">
      {imageUrl && (
        <img src={imageUrl} alt={title} className="w-full h-40 object-cover" />
      )}
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {isUrgent && (
                <Badge variant="destructive" className="bg-[#01A89E] hover:bg-[#018F86]">
                  <Zap className="w-3 h-3 mr-1" />
                  URGENTE
                </Badge>
              )}
              <Badge variant="secondary">{jobType}</Badge>
            </div>
            <h3 className="font-bold text-lg mb-2 text-balance">{title}</h3>
            <p className="text-sm text-muted-foreground text-pretty line-clamp-2">{description}</p>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">{contractDays} días</span>
            <span className="text-muted-foreground">
              ({new Date(startDate).toLocaleDateString("es-ES", { day: "numeric", month: "short" })} -{" "}
              {new Date(endDate).toLocaleDateString("es-ES", { day: "numeric", month: "short" })})
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Euro className="w-4 h-4 text-muted-foreground" />
            <span className="font-bold text-primary">
              {salary}€ <span className="text-muted-foreground font-normal">{salaryPeriod}</span>
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            {location}
          </div>

          <div className="flex items-center gap-2 text-sm text-[#018F86] font-medium">
            <Clock className="w-4 h-4" />
            {getTimeRemaining()}
          </div>
        </div>

        <div className="border-t pt-4 mb-4">
          <Link
            href={`/business/${business.id}`}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <img
              src={business.logo || "/placeholder.svg"}
              alt={business.name}
              className="w-12 h-12 rounded-lg object-cover"
            />
            <div>
              <p className="font-semibold text-sm">{business.name}</p>
              <p className="text-[13px] text-muted-foreground">⭐ {business.rating} · Ver empresa</p>
            </div>
          </Link>
        </div>

        <Button onClick={handleAcceptOffer} className="w-full bg-[#01A89E] hover:bg-[#018F86]" size="lg">
          <Zap className="w-4 h-4 mr-2" />
          Me interesa la Oferta
        </Button>
      </CardContent>
    </Card>
  )
}
