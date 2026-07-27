"use client"

import { useState } from "react" 
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Star, Award, Users } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

// Mock data para valoraciones
const mockRatings = [
  {
    id: "1",
    rating: 5,
    comment: "Excelente profesional, muy atento y eficiente. Recomendado 100%",
    reviewer_name: "Restaurante El Gourmet",
    reviewer_avatar: "/elegant-restaurant-logo.jpg",
    reviewer_type: "business",
    date: "2024-01-15",
  },
  {
    id: "2",
    rating: 5,
    comment: "Muy buen servicio, puntual y con gran actitud. Volveremos a contratarlo.",
    reviewer_name: "Bar La Terraza",
    reviewer_avatar: "/bar-logo.jpg",
    reviewer_type: "business",
    date: "2024-01-10",
  },
  {
    id: "3",
    rating: 4,
    comment: "Buen trabajo en general, aunque podría mejorar en la rapidez del servicio.",
    reviewer_name: "Café Central",
    reviewer_avatar: "/cafe-logo.png",
    reviewer_type: "business",
    date: "2024-01-05",
  },
  {
    id: "4",
    rating: 5,
    comment: "Profesional excepcional. Conoce muy bien su trabajo y trata a los clientes con mucha amabilidad.",
    reviewer_name: "Hotel Plaza",
    reviewer_avatar: "/elegant-hotel-logo.png",
    reviewer_type: "business",
    date: "2023-12-28",
  },
  {
    id: "5",
    rating: 5,
    comment: "Muy recomendable. Gran conocimiento de vinos y excelente atención al cliente.",
    reviewer_name: "Restaurante Mediterráneo",
    reviewer_avatar: "/restaurant-logo.png",
    reviewer_type: "business",
    date: "2023-12-20",
  },
]

const mockCandidate = {
  id: "1",
  name: "Santiago García",
  avatar: "/professional-waiter-headshot.jpg",
  rating: 4.8,
  total_ratings: 24,
}

interface CandidateRatingsContentProps {
  candidateId: string
}

export function CandidateRatingsContent({ candidateId }: CandidateRatingsContentProps) {
  const [filter, setFilter] = useState<"all" | 5 | 4 | 3 | 2 | 1>("all")

  // Calcular estadísticas
  const ratingCounts = {
    5: mockRatings.filter((r) => r.rating === 5).length,
    4: mockRatings.filter((r) => r.rating === 4).length,
    3: mockRatings.filter((r) => r.rating === 3).length,
    2: mockRatings.filter((r) => r.rating === 2).length,
    1: mockRatings.filter((r) => r.rating === 1).length,
  }

  const filteredRatings = filter === "all" ? mockRatings : mockRatings.filter((r) => r.rating === filter)

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`h-4 w-4 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
    ))
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })
  }

  return (
    <div className="min-h-screen bg-background pb-24 md:pt-14">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-card shadow-sm pt-[env(safe-area-inset-top,0px)]">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/profile/${candidateId}`}>
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
            <h1 className="text-xl font-bold">Valoraciones</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Candidate Info */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-primary">
                <AvatarImage src={mockCandidate.avatar || "/placeholder.svg"} />
                <AvatarFallback>{mockCandidate.name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-bold">{mockCandidate.name}</h2>
                <p className="text-sm text-muted-foreground">Camarero Profesional</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Average Rating */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Star className="h-8 w-8 fill-yellow-400 text-yellow-400" />
                  <span className="text-4xl font-bold">{mockCandidate.rating.toFixed(1)}</span>
                </div>
                <p className="text-sm text-muted-foreground">{mockCandidate.total_ratings} valoraciones</p>
              </div>

              {/* Total Reviews */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Users className="h-8 w-8 text-primary" />
                  <span className="text-4xl font-bold">{mockCandidate.total_ratings}</span>
                </div>
                <p className="text-sm text-muted-foreground">Empresas han valorado</p>
              </div>

              {/* Recommendation Rate */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Award className="h-8 w-8 text-primary" />
                  <span className="text-4xl font-bold">96%</span>
                </div>
                <p className="text-sm text-muted-foreground">Recomendación</p>
              </div>
            </div>

            {/* Rating Distribution */}
            <div className="space-y-3">
              <h3 className="font-semibold mb-3">Distribución de valoraciones</h3>
              {[5, 4, 3, 2, 1].map((stars) => (
                <div key={stars} className="flex items-center gap-3">
                  <button
                    onClick={() => setFilter(stars as any)}
                    className="flex items-center gap-1 min-w-[80px] hover:text-primary transition-colors"
                  >
                    <span className="text-sm font-medium">{stars}</span>
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  </button>
                  <Progress
                    value={(ratingCounts[stars as keyof typeof ratingCounts] / mockRatings.length) * 100}
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground min-w-[40px] text-right">
                    {ratingCounts[stars as keyof typeof ratingCounts]}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Filter Badges */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          <Badge
            variant={filter === "all" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setFilter("all")}
          >
            Todas ({mockRatings.length})
          </Badge>
          {[5, 4, 3, 2, 1].map((stars) => (
            <Badge
              key={stars}
              variant={filter === stars ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setFilter(stars as any)}
            >
              {stars} <Star className="h-3 w-3 ml-1 fill-current" /> ({ratingCounts[stars as keyof typeof ratingCounts]}
              )
            </Badge>
          ))}
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          {filteredRatings.map((rating) => (
            <Card key={rating.id}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <Avatar className="h-12 w-12 flex-shrink-0">
                    <AvatarImage src={rating.reviewer_avatar || "/placeholder.svg"} />
                    <AvatarFallback>{rating.reviewer_name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h4 className="font-semibold">{rating.reviewer_name}</h4>
                        <p className="text-xs text-muted-foreground">{formatDate(rating.date)}</p>
                      </div>
                      <Badge variant="secondary" className="flex-shrink-0">
                        Empresa
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">{renderStars(rating.rating)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredRatings.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay valoraciones con este filtro</h3>
              <p className="text-muted-foreground">Intenta con otro filtro para ver más valoraciones</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
