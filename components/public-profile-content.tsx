"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button" 
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  ArrowLeft,
  MapPin,
  Phone,
  Star,
  MessageCircle,
  Building,
  Heart,
  Calendar,
  Briefcase,
  GraduationCap,
  Award,
  Mail,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { RatingDialog } from "@/components/rating-dialog"
import { RatingsList } from "@/components/ratings-list"
import { RatingSummary } from "@/components/rating-summary"
import { BottomNavigation } from "@/components/bottom-navigation"
import { getOrCreateConversation } from "@/lib/messaging"
import type { Profile, BusinessProfile } from "@/lib/types"

// Mock data para experiencia laboral
const mockExperience = [
  {
    id: "1",
    position: "Camarero Senior",
    company: "Restaurante El Gourmet",
    location: "Madrid",
    startDate: "2020-01",
    endDate: null,
    current: true,
    description: "Atención al cliente, gestión de mesas, coordinación con cocina",
  },
  {
    id: "2",
    position: "Camarero",
    company: "Bar La Terraza",
    location: "Madrid",
    startDate: "2018-06",
    endDate: "2019-12",
    current: false,
    description: "Servicio de bar y terraza, preparación de bebidas",
  },
]

// Mock data para formación
const mockEducation = [
  {
    id: "1",
    title: "Curso de Sumiller",
    institution: "Escuela de Hostelería",
    year: "2019",
    description: "Especialización en vinos y maridaje",
  },
  {
    id: "2",
    title: "Formación en Hostelería",
    institution: "Centro de FP",
    year: "2017",
    description: "Técnico en Servicios de Restauración",
  },
]

interface PublicProfileContentProps {
  currentUser: any // Ahora puede ser null
  currentProfile: Profile | null
  viewedProfile: Profile
  businessProfile: BusinessProfile | null
  ratings: any[]
  hasRated: boolean
}

export function PublicProfileContent({
  currentUser,
  currentProfile,
  viewedProfile,
  businessProfile,
  ratings,
  hasRated,
}: PublicProfileContentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showRatingDialog, setShowRatingDialog] = useState(false)
  const [isStartingChat, setIsStartingChat] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)

  const toggleFavorite = () => {
    if (!currentUser) {
      sessionStorage.setItem("redirectAfterLogin", window.location.pathname)
      router.push("/auth/login")
      return
    }
    setIsFavorite(!isFavorite)
    // TODO: Implementar guardado en base de datos
  }

  const handleStartChat = async () => {
    if (!currentUser) {
      sessionStorage.setItem("redirectAfterLogin", window.location.pathname)
      router.push("/auth/login")
      return
    }

    setIsStartingChat(true)
    try {
      const conversation = await getOrCreateConversation(currentUser.id, viewedProfile.id)
      router.push("/messages")
    } catch (error) {
      console.error("Error starting chat:", error)
    } finally {
      setIsStartingChat(false)
    }
  }

  const handleRequestInterview = () => {
    if (!currentUser) {
      sessionStorage.setItem("redirectAfterLogin", window.location.pathname)
      router.push("/auth/login")
      return
    }
    // TODO: Implementar solicitud de entrevista
  }

  const handleRateUser = () => {
    if (!currentUser) {
      sessionStorage.setItem("redirectAfterLogin", window.location.pathname)
      router.push("/auth/login")
      return
    }
    setShowRatingDialog(true)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", { month: "long", year: "numeric" })
  }

  return (
    <div className="min-h-screen bg-background md:pt-14">
      <header className="sticky top-0 z-40 w-full border-b bg-card shadow-sm pt-[env(safe-area-inset-top,0px)]">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <Link href="/" className="flex-shrink-0">
              <Image
                src="/logo-cpf.png"
                alt="CamareroPorFavor"
                width={36}
                height={36}
                className="object-contain rounded-full cursor-pointer"
              />
            </Link>
            <h1 className="text-xl font-bold">Perfil Profesional</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-4xl pb-24">
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start gap-6">
              <div className="relative">
                <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                  <AvatarImage src={viewedProfile.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                    {viewedProfile.display_name[0]}
                  </AvatarFallback>
                </Avatar>
                {viewedProfile.user_type === "business" && (
                  <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground rounded-full p-2">
                    <Building className="h-4 w-4" />
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="mb-3">
                  <h2 className="text-2xl font-bold mb-1">{viewedProfile.display_name}</h2>
                  <Badge variant="secondary" className="mt-2">
                    {viewedProfile.user_type === "business" ? "Empresa" : "Camarero Profesional"}
                  </Badge>
                </div>

                <RatingSummary
                  rating={viewedProfile.rating || 4.8}
                  totalRatings={viewedProfile.total_ratings || 24}
                  size="md"
                />

                <div className="space-y-2 text-sm mt-4">
                  {viewedProfile.location && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {viewedProfile.location}
                    </div>
                  )}
                  {viewedProfile.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      {viewedProfile.phone}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    {currentUser?.email || "Inicia sesión para ver contacto"}
                  </div>
                </div>

                {viewedProfile.bio && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{viewedProfile.bio}</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 mt-4">
                  <Button
                    onClick={handleStartChat}
                    disabled={isStartingChat}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    {isStartingChat ? "Iniciando..." : "Contactar"}
                  </Button>
                  {currentProfile?.user_type === "business" && (
                    <Button variant="outline" onClick={handleRequestInterview}>
                      <Calendar className="h-4 w-4 mr-2" />
                      Solicitar Entrevista
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={toggleFavorite}
                    className={isFavorite ? "text-red-500 border-red-500" : ""}
                  >
                    <Heart className={`h-4 w-4 mr-2 ${isFavorite ? "fill-red-500" : ""}`} />
                    {isFavorite ? "Guardado" : "Guardar"}
                  </Button>
                  {currentUser && !hasRated && currentUser.id !== viewedProfile.id && (
                    <Button variant="outline" onClick={handleRateUser}>
                      <Star className="h-4 w-4 mr-2" />
                      Valorar
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {viewedProfile.user_type === "worker" && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                Experiencia Laboral
              </h3>
              <div className="space-y-6">
                {mockExperience.map((exp) => (
                  <div key={exp.id} className="relative pl-6 border-l-2 border-primary/20">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary border-2 border-background" />
                    <div className="space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold">{exp.position}</h4>
                        {exp.current && (
                          <Badge variant="secondary" className="text-xs">
                            Actual
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm font-medium text-muted-foreground">{exp.company}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {exp.location}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(exp.startDate)} - {exp.current ? "Actualidad" : formatDate(exp.endDate!)}
                      </p>
                      {exp.description && <p className="text-sm text-muted-foreground mt-2">{exp.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {viewedProfile.user_type === "worker" && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                Formación
              </h3>
              <div className="space-y-4">
                {mockEducation.map((edu) => (
                  <div key={edu.id} className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Award className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">{edu.title}</h4>
                      <p className="text-sm text-muted-foreground">{edu.institution}</p>
                      <p className="text-xs text-muted-foreground mt-1">{edu.year}</p>
                      {edu.description && <p className="text-sm text-muted-foreground mt-2">{edu.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {viewedProfile.location && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Ubicación
              </h3>
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center space-y-2">
                  <MapPin className="h-12 w-12 text-primary mx-auto" />
                  <p className="text-sm text-muted-foreground">{viewedProfile.location}</p>
                  <p className="text-xs text-muted-foreground">Mapa interactivo próximamente</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {viewedProfile.user_type === "worker" &&
          viewedProfile.portfolio_images &&
          viewedProfile.portfolio_images.length > 0 && (
            <Card className="mb-6">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-4">Galería de Imágenes</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {viewedProfile.portfolio_images.map((imageUrl: string, i: number) => (
                    <div key={i} className="aspect-square bg-muted rounded-lg overflow-hidden">
                      <img
                        src={imageUrl || "/placeholder.svg"}
                        alt={`Imagen ${i + 1}`}
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-300 cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Link href={`/profile/${viewedProfile.id}/ratings`} className="hover:opacity-80 transition-opacity">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-400" />
                  Valoraciones ({ratings.length})
                </h3>
              </Link>
              <Link href={`/profile/${viewedProfile.id}/ratings`}>
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                  Ver Todas
                </Button>
              </Link>
            </div>
            <RatingsList ratings={ratings} />
            {ratings.length > 3 && (
              <div className="mt-4 text-center">
                <Button asChild variant="outline">
                  <Link href={`/profile/${viewedProfile.id}/ratings`}>Ver todas las valoraciones</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* NOTE: this component is currently unused (not routed anywhere) - jobId
          left blank since there's no job context here yet. Wire this up to a
          real accepted application before ever rendering this component. */}
      <RatingDialog
        open={showRatingDialog}
        onOpenChange={setShowRatingDialog}
        ratedUserId={viewedProfile.id}
        ratedUserName={viewedProfile.display_name}
        jobId=""
        onSuccess={() => router.refresh()}
      />

      {currentUser && <BottomNavigation profile={currentProfile} />}
    </div>
  )
}
