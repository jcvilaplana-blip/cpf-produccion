"use client"

import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface RatingSummaryProps {
  rating: number
  totalRatings: number
  showDetails?: boolean
  size?: "sm" | "md" | "lg"
  variant?: "default" | "video"
}

export function RatingSummary({
  rating,
  totalRatings,
  showDetails = true,
  size = "md",
  variant = "default",
}: RatingSummaryProps) {
  const renderStars = (rating: number) => {
    const starSize = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-6 w-6" : "h-5 w-5"

    const starColorFilled = variant === "video" ? "fill-yellow-400 text-yellow-400" : "fill-primary text-primary"
    const starColorEmpty = variant === "video" ? "text-yellow-400/30" : "text-muted-foreground"

    return Array.from({ length: 5 }).map((_, i) => (
      <Star key={i} className={cn(starSize, i < Math.round(rating) ? starColorFilled : starColorEmpty)} />
    ))
  }

  const textSize = size === "sm" ? "text-sm" : size === "lg" ? "text-lg font-semibold" : "text-base"
  const textColor = variant === "video" ? "text-white" : "text-muted-foreground"

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">{renderStars(rating)}</div>
      {showDetails && (
        <span className={cn(textSize, textColor)}>
          {variant === "video"
            ? rating.toFixed(1)
            : `${rating.toFixed(1)} (${totalRatings} ${totalRatings === 1 ? "valoración" : "valoraciones"})`}
        </span>
      )}
    </div>
  )
}
