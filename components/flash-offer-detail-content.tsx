"use client"

import { Button } from "@/components/ui/button" 
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  ArrowLeft,
  Calendar,
  Clock,
  Euro,
  MapPin,
  Briefcase,
  CheckCircle2,
  Star,
  Zap,
  MessageSquare,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface FlashOffer {
  id: string
  title: string
  description: string
  location: string
  salary_min: number
  salary_max: number
  start_date: string
  end_date: string
  requirements: string
  job_type: string
  expires_at: string
  image_url: string | null
  business_profile_id: string
  business?: {
    id: string
    company_name: string
    company_logo_url: string
    rating: number
  }
}

export function FlashOfferDetailContent({ id }: { id: string }) {
  const router = useRouter()
  const [timeRemaining, setTimeRemaining] = useState("")
  const [offer, setOffer] = useState<FlashOffer | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadOffer = async () => {
      setLoading(true)
      const supabase = createClient()
      
      const { data } = await supabase
        .from("jobs")
        .select(`
          id, title, description, city, salary_min, salary_max,
          start_date, flash_expires_at, requirements, job_type, category, image_url,
          business_id
        `)
        .eq("id", id)
        .eq("is_flash", true)
        .single()

      if (data) {
        // Load business info
        const { data: business } = await supabase
          .from("business_profiles")
          .select("id, company_name, company_logo_url, rating")
          .eq("id", data.business_id)
          .single()

        setOffer({
          id: data.id,
          title: data.title,
          description: data.description || "",
          location: data.city || "Espana",
          salary_min: data.salary_min || 0,
          salary_max: data.salary_max || 0,
          start_date: data.start_date || new Date().toISOString(),
          end_date: data.flash_expires_at || new Date().toISOString(),
          requirements: data.requirements || "",
          job_type: data.job_type || data.category || "Temporal",
          expires_at: data.flash_expires_at || new Date().toISOString(),
          image_url: data.image_url || null,
          business_profile_id: data.business_id,
          business: business ? {
            id: business.id,
            company_name: business.company_name,
            company_logo_url: business.company_logo_url,
            rating: business.rating || 0,
          } : undefined,
        })
      }
      setLoading(false)
    }
    loadOffer()
  }, [id])

  useEffect(() => {
    if (!offer) return

    const updateTimeRemaining = () => {
      const now = new Date().getTime()
      const expiry = new Date(offer.expires_at).getTime()
      const diff = expiry - now

      if (diff > 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        setTimeRemaining(`${hours}h ${minutes}m`)
      } else {
        setTimeRemaining("Expirada")
      }
    }

    updateTimeRemaining()
    const interval = setInterval(updateTimeRemaining, 60000)

    return () => clearInterval(interval)
  }, [offer])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-teal-50 to-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#01A89E]" />
      </div>
    )
  }

  if (!offer) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-teal-50 to-background flex items-center justify-center">
        <div className="text-center">
          <Zap className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Oferta no encontrada</h2>
          <p className="text-muted-foreground mb-4">Esta oferta flash no existe o ha expirado</p>
          <Button asChild>
            <Link href="/jobs/flash">Ver todas las ofertas</Link>
          </Button>
        </div>
      </div>
    )
  }

  const handleAcceptOffer = () => {
    router.push(
      `/messages?businessId=${offer.business_profile_id}&businessName=${encodeURIComponent(offer.business?.company_name || "Empresa")}&offerId=${offer.id}`,
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-background md:pt-14">
      <div className="container mx-auto px-4 py-8">
        {/* Header Navigation */}
        <div className="flex items-center justify-between mb-6">
          <Button asChild variant="ghost">
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al inicio
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/jobs/flash">
              <Zap className="w-4 h-4 mr-2" />
              Ver todas
            </Link>
          </Button>
        </div>

        {/* Urgent Badge */}
        <div className="flex items-center gap-2 mb-4">
          <Badge className="bg-red-500 text-white text-sm px-3 py-1">
            <Clock className="w-4 h-4 mr-1" />
            URGENTE - Expira en {timeRemaining}
          </Badge>
          <Badge className="bg-[#01A89E] text-white text-sm">{offer.job_type}</Badge>
        </div>

        {offer.image_url && (
          <img
            src={offer.image_url}
            alt={offer.title}
            className="w-full h-56 md:h-72 object-cover rounded-xl mb-6"
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title and Description */}
            <Card className="border-2 border-teal-200">
              <CardHeader>
                <CardTitle className="text-3xl">{offer.title}</CardTitle>
                <div className="flex items-center gap-4 text-muted-foreground mt-2">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{offer.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>Temporal</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Descripcion del trabajo</h3>
                  <p className="text-muted-foreground">{offer.description}</p>
                </div>

                {/* Salary */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <Euro className="w-6 h-6 text-green-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Salario</p>
                      <p className="text-2xl font-bold text-green-600">
                        {offer.salary_min > 0 ? `€${offer.salary_min}` : "A convenir"}
                        {offer.salary_max > 0 && ` - €${offer.salary_max}`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-1">Fecha de inicio</p>
                    <p className="font-semibold">{new Date(offer.start_date).toLocaleDateString("es-ES")}</p>
                  </div>
                  <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-1">Expira</p>
                    <p className="font-semibold">{new Date(offer.expires_at).toLocaleDateString("es-ES")}</p>
                  </div>
                </div>

                {/* Requirements */}
                {offer.requirements && (
                  <div>
                    <h3 className="font-semibold mb-3">Requisitos</h3>
                    <ul className="space-y-2">
                      {offer.requirements.split("\n").filter(Boolean).map((req, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Business Info */}
            {offer.business && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Empresa</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={offer.business.company_logo_url || "/placeholder.svg"} alt={offer.business.company_name} />
                      <AvatarFallback>{offer.business.company_name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{offer.business.company_name}</h3>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span>{offer.business.rating}</span>
                      </div>
                    </div>
                  </div>

                  <Button asChild variant="outline" className="w-full bg-transparent">
                    <Link href={`/business/${offer.business.id}`}>
                      <Briefcase className="w-4 h-4 mr-2" />
                      Ver perfil de empresa
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Action Card */}
            <Card className="border-2 border-teal-300 bg-gradient-to-br from-teal-50 to-white">
              <CardContent className="pt-6 space-y-4">
                <div className="text-center">
                  <Zap className="w-12 h-12 text-[#01A89E] mx-auto mb-2" />
                  <h3 className="font-bold text-lg mb-1">No pierdas esta oportunidad!</h3>
                  <p className="text-sm text-muted-foreground">Esta oferta expira pronto</p>
                </div>

                <Button onClick={handleAcceptOffer} size="lg" className="w-full bg-[#01A89E] hover:bg-[#018F86]">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Aceptar Oferta Flash
                </Button>

                <p className="text-[13px] text-center text-muted-foreground">
                  Al aceptar, se abrira un chat con la empresa para coordinar los detalles
                </p>
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="bg-teal-50 border-teal-200">
              <CardContent className="pt-6">
                <h4 className="font-semibold mb-2">Consejo</h4>
                <p className="text-sm text-muted-foreground">
                  Las ofertas flash son trabajos urgentes. Responde rapido y manten tu perfil actualizado para aumentar
                  tus posibilidades.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
