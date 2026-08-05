"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import Image from "next/image"
import { useState, useEffect, useRef } from "react"
import {
  MapPin,
  Briefcase,
  Clock,
  Bookmark,
  Zap,
  ArrowRight,
  Crown,
  MessageCircle,
  Bell,
  Gift,
  CalendarCheck,
} from "lucide-react"
import { BottomNavigation } from "@/components/bottom-navigation"
import { SmartSearch } from "@/components/smart-search"
import { createClient } from "@/lib/supabase/client"
import { computeMatchScore, type MatchCandidateInput } from "@/lib/matching"
import { useUnreadMessages } from "@/hooks/use-unread-messages"
import { useInterviewStats } from "@/hooks/use-interview-stats"
import { cn } from "@/lib/utils"

type Job = {
  id: string
  title: string
  location: string
  city?: string | null
  category: string
  position?: string | null
  contract_type: string
  salary_min: number | null
  salary_max: number | null
  is_flash: boolean
  is_highlighted?: boolean | null
  flash_expires_at: string | null
  created_at: string
  matchPercent?: number
  business: {
    display_name: string
    avatar_url: string | null
  } | null
}

type Category = {
  id: string
  name: string
}

interface CandidateDashboardContentProps {
  userId: string
  userName: string
  userAvatar: string | null
  myCategory: string | null
  candidateMatchInput: MatchCandidateInput
  initialJobs: Job[]
  initialCategories: Category[]
  initialUnreadCount: number
}

export function CandidateDashboardContent({
  userId,
  userName,
  userAvatar,
  myCategory,
  candidateMatchInput,
  initialJobs,
  initialCategories,
  initialUnreadCount,
}: CandidateDashboardContentProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [jobs, setJobs] = useState<Job[]>(initialJobs)
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  // Se cuenta en vivo (realtime) partiendo del valor que ya trajo el servidor,
  // para que el badge reaccione al recibir y al leer sin recargar la página.
  const unreadCount = useUnreadMessages(userId, initialUnreadCount)
  const interviewStats = useInterviewStats(userId, "worker")
  const jobListRef = useRef<HTMLDivElement>(null)

  const userInitial = userName[0] || "U"

  // The initial render already has real data resolved server-side, so a
  // background refresh failing/hanging here never leaves the page stuck on
  // a spinner - it just means the numbers stay as they were until the next
  // successful refresh. Keeps flash offers (short countdown) and the unread
  // message count from going stale while the tab stays open.
  useEffect(() => {
    const supabase = createClient()

    const refresh = async () => {
      try {
        // El contador de mensajes ya no se pide aquí: lo lleva
        // useUnreadMessages por realtime, sin esperar al siguiente refresco.
        const [{ data: jobsData }, { data: catsData }] = await Promise.all([
          supabase
            .from("jobs")
            .select(`
              id, title, location, city, category, position, contract_type,
              salary_min, salary_max, is_flash, is_highlighted, flash_expires_at, created_at,
              business:profiles!jobs_business_id_fkey(display_name, avatar_url)
            `)
            .eq("is_active", true)
            .order("created_at", { ascending: false })
            .limit(50),
          supabase.from("categories").select("id, name").order("name"),
        ])
        if (jobsData) {
          setJobs(
            jobsData.map((job) => ({
              ...job,
              // Ver la nota en app/dashboard/page.tsx: PostgREST tipa la unión
              // uno-a-uno como array.
              business: Array.isArray(job.business) ? job.business[0] ?? null : job.business ?? null,
              matchPercent: computeMatchScore(candidateMatchInput, job).percent,
            }))
          )
        }
        if (catsData) setCategories(catsData)
      } catch {
        // Best-effort background refresh - keep showing the last good data
      }
    }

    const interval = setInterval(refresh, 30000)
    const onFocus = () => refresh()
    const onVisibility = () => { if (!document.hidden) refresh() }
    window.addEventListener("focus", onFocus)
    document.addEventListener("visibilitychange", onVisibility)

    return () => {
      clearInterval(interval)
      window.removeEventListener("focus", onFocus)
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [userId, candidateMatchInput])

  const filteredJobs = jobs
    .filter((job) => {
      const matchesSearch =
        !searchQuery ||
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.category?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === "all" || job.category === selectedCategory
      return matchesSearch && matchesCategory
    })
    // Flash first, then highlighted, then best profile match, then most recent.
    .sort((a, b) => {
      if (a.is_flash !== b.is_flash) return a.is_flash ? -1 : 1
      if (!!a.is_highlighted !== !!b.is_highlighted) return a.is_highlighted ? -1 : 1
      const matchDiff = (b.matchPercent || 0) - (a.matchPercent || 0)
      if (matchDiff !== 0) return matchDiff
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  const activeFlash = jobs.filter(
    (job) => job.is_flash && (!job.flash_expires_at || new Date(job.flash_expires_at) > new Date())
  )

  const jobCategories = [...new Set(jobs.map((j) => j.category).filter(Boolean))]

  return (
    <div className="min-h-screen bg-background pb-20 md:pt-14">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm pt-[env(safe-area-inset-top,0px)]">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/">
                <Image src="/logo-cpf.png" alt="CamareroPorFavor" width={36} height={36} className="object-contain rounded-full" />
              </Link>
              <div>
                <h2 className="text-sm font-semibold">Hola, {userName}</h2>
                <p className="text-xs text-muted-foreground">Encuentra tu proximo trabajo</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] bg-[#F48221]/10 text-[#F48221] border-[#F48221]/30">Beta</Badge>
              <Button asChild variant="ghost" size="icon">
                <Link href="/notifications">
                  <Bell className="h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="ghost" size="icon">
                <Link href="/rewards">
                  <Gift className="h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="ghost" size="icon" className="relative">
                <Link href="/subscribe">
                  <Crown className="h-5 w-5 text-[#F48221]" />
                </Link>
              </Button>
              <Avatar className="h-9 w-9">
                <AvatarImage src={userAvatar || undefined} alt={userName} />
                <AvatarFallback className="bg-[#01A89E] text-white text-sm">{userInitial}</AvatarFallback>
              </Avatar>
            </div>
          </div>
          {/* Smart Search with Mapbox cities + DB data */}
          <div className="mt-3">
            <SmartSearch
              onSearch={(q) => setSearchQuery(q)}
              placeholder="Buscar ofertas, categorias, ciudades..."
            />
          </div>
        </div>
      </header>

      <div className="px-4 py-4 space-y-6">
        {/* Flash Offers Section */}
        {activeFlash.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Zap className="h-5 w-5 text-[#F48221]" /> Ofertas Flash
              </h3>
              <Link href="/flash-offers" className="text-xs text-[#01A89E] font-medium flex items-center gap-1">
                Ver todas <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4" style={{ WebkitOverflowScrolling: "touch" }}>
              {activeFlash.slice(0, 5).map((flash) => (
                <Link key={flash.id} href={`/jobs/${flash.id}`} className="flex-shrink-0 w-64">
                  <Card className="border-[#F48221]/30 bg-[#F48221]/5 h-full">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-[#F48221] text-white text-[10px]">FLASH</Badge>
                        {flash.salary_min && (
                          <span className="text-[10px] text-muted-foreground">{flash.salary_min}EUR/dia</span>
                        )}
                      </div>
                      <h4 className="text-sm font-semibold line-clamp-2">{flash.title}</h4>
                      <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" /> {flash.location}
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" /> Urgente
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Category filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4" style={{ WebkitOverflowScrolling: "touch" }}>
          <button
            onClick={() => setSelectedCategory("all")}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${selectedCategory === "all" ? "bg-[#01A89E] text-white border-[#01A89E]" : "bg-white text-foreground border-border hover:border-[#01A89E]"}`}
          >
            Todas ({jobs.length})
          </button>
          {jobCategories.map((cat) => {
            const count = jobs.filter((j) => j.category === cat).length
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${selectedCategory === cat ? "bg-[#01A89E] text-white border-[#01A89E]" : "bg-white text-foreground border-border hover:border-[#01A89E]"}`}
              >
                {cat} ({count})
              </button>
            )
          })}
        </div>

        {/* Stats summary - every card is a CTA into the relevant section */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              setSelectedCategory(myCategory || "all")
              jobListRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
            }}
            className="text-left"
          >
            <Card className="bg-[#01A89E]/5 border-[#01A89E]/20 hover:border-[#01A89E]/50 transition-colors">
              <CardContent className="p-3 text-center">
                <p className="text-xl font-bold text-[#01A89E]">{jobs.length}</p>
                <p className="text-[10px] text-muted-foreground">Ofertas Activas</p>
              </CardContent>
            </Card>
          </button>

          <Link href="/flash-offers">
            <Card className="bg-[#F48221]/5 border-[#F48221]/20 hover:border-[#F48221]/50 transition-colors">
              <CardContent className="p-3 text-center">
                <p className="text-xl font-bold text-[#F48221]">{activeFlash.length}</p>
                <p className="text-[10px] text-muted-foreground">Ofertas Flash</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/interviews">
            <Card className="bg-violet-500/5 border-violet-500/20 hover:border-violet-500/50 transition-colors">
              <CardContent className="p-3 text-center">
                <p className="text-xl font-bold text-violet-600 flex items-center justify-center gap-1.5">
                  <CalendarCheck className="h-4 w-4" /> {interviewStats.completed}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Entrevistas{interviewStats.upcoming > 0 ? ` · ${interviewStats.upcoming} pend.` : ""}
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/messages">
            <Card
              className={cn(
                "relative transition-colors",
                unreadCount > 0
                  ? "bg-red-500/5 border-red-500/40 hover:border-red-500/60"
                  : "bg-blue-500/5 border-blue-500/20 hover:border-blue-500/50"
              )}
            >
              {unreadCount > 0 && (
                <span className="animate-slow-blink absolute -top-2 -right-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white shadow-md">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
              <CardContent className="p-3 text-center">
                <p
                  className={cn(
                    "text-xl font-bold flex items-center justify-center gap-1.5",
                    unreadCount > 0 ? "text-red-600" : "text-blue-600"
                  )}
                >
                  <MessageCircle className="h-4 w-4" /> {unreadCount}
                </p>
                <p className="text-[10px] text-muted-foreground">Mensajes</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Job List */}
        <section ref={jobListRef}>
          <h3 className="text-base font-bold mb-3">
            Ofertas de Trabajo ({filteredJobs.length})
          </h3>
          {filteredJobs.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Briefcase className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-medium text-foreground">No hay ofertas disponibles</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {searchQuery ? "Intenta con otros terminos de busqueda" : "Vuelve pronto para ver nuevas oportunidades"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredJobs.map((job) => (
                <Link key={job.id} href={`/jobs/${job.id}`}>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10 border flex-shrink-0">
                          <AvatarImage src={job.business?.avatar_url || ""} />
                          <AvatarFallback className="bg-[#01A89E]/10 text-[#01A89E] text-xs">
                            {job.business?.display_name?.[0] || "E"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold line-clamp-1">{job.title}</h4>
                          <p className="text-xs text-muted-foreground">{job.business?.display_name || "Empresa"}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {job.location}</span>
                            {job.salary_min && job.salary_max && (
                              <span className="font-semibold text-foreground">{job.salary_min}-{job.salary_max}EUR</span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {job.category && <Badge variant="secondary" className="text-[10px]">{job.category}</Badge>}
                            {job.contract_type && <Badge variant="outline" className="text-[10px]">{job.contract_type}</Badge>}
                            {job.is_flash && <Badge className="bg-[#F97316] text-white text-[10px]">FLASH</Badge>}
                            {job.is_highlighted && <Badge className="bg-[#F48221] text-white text-[10px]">Destacada</Badge>}
                            {typeof job.matchPercent === "number" && job.matchPercent > 0 && (
                              <Badge className="bg-[#01A89E]/10 text-[#01A89E] border-[#01A89E]/30 text-[10px]">
                                {job.matchPercent}% coincidencia
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="flex-shrink-0 h-8 w-8">
                          <Bookmark className="h-4 w-4" />
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

      <BottomNavigation profile={{ user_type: "worker" } as any} />
    </div>
  )
}
