"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { createRatingAction } from "@/lib/actions"

interface RatingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ratedUserId: string
  ratedUserName: string
  jobId: string
  onSuccess?: () => void
}

export function RatingDialog({ open, onOpenChange, ratedUserId, ratedUserName, jobId, onSuccess }: RatingDialogProps) {
  const router = useRouter()
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [review, setReview] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (rating === 0) {
      setError("Por favor selecciona una calificación")
      return
    }

    if (!jobId) {
      setError("No se encontró la oferta asociada a esta contratación")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const result = await createRatingAction(ratedUserId, jobId, rating, review)
      if (result.error) {
        setError(result.error)
        return
      }

      onOpenChange(false)
      setRating(0)
      setReview("")
      router.refresh()
      onSuccess?.()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Error al enviar la valoración")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Valorar a {ratedUserName}</DialogTitle>
          <DialogDescription>Comparte tu experiencia trabajando con este usuario</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Calificación</Label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={cn(
                      "h-8 w-8 transition-colors",
                      star <= (hoveredRating || rating)
                        ? "fill-primary text-primary"
                        : "text-muted-foreground hover:text-primary/50",
                    )}
                  />
                </button>
              ))}
              {rating > 0 && <span className="ml-2 text-sm text-muted-foreground">({rating}/5)</span>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="review">Comentario (opcional)</Label>
            <Textarea
              id="review"
              placeholder="Cuéntanos sobre tu experiencia..."
              rows={4}
              value={review}
              onChange={(e) => setReview(e.target.value)}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">{review.length}/500</p>
          </div>

          {error && <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">{error}</div>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || rating === 0} className="bg-primary">
            {isSubmitting ? "Enviando..." : "Enviar Valoración"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
