"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface Rating {
  id: string
  rating: number
  review: string | null
  created_at: string
  rater: {
    id: string
    display_name: string
    avatar_url: string | null
    user_type: string
  }
  job?: {
    title: string
  } | null
}

interface RatingsListProps {
  ratings: Rating[]
  emptyMessage?: string
}

export function RatingsList({ ratings, emptyMessage = "Aún no hay valoraciones" }: RatingsListProps) {
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={cn("h-5 w-5", i < rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")}
      />
    ))
  }

  if (ratings.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">{emptyMessage}</h3>
          <p className="text-muted-foreground">Las valoraciones aparecerán aquí cuando completes trabajos</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {ratings.map((rating) => (
        <Card key={rating.id}>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={rating.rater.avatar_url || "/placeholder.svg"} />
                <AvatarFallback className="bg-primary/10 text-primary">{rating.rater.display_name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-semibold">{rating.rater.display_name}</h4>
                    {rating.job && <p className="text-[13px] text-muted-foreground">Trabajo: {rating.job.title}</p>}
                  </div>
                  <div className="flex items-center gap-1">{renderStars(rating.rating)}</div>
                </div>
                <p className="text-[13px] text-muted-foreground">
                  {new Date(rating.created_at).toLocaleDateString("es-ES", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
