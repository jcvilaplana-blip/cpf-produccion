
"use client"

import { useState, useEffect } from "react" 
import { WorkerVideoCard } from "@/components/worker-video-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Trophy, Star, Award, Loader2 } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"

const ITEMS_PER_ROW = 4
const INITIAL_ROWS = 4
const LOAD_MORE_ROWS = 4
const INITIAL_COUNT = ITEMS_PER_ROW * INITIAL_ROWS
const LOAD_MORE_COUNT = ITEMS_PER_ROW * LOAD_MORE_ROWS

export default function RankingPage() {
  const router = useRouter()
  // Barrera de navegación por rol. Va en el cliente porque esta página es un
  // componente de cliente entero; para las de servidor se usa `blockRole`,
  // que es más sólido. Aquí sirve para no ofrecer lo que no corresponde, no
  // como control de acceso a los datos: eso es cosa de RLS en la base.
  const { user, isLoading: authLoading } = useAuth()
  useEffect(() => {
    if (!authLoading && user?.userType === "worker") router.replace("/dashboard")
  }, [authLoading, user, router])

  const [displayedCount, setDisplayedCount] = useState(INITIAL_COUNT)
  const [workers, setWorkers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRanking() {
      const supabase = createClient()
      const { data } = await supabase
        .from("profiles")
        // Columnas explícitas: `select("*")` incluye las personales, que el
        // rol anónimo ya no puede leer y harían fallar la consulta entera.
        .select("id, display_name, avatar_url, location, job_category, job_subcategory, category_id, subcategory_id, custom_subcategory, specialties, experience_years, rating, total_ratings, points, level, video_reel_url, mux_playback_id, is_premium, availability_status")
        .eq("user_type", "worker")
        .order("total_ratings", { ascending: false })

      setWorkers(data || [])
      setLoading(false)
    }
    fetchRanking()
  }, [])

  const rankedWorkers = workers.map((profile, index) => ({
    id: profile.id,
    name: profile.display_name || "Profesional",
    category: profile.specializations?.[0] || profile.job_category || "Camarero",
    location: profile.location ? profile.location.split(",")[0].trim() : "España",
    rating: profile.rating || 0,
    avatarUrl: profile.avatar_url || "/placeholder.svg",
    experience: `${profile.experience_years || 0} años de experiencia`,
    totalRatings: profile.total_ratings || 0,
    rank: index + 1,
  }))

  const topThree = rankedWorkers.slice(0, 3)
  const restOfRanking = rankedWorkers.slice(3)
  const visibleRanking = restOfRanking.slice(0, displayedCount)
  const hasMore = displayedCount < restOfRanking.length

  const loadMore = () => {
    setDisplayedCount((prev) => Math.min(prev + LOAD_MORE_COUNT, restOfRanking.length))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-background md:pt-14">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button asChild variant="ghost" className="mb-4">
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al inicio
            </Link>
          </Button>

          <div className="flex items-center gap-3 mb-2">
            <div className="bg-yellow-500 p-3 rounded-lg">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-balance">Ranking de Valoraciones</h1>
              <p className="text-muted-foreground mt-1">Los profesionales mejor valorados por las empresas</p>
            </div>
          </div>

          <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4 mt-4">
            <p className="text-sm text-yellow-900">
              <strong>Ranking basado en:</strong> Numero total de valoraciones recibidas. Cuantas mas valoraciones,
              mayor confianza de las empresas.
            </p>
          </div>
        </div>

        {rankedWorkers.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg">Todavia no hay profesionales con valoraciones</p>
          </div>
        ) : (
          <>
            {/* Top 3 Podium */}
            {topThree.length > 0 && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold mb-6 text-center">Top 3 Profesionales</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                  {topThree.map((worker, index) => (
                    <Card
                      key={worker.id}
                      className={`relative overflow-hidden ${
                        index === 0
                          ? "md:order-2 border-yellow-400 border-2 shadow-xl"
                          : index === 1
                            ? "md:order-1 border-gray-300 border-2"
                            : "md:order-3 border-teal-300 border-2"
                      }`}
                    >
                      <div
                        className={`absolute top-0 left-0 right-0 h-2 ${
                          index === 0 ? "bg-yellow-400" : index === 1 ? "bg-gray-300" : "bg-[#01A89E]"
                        }`}
                      />
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <Badge
                            variant="secondary"
                            className={`text-lg font-bold ${
                              index === 0
                                ? "bg-yellow-400 text-yellow-900"
                                : index === 1
                                  ? "bg-gray-300 text-gray-900"
                                  : "bg-[#01A89E] text-[#017A73]"
                            }`}
                          >
                            #{worker.rank}
                          </Badge>
                          <div className="flex items-center gap-1">
                            <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                            <span className="font-bold text-lg">{worker.rating}</span>
                          </div>
                        </div>

                        <WorkerVideoCard {...worker} />

                        <div className="mt-4 text-center">
                          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                            <Award className="w-4 h-4" />
                            <span className="font-semibold">{worker.totalRatings} valoraciones</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Rest of Ranking */}
            {restOfRanking.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Resto del Ranking</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {visibleRanking.map((worker) => (
                    <div key={worker.id} className="relative">
                      <Badge className="absolute top-2 left-2 z-10 bg-primary text-primary-foreground mb-2">
                        #{worker.rank}
                      </Badge>
                      <WorkerVideoCard {...worker} />
                      <div className="mt-2 text-center text-sm text-muted-foreground">
                        <Award className="w-4 h-4 inline mr-1" />
                        {worker.totalRatings} valoraciones
                      </div>
                    </div>
                  ))}
                </div>

                {hasMore && (
                  <div className="text-center mt-8">
                    <Button onClick={loadMore} size="lg" variant="outline" className="min-w-[200px] bg-background">
                      Cargar mas
                    </Button>
                    <p className="text-sm text-muted-foreground mt-2">
                      Mostrando {visibleRanking.length} de {restOfRanking.length} candidatos
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
