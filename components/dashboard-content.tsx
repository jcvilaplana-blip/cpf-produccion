"use client"

import { useState, useEffect } from "react" 
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import {
  Search,
  MapPin,
  Briefcase,
  Clock,
  Bookmark,
  LogOut,
  Settings,
  Plus,
  Crown,
  Video,
  Calendar,
} from "lucide-react"
import type { Profile, Job } from "@/lib/types"
import { JobFiltersComponent } from "@/components/job-filters"
import type { JobFilters } from "@/lib/filters"
import { calculateDistance, formatDistance, geocodeAddress } from "@/lib/geolocation"
import { BottomNavigation } from "@/components/bottom-navigation"
import { useAuth } from "@/hooks/use-auth"

interface DashboardContentProps {
  user: any
  profile: Profile | null
  jobs: (Job & { business: { display_name: string; avatar_url?: string } })[]
}

const categoryLabels: Record<string, string> = {
  camarero: "Camarero/a",
  coctelero: "Coctelero/a",
  sommelier: "Sommelier",
  maitre: "Maitre",
  chef: "Chef",
  cocinero: "Cocinero/a",
  cortador_jamon: "Cortador de Jamon",
  office: "Office",
  recepcionista: "Recepcionista",
  platero: "Platero",
  repartidor: "Repartidor",
  restaurant: "Restaurante",
}

const contractTypeLabels: Record<string, string> = {
  full_time: "Jornada Completa",
  part_time: "Media Jornada",
  flash_offer: "Oferta Flash",
  one_time_event: "Evento Puntual",
  temporary: "Temporal",
}

export function DashboardContent({ user, profile, jobs }: DashboardContentProps) {
  const { logout } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<JobCategory | "all">("all")
  const [filters, setFilters] = useState<JobFilters>({
    sortBy: "recent",
  })
  const [jobsWithDistance, setJobsWithDistance] =
    useState<
      (Job & {
        business: { display_name: string; avatar_url?: string }
        distance?: number
      })[]
    >(jobs)

  const router = useRouter()

  useEffect(() => {
    const calculateDistances = async () => {
      if (!filters.userLocation) {
        setJobsWithDistance(jobs)
        return
      }

      const jobsWithDist = await Promise.all(
        jobs.map(async (job) => {
          try {
            const jobCoords = await geocodeAddress(job.location)
            if (jobCoords) {
              const distance = calculateDistance(filters.userLocation!, jobCoords)
              return { ...job, distance }
            }
          } catch (error) {
            console.error("Error calculando distancia:", error)
          }
          return job
        }),
      )
      setJobsWithDistance(jobsWithDist)
    }

    calculateDistances()
  }, [filters.userLocation, jobs])

  const handleLogout = logout

  const filteredJobs = jobsWithDistance
    .filter((job) => {
      const matchesSearch =
        !filters.search ||
        job.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        job.location.toLowerCase().includes(filters.search.toLowerCase()) ||
        job.business.display_name.toLowerCase().includes(filters.search.toLowerCase()) ||
        job.description?.toLowerCase().includes(filters.search.toLowerCase())

      const matchesCategory =
        !filters.category || filters.category === "Todos" || categoryLabels[job.category] === filters.category

      const matchesJobType =
        !filters.jobType || filters.jobType === "Todos" || contractTypeLabels[job.contract_type || ""] === filters.jobType

      const matchesSalary =
        (!filters.salaryMin || (job.salary_min && job.salary_min >= filters.salaryMin)) &&
        (!filters.salaryMax || (job.salary_max && job.salary_max <= filters.salaryMax))

      const matchesLocation = !filters.location || job.location.toLowerCase().includes(filters.location.toLowerCase())

      const matchesDistance = !filters.distance || !job.distance || job.distance <= filters.distance

      return matchesSearch && matchesCategory && matchesJobType && matchesSalary && matchesLocation && matchesDistance
    })
    .sort((a, b) => {
      if (filters.sortBy === "salary") {
        return (b.salary_max || 0) - (a.salary_max || 0)
      } else if (filters.sortBy === "distance" && a.distance && b.distance) {
        return a.distance - b.distance
      } else {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

  const jobCounts = {
    all: jobs.length,
    flash: jobs.filter((j) => j.is_flash).length,
    full_time: jobs.filter((j) => j.contract_type === "full_time").length,
    part_time: jobs.filter((j) => j.contract_type === "part_time").length,
    temporary: jobs.filter((j) => j.contract_type === "flash_offer" || j.contract_type === "one_time_event").length,
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-6 md:pt-14">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm pt-[env(safe-area-inset-top,0px)]">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Image src="/logo-cpf.png" alt="CamareroPorFavor" width={40} height={40} className="object-contain rounded-full" />
              </Link>
              <div className="hidden md:block">
                <h2 className="text-lg font-semibold">Hola, {profile?.display_name || user.email?.split("@")[0]}</h2>
                <p className="text-sm text-muted-foreground">Encuentra tu próximo trabajo</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {profile?.user_type === "business" && (
                <Button asChild variant="outline" size="sm" className="hidden md:flex bg-transparent">
                  <Link href="/reels">
                    <Video className="h-4 w-4 mr-2" />
                    Ver Reels
                  </Link>
                </Button>
              )}
              <Button
                asChild
                variant="outline"
                size="sm"
                className="hidden md:flex border-primary text-primary hover:bg-primary/10 bg-transparent"
              >
                <Link href="/subscribe">
                  <Crown className="h-4 w-4 mr-2" />
                  Premium
                </Link>
              </Button>
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar trabajos..."
                  className="pl-10 w-64"
                  value={filters.search || ""}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={profile?.avatar_url || "/placeholder.svg?height=40&width=40&query=user+avatar"}
                        alt={profile?.display_name}
                      />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {profile?.display_name?.[0] || user.email?.[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-white" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{profile?.display_name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {profile?.user_type === "business" && (
                    <DropdownMenuItem asChild>
                      <Link href="/reels" className="cursor-pointer">
                        <Video className="mr-2 h-4 w-4" />
                        <span>Ver Reels de Trabajadores</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link href="/subscribe" className="cursor-pointer">
                      <Crown className="mr-2 h-4 w-4 text-primary" />
                      <span>Suscripción Premium</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Perfil</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Configuración</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar Sesión</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          {/* Mobile Search */}
          <div className="mt-4 md:hidden">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar trabajos..."
                className="pl-10"
                value={filters.search || ""}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-foreground">{jobCounts.all}</p>
                  <p className="text-sm text-muted-foreground">Total Ofertas</p>
                </div>
                <Briefcase className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-[#01A89E]/10 to-[#01A89E]/5 border-[#01A89E]/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-foreground">{jobCounts.full_time}</p>
                  <p className="text-sm text-muted-foreground">Jornada Completa</p>
                </div>
                <Clock className="h-8 w-8 text-[#01A89E]" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-foreground">{jobCounts.part_time}</p>
                  <p className="text-sm text-muted-foreground">Media Jornada</p>
                </div>
                <Clock className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-[#01A89E]/10 to-[#01A89E]/5 border-[#01A89E]/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-foreground">{jobCounts.temporary}</p>
                  <p className="text-sm text-muted-foreground">Flash / Eventos</p>
                </div>
                <Briefcase className="h-8 w-8 text-[#01A89E]" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-6">
          <JobFiltersComponent filters={filters} onFiltersChange={setFilters} jobCount={filteredJobs.length} />
          {profile?.user_type === "business" && (
            <Button asChild size="sm" className="ml-auto bg-primary hover:bg-primary/90">
              <Link href="/jobs/create">
                <Plus className="h-4 w-4 mr-2" />
                Publicar Trabajo
              </Link>
            </Button>
          )}
        </div>

        {/* Job List */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">
            Lista de Trabajos ({filteredJobs.length} {filteredJobs.length === 1 ? "resultado" : "resultados"})
          </h3>
          {filteredJobs.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No se encontraron trabajos</h3>
                <p className="text-muted-foreground">Intenta ajustar tus filtros de búsqueda</p>
              </CardContent>
            </Card>
          ) : (
            filteredJobs.map((job) => (
              <Card key={job.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 border">
                      <AvatarImage src={job.business.avatar_url || "/placeholder.svg"} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {job.business.display_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h3 className="text-base font-semibold mb-0.5">{job.title}</h3>
                          <p className="text-sm text-muted-foreground mb-1.5">{job.business.display_name}</p>
                          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-2">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {job.location}
                              {job.distance && (
                                <span className="text-primary font-medium">({formatDistance(job.distance)})</span>
                              )}
                            </div>
                            {job.salary_display && (
                              <div className="flex items-center gap-1">
                                <span className="font-semibold text-foreground">{job.salary_display}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            <Badge variant="secondary">{categoryLabels[job.category]}</Badge>
                            <Badge variant="outline">{contractTypeLabels[job.contract_type || ""]}</Badge>
                            <Badge variant="outline">{job.position}</Badge>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button asChild size="sm" className="bg-primary hover:bg-primary/90">
                            <Link href={`/jobs/${job.id}`}>Seleccionar</Link>
                          </Button>
                          <Button variant="outline" size="sm">
                            <Bookmark className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Bottom Navigation (Mobile) */}
      <BottomNavigation profile={profile} />
    </div>
  )
}
