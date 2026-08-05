"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Star, Building, Users, Loader2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { RatingDialog } from "@/components/rating-dialog"
import { BUSINESS_RATING_CRITERIA, readCriterion } from "@/lib/rating-criteria"

interface BusinessRatingsContentProps {
  businessId: string
  currentUserId: string
}

interface ReviewRow {
  id: string
  score: number
  comment: string | null
  created_at: string
  reviewer_name: string
  reviewer_avatar: string | null
  criteria: Record<string, number> | null
}

export function BusinessRatingsContent({ businessId, currentUserId }: BusinessRatingsContentProps) {
  const [filter, setFilter] = useState<"all" | 5 | 4 | 3 | 2 | 1>("all")
  const [loading, setLoading] = useState(true)
  const [business, setBusiness] = useState<{ name: string; avatar: string | null; rating: number; total_ratings: number } | null>(null)
  const [reviews, setReviews] = useState<ReviewRow[]>([])
  const [eligibleJobId, setEligibleJobId] = useState<string | null>(null)
  const [alreadyRated, setAlreadyRated] = useState(false)
  const [showRatingDialog, setShowRatingDialog] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
      const supabase = createClient()

      const [{ data: bp }, { data: profile }] = await Promise.all([
        supabase.from("business_profiles").select("company_name, company_logo_url").eq("id", businessId).single(),
        supabase.from("profiles").select("display_name, rating, total_ratings").eq("id", businessId).single(),
      ])

      setBusiness({
        name: bp?.company_name || profile?.display_name || "Empresa",
        avatar: bp?.company_logo_url || null,
        rating: profile?.rating || 0,
        total_ratings: profile?.total_ratings || 0,
      })

      const { data: ratingsData } = await supabase
        .from("ratings")
        .select("id, score, comment, created_at, from_user_id, criteria")
        .eq("to_user_id", businessId)
        .order("created_at", { ascending: false })

      if (ratingsData && ratingsData.length > 0) {
        const reviewerIds = [...new Set(ratingsData.map((r) => r.from_user_id))]
        const { data: reviewers } = await supabase
          .from("profiles")
          .select("id, display_name, avatar_url")
          .in("id", reviewerIds)
        const reviewerMap = new Map((reviewers || []).map((r) => [r.id, r]))

        setReviews(
          ratingsData.map((r) => ({
            id: r.id,
            score: r.score,
            comment: r.comment,
            created_at: r.created_at,
            reviewer_name: reviewerMap.get(r.from_user_id)?.display_name || "Usuario",
            reviewer_avatar: reviewerMap.get(r.from_user_id)?.avatar_url || null,
            criteria:
              typeof r.criteria === "string"
                ? (() => { try { return JSON.parse(r.criteria) } catch { return null } })()
                : (r.criteria as Record<string, number> | null),
          }))
        )

        if (ratingsData.some((r) => r.from_user_id === currentUserId)) {
          setAlreadyRated(true)
        }
      }

      // Eligible to rate only if this business actually hired the current
      // user for one of its jobs (an accepted application).
      const { data: businessJobs } = await supabase.from("jobs").select("id").eq("business_id", businessId)
      const jobIds = (businessJobs || []).map((j) => j.id)
      if (jobIds.length > 0) {
        const { data: acceptedApp } = await supabase
          .from("applications")
          .select("job_id")
          .eq("worker_id", currentUserId)
          .eq("status", "accepted")
          .in("job_id", jobIds)
          .limit(1)
          .maybeSingle()
        if (acceptedApp) setEligibleJobId(acceptedApp.job_id)
      }
      } catch (e) {
        console.error("Error loading business ratings:", e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [businessId, currentUserId])

  if (loading || !business) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#01A89E]" />
      </div>
    )
  }

  const ratingCounts = {
    5: reviews.filter((r) => r.score === 5).length,
    4: reviews.filter((r) => r.score === 4).length,
    3: reviews.filter((r) => r.score === 3).length,
    2: reviews.filter((r) => r.score === 2).length,
    1: reviews.filter((r) => r.score === 1).length,
  }

  const filteredReviews = filter === "all" ? reviews : reviews.filter((r) => r.score === filter)

  // Media por criterio. Se calcula aquí, de las reseñas ya cargadas, en lugar
  // de pedir otro endpoint: los datos necesarios ya están en memoria.
  const criteriaAverages = BUSINESS_RATING_CRITERIA.map((criterion) => {
    const values = reviews
      .map((review) => readCriterion(review.criteria, criterion))
      .filter((value): value is number => typeof value === "number")
    if (values.length === 0) return null
    return {
      label: criterion.label,
      value: Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10,
    }
  }).filter(Boolean) as { label: string; value: number }[]

  const renderStars = (score: number) =>
    Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`h-4 w-4 ${i < score ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
    ))

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })

  return (
    <div className="min-h-screen bg-background pb-24 md:pt-14">
      <header className="sticky top-0 z-40 w-full border-b bg-card shadow-sm pt-[env(safe-area-inset-top,0px)]">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/business/${businessId}`}>
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <Link href="/" className="flex-shrink-0">
              <Image src="/logo-cpf.png" alt="CamareroPorFavor" width={36} height={36} className="object-contain rounded-full cursor-pointer" />
            </Link>
            <h1 className="text-xl font-bold">Valoraciones de Empresa</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-primary">
                  <AvatarImage src={business.avatar || undefined} />
                  <AvatarFallback>{business.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-bold">{business.name}</h2>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building className="h-4 w-4" />
                    <span>Empresa de Hostelería</span>
                  </div>
                </div>
              </div>

              {eligibleJobId && !alreadyRated && (
                <Button onClick={() => setShowRatingDialog(true)} className="bg-primary hover:bg-primary/90">
                  <Star className="h-4 w-4 mr-2" /> Valorar empresa
                </Button>
              )}
              {alreadyRated && (
                <Badge variant="secondary" className="gap-1"><Star className="h-3 w-3 fill-yellow-400 text-yellow-400" /> Ya la valoraste</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Star className="h-8 w-8 fill-yellow-400 text-yellow-400" />
                  <span className="text-4xl font-bold">{business.rating.toFixed(1)}</span>
                </div>
                <p className="text-sm text-muted-foreground">{reviews.length} valoraciones</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Users className="h-8 w-8 text-primary" />
                  <span className="text-4xl font-bold">{reviews.length}</span>
                </div>
                <p className="text-sm text-muted-foreground">Trabajadores han valorado</p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold mb-3">Distribución de valoraciones</h3>
              {[5, 4, 3, 2, 1].map((stars) => (
                <div key={stars} className="flex items-center gap-3">
                  <button onClick={() => setFilter(stars as any)} className="flex items-center gap-1 min-w-[80px] hover:text-primary transition-colors">
                    <span className="text-sm font-medium">{stars}</span>
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  </button>
                  <Progress value={reviews.length > 0 ? (ratingCounts[stars as keyof typeof ratingCounts] / reviews.length) * 100 : 0} className="flex-1" />
                  <span className="text-sm text-muted-foreground min-w-[40px] text-right">{ratingCounts[stars as keyof typeof ratingCounts]}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Medias por criterio. Solo aparece cuando hay valoraciones con
            desglose: una lista de guiones no informa de nada. */}
        {criteriaAverages.length > 0 && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-3">Criterios de valoración</h3>
              <div className="divide-y">
                {criteriaAverages.map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                    <p className="min-w-0 flex-1 text-sm text-muted-foreground">{row.label}</p>
                    <div className="flex shrink-0 items-center gap-2">
                      <div className="flex items-center gap-0.5">{renderStars(Math.round(row.value))}</div>
                      <span className="w-8 text-right text-sm font-semibold tabular-nums">
                        {row.value.toFixed(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {reviews.length > 0 && (
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            <Badge variant={filter === "all" ? "default" : "outline"} className="cursor-pointer" onClick={() => setFilter("all")}>
              Todas ({reviews.length})
            </Badge>
            {[5, 4, 3, 2, 1].map((stars) => (
              <Badge key={stars} variant={filter === stars ? "default" : "outline"} className="cursor-pointer" onClick={() => setFilter(stars as any)}>
                {stars} <Star className="h-3 w-3 ml-1 fill-current" /> ({ratingCounts[stars as keyof typeof ratingCounts]})
              </Badge>
            ))}
          </div>
        )}

        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <Avatar className="h-12 w-12 flex-shrink-0">
                    <AvatarImage src={review.reviewer_avatar || undefined} />
                    <AvatarFallback>{review.reviewer_name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h4 className="font-semibold">{review.reviewer_name}</h4>
                        <p className="text-xs text-muted-foreground">{formatDate(review.created_at)}</p>
                      </div>
                      <Badge variant="secondary" className="flex-shrink-0">Trabajador</Badge>
                    </div>
                    <div className="flex items-center gap-1 mb-2">{renderStars(review.score)}</div>
                    {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {reviews.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Todavía no hay valoraciones</h3>
              <p className="text-muted-foreground">Esta empresa aún no ha recibido reseñas de candidatos contratados.</p>
            </CardContent>
          </Card>
        )}

        {reviews.length > 0 && filteredReviews.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay valoraciones con este filtro</h3>
              <p className="text-muted-foreground">Intenta con otro filtro para ver más valoraciones</p>
            </CardContent>
          </Card>
        )}
      </div>

      {eligibleJobId && (
        <RatingDialog
          open={showRatingDialog}
          onOpenChange={setShowRatingDialog}
          ratedUserId={businessId}
          ratedUserName={business.name}
          // Aquí el valorado es siempre un establecimiento: los siete criterios
          // describen a un trabajador y no aplican.
          ratedUserType="business"
          jobId={eligibleJobId}
          onSuccess={() => setAlreadyRated(true)}
        />
      )}
    </div>
  )
}
