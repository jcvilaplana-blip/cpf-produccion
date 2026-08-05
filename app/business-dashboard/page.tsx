"use client"

import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import {
  Search, MapPin, Star, Users, Briefcase, Heart, Bell, MessageCircle, Loader2, Building2, Zap, ListChecks, Gift, CalendarCheck, Crown,
} from "lucide-react"
import { BottomNavigation } from "@/components/bottom-navigation"
import { createClient } from "@/lib/supabase/client"
import { checkInterviewRemindersAction } from "@/lib/actions"
import { computeBestMatchScore, type MatchJobInput } from "@/lib/matching"
import { useUnreadMessages } from "@/hooks/use-unread-messages"
import { getHighlightedProfileIds, sortHighlightedFirst } from "@/lib/highlighted-profiles"
import { useInterviewStats } from "@/hooks/use-interview-stats"
import { cn } from "@/lib/utils"

interface Candidate {
  id: string
  display_name: string
  avatar_url: string | null
  job_category: string | null
  location: string | null
  rating: number | null
  specialties: string[] | null
  experience_years: number | null
  contract_type_sought: string[] | null
  matchPercent?: number | null
}

export default function BusinessDashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [myJobsCount, setMyJobsCount] = useState(0)
  const [savedCount, setSavedCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const dataLoaded = useRef(false)
  const unreadCount = useUnreadMessages(user?.id)
  const interviewStats = useInterviewStats(user?.id, "business")

  const userName = user?.displayName || "Empresa"
  const userAvatar = user?.avatarUrl

  useEffect(() => {
    if (authLoading) return
    // Only bounce to login when we're SURE there's no session. `user` needs
    // the profile row to have loaded too, which can lag behind (or, rarely,
    // fail/time out) even for a genuinely authenticated visitor - treating
    // "profile not loaded yet" the same as "logged out" was sending real,
    // signed-in users back to the login page after a long spinner.
    if (!isAuthenticated) {
      router.push("/auth/login")
      return
    }
    if (!user) return
    if (user.userType === "worker") { router.push("/dashboard"); return }
    if (user.userType === "admin") { router.push("/admin"); return }
    if (user.userType !== "business") { router.push("/auth/login"); return }

    if (dataLoaded.current) return
    dataLoaded.current = true

    const loadData = async () => {
      const supabase = createClient()
      const [{ data: candidatesData }, { data: activeJobsData }, { count }, { count: saved }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, display_name, avatar_url, job_category, location, rating, specialties, experience_years, contract_type_sought")
          .eq("user_type", "worker")
          .order("rating", { ascending: false }),
        supabase
          .from("jobs")
          .select("city, location, contract_type, category, position")
          .eq("business_id", user.id)
          .eq("is_active", true),
        supabase
          .from("jobs")
          .select("id", { count: "exact", head: true })
          .eq("business_id", user.id),
        // Candidatos guardados con el corazón, para la tarjeta de Guardados.
        supabase
          .from("saved_profiles")
          .select("id", { count: "exact", head: true })
          .eq("business_id", user.id),
      ])

      if (candidatesData) {
        const activeJobs: MatchJobInput[] = (activeJobsData || []).map((j) => ({
          city: j.city,
          location: j.location,
          contractType: j.contract_type,
          category: j.category,
          position: j.position,
        }))

        // "Filtros del negocio" (2.1) = derivados de sus ofertas activas: si
        // el negocio tiene alguna oferta abierta, ordenamos a los candidatos
        // por su mejor coincidencia contra cualquiera de ellas; si no tiene
        // ninguna, se mantiene el orden actual por rating.
        const withMatch = candidatesData.map((c) => ({
          ...c,
          matchPercent:
            activeJobs.length > 0
              ? computeBestMatchScore(
                  {
                    location: c.location,
                    contractTypeSought: c.contract_type_sought,
                    jobCategory: c.job_category,
                    specialties: c.specialties,
                  },
                  activeJobs
                )?.percent ?? 0
              : null,
        }))

        if (activeJobs.length > 0) {
          withMatch.sort((a, b) => (b.matchPercent || 0) - (a.matchPercent || 0))
        }
        // Los perfiles con "Destacar" pagado van primero, conservando entre
        // ellos el orden por coincidencia/valoración.
        const highlighted = await getHighlightedProfileIds(supabase)
        setCandidates(sortHighlightedFirst(withMatch, highlighted))
      }

      setMyJobsCount(count || 0)
      setSavedCount(saved || 0)
      setLoading(false)
      checkInterviewRemindersAction().catch(() => {})
    }

    loadData()
  }, [authLoading, user, isAuthenticated, router])

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#01A89E]" />
      </div>
    )
  }

  if (!user || user.userType !== "business") return null

  const categories = [...new Set(candidates.map((c) => c.job_category).filter(Boolean))] as string[]
  const filteredCandidates = candidates.filter((c) => {
    const matchesSearch = !searchQuery ||
      (c.display_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.job_category || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.location || "").toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || c.job_category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="min-h-screen bg-background pb-20 md:pt-14">
      <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm pt-[env(safe-area-inset-top,0px)]">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/">
                <Image src="/logo-cpf.png" alt="CamareroPorFavor" width={36} height={36} className="object-contain rounded-full" />
              </Link>
              <div>
                <h2 className="text-sm font-semibold">Panel de Empresa</h2>
                <p className="text-xs text-muted-foreground">{userName}</p>
              </div>
            </div>
            {/* Solo notificaciones y perfil: recompensas y mensajes tienen su
                propia tarjeta más abajo y aquí solo competían por el espacio. */}
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="icon" className="h-11 w-11">
                <Link href="/notifications"><Bell className="h-6 w-6" /></Link>
              </Button>
              <Avatar className="h-9 w-9">
                <AvatarImage src={userAvatar} alt={userName} />
                <AvatarFallback className="bg-[#01A89E] text-white text-sm">{userName[0]}</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 py-4 space-y-3">
        {/* Línea 1: perfil · entrevistas · mensajes */}
        <div className="grid grid-cols-3 gap-3">
          <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2 rounded-xl border-[#F48221]/30 hover:bg-[#F48221]/5">
            <Link href="/business-profile/edit">
              <Building2 className="h-5 w-5 text-[#F48221]" />
              <span className="text-[10px] font-medium">Mi Perfil</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="relative h-auto py-4 flex-col gap-2 rounded-xl border-violet-500/30 hover:bg-violet-500/5">
            <Link href="/interviews">
              {interviewStats.upcoming > 0 && (
                <span className="absolute -top-2 -right-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-violet-600 px-1.5 text-[11px] font-bold text-white shadow-md">
                  {interviewStats.upcoming}
                </span>
              )}
              <CalendarCheck className="h-5 w-5 text-violet-600" />
              <span className="text-[10px] font-medium">Mis Entrevistas</span>
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className={cn(
              "relative h-auto py-4 flex-col gap-2 rounded-xl",
              unreadCount > 0 && "border-red-500/40 bg-red-500/5"
            )}
          >
            <Link href="/messages">
              {unreadCount > 0 && (
                <span className="animate-slow-blink absolute -top-2 -right-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white shadow-md">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
              <MessageCircle className={cn("h-5 w-5", unreadCount > 0 && "text-red-500")} />
              <span className="text-[10px] font-medium">Mensajes</span>
            </Link>
          </Button>
        </div>

        {/* Línea 2: ofertas flash */}
        <div className="grid grid-cols-2 gap-3">
          <Button asChild className="h-auto py-4 flex-col gap-2 bg-[#F97316] hover:bg-[#EA6A0E] text-white rounded-xl">
            <Link href="/jobs/create?flash=true">
              <Zap className="h-5 w-5" />
              <span className="text-[10px] font-medium">Crear Oferta Flash</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2 rounded-xl border-[#F97316]/30 hover:bg-[#F97316]/5">
            <Link href="/my-jobs?filter=flash">
              <ListChecks className="h-5 w-5 text-[#F97316]" />
              <span className="text-[10px] font-medium">Gestionar Ofertas Flash</span>
            </Link>
          </Button>
        </div>

        {/* Línea 3: suscripción y gamificación */}
        <div className="grid grid-cols-2 gap-3">
          <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2 rounded-xl border-[#F5A623]/30 hover:bg-[#F5A623]/5">
            <Link href="/subscribe">
              <Crown className="h-5 w-5 text-[#F5A623]" />
              <span className="text-[10px] font-medium">Suscripción</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2 rounded-xl border-violet-500/30 hover:bg-violet-500/5">
            <Link href="/rewards">
              <Gift className="h-5 w-5 text-violet-600" />
              <span className="text-[10px] font-medium">Recompensas Gamificación</span>
            </Link>
          </Button>
        </div>

        {/* Línea 4: mis ofertas y candidatos guardados */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/my-jobs">
            <Card className="bg-[#01A89E]/5 border-[#01A89E]/20 hover:border-[#01A89E]/50 transition-colors h-full">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="bg-[#01A89E]/10 p-2.5 rounded-xl">
                  <Briefcase className="h-6 w-6 text-[#01A89E]" />
                </div>
                <div>
                  <p className="text-xl font-bold">{myJobsCount}</p>
                  <p className="text-[10px] text-muted-foreground">Mis Ofertas</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/favorites">
            <Card className="bg-rose-500/5 border-rose-500/20 hover:border-rose-500/50 transition-colors h-full">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="bg-rose-500/10 p-2.5 rounded-xl">
                  <Heart className="h-6 w-6 text-rose-500" />
                </div>
                <div>
                  <p className="text-xl font-bold">{savedCount}</p>
                  <p className="text-[10px] text-muted-foreground">Candidatos Guardados</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Línea 5: histórico de entrevistas y contrataciones */}
        <Link href="/interviews" className="block">
          <Card className="bg-violet-500/5 border-violet-500/20 hover:border-violet-500/50 transition-colors">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="bg-violet-500/10 p-2.5 rounded-xl">
                <CalendarCheck className="h-6 w-6 text-violet-600" />
              </div>
              <div className="flex-1">
                <p className="text-xl font-bold">{interviewStats.completed}</p>
                <p className="text-[10px] text-muted-foreground">
                  Entrevistas Realizadas, Contrataciones
                  {interviewStats.hired > 0 ? ` · ${interviewStats.hired} contratados` : ""}
                </p>
              </div>
              {interviewStats.upcoming > 0 && (
                <Badge className="bg-violet-600 text-white border-0 text-[10px]">
                  {interviewStats.upcoming} pendiente{interviewStats.upcoming === 1 ? "" : "s"}
                </Badge>
              )}
            </CardContent>
          </Card>
        </Link>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder="Buscar candidatos..." className="pl-10 h-10 rounded-xl" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
          <button onClick={() => setSelectedCategory("all")} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${selectedCategory === "all" ? "bg-[#01A89E] text-white border-[#01A89E]" : "bg-white text-foreground border-border"}`}>
            Todos ({candidates.length})
          </button>
          {categories.map((cat) => (
            <button key={cat} onClick={() => setSelectedCategory(cat)} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${selectedCategory === cat ? "bg-[#01A89E] text-white border-[#01A89E]" : "bg-white text-foreground border-border"}`}>
              {cat} ({candidates.filter((c) => c.job_category === cat).length})
            </button>
          ))}
        </div>

        <section>
          <h3 className="text-base font-bold mb-3">Candidatos ({filteredCandidates.length})</h3>
          {filteredCandidates.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No hay candidatos disponibles</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCandidates.map((candidate) => (
                <Link key={candidate.id} href={`/profile/${candidate.id}`}>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        <div className="relative flex-shrink-0">
                          <Avatar className="h-12 w-12 border-2 border-[#01A89E]/20">
                            <AvatarImage src={candidate.avatar_url || undefined} alt={candidate.display_name || ""} />
                            <AvatarFallback className="bg-[#01A89E]/10 text-[#01A89E]">{(candidate.display_name || "C")[0]}</AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold truncate">{candidate.display_name}</h4>
                            {candidate.rating && candidate.rating > 0 && (
                              <div className="flex items-center gap-0.5 flex-shrink-0">
                                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                                <span className="text-xs font-medium">{candidate.rating}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            {candidate.job_category && <p className="text-xs text-[#01A89E] font-medium">{candidate.job_category}</p>}
                            {typeof candidate.matchPercent === "number" && candidate.matchPercent > 0 && (
                              <Badge className="bg-[#01A89E]/10 text-[#01A89E] border-[#01A89E]/30 text-[9px] px-1.5 py-0">
                                {candidate.matchPercent}% coincide con tus ofertas
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            {candidate.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{candidate.location}</span>}
                            {candidate.experience_years && <span>{candidate.experience_years} años exp.</span>}
                          </div>
                          {candidate.specialties && candidate.specialties.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {candidate.specialties.slice(0, 3).map((s: string) => (
                                <Badge key={s} variant="secondary" className="text-[9px] px-1.5 py-0">{s}</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <Button variant="ghost" size="icon" className="flex-shrink-0 h-8 w-8">
                          <Heart className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      <BottomNavigation profile={{ user_type: "business" } as any} />
    </div>
  )
}
