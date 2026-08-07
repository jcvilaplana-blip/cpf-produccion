"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card" 
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import Image from "next/image"
import {
  Briefcase,
  MapPin,
  Clock,
  Euro,
  Plus,
  ArrowLeft,
  Eye,
  Users,
  MessageCircle,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Zap,
} from "lucide-react"
import type { Job } from "@/lib/types"
import { toggleJobActiveAction, deleteJobAction } from "@/lib/actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface ApplicationData {
  id: string
  worker_id: string
  status: string
  created_at: string
  worker?: {
    display_name: string
    avatar_url: string | null
    rating: number
  }
}

interface MyJobsContentProps {
  jobs: (Job & {
    applications_count?: number
    applications?: ApplicationData[]
  })[]
  profile?: any
}

const contractTypeLabels: Record<string, string> = {
  full_time: "Jornada Completa",
  part_time: "Media Jornada",
  flash_offer: "Oferta Flash",
  one_time_event: "Evento Puntual",
  temporary: "Temporal",
}

export function MyJobsContent({ jobs: initialJobs, profile }: MyJobsContentProps) {
  const router = useRouter()
  const [jobs, setJobs] = useState(initialJobs)
  const [showFlashOnly, setShowFlashOnly] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("filter") === "flash") setShowFlashOnly(true)
  }, [])

  const visibleJobs = showFlashOnly ? jobs.filter((j) => j.is_flash) : jobs

  const handleToggleActive = async (jobId: string, currentActive: boolean) => {
    const result = await toggleJobActiveAction(jobId, !currentActive)
    if (result.error) {
      toast.error(result.error)
    } else {
      setJobs(prev =>
        prev.map(j => j.id === jobId ? { ...j, is_active: !currentActive } : j)
      )
      toast.success(currentActive ? "Oferta desactivada" : "Oferta activada")
    }
  }

  const handleDelete = async (jobId: string) => {
    if (!confirm("Estas seguro de que quieres eliminar esta oferta? Esta accion no se puede deshacer.")) return

    const result = await deleteJobAction(jobId)
    if (result.error) {
      toast.error(result.error)
    } else {
      setJobs(prev => prev.filter(j => j.id !== jobId))
      toast.success("Oferta eliminada")
    }
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pt-14">
      <header className="sticky top-0 z-50 w-full bg-card/95 backdrop-blur border-b pt-[env(safe-area-inset-top,0px)]">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo-cpf.png" alt="CamareroPorFavor" width={40} height={40} className="object-contain rounded-full" />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold">Mis Ofertas</h1>
            <p className="text-[13px] text-muted-foreground">
              {jobs.filter(j => j.is_active).length} activas de {jobs.length} total
            </p>
          </div>
          <Button asChild size="sm" className="bg-primary hover:bg-primary/90">
            <Link href="/jobs/create">
              <Plus className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Nueva</span>
            </Link>
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-3xl">
        {jobs.length > 0 && (
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setShowFlashOnly(false)}
              className={`px-3 py-1.5 rounded-full text-[13px] font-medium border transition-colors ${!showFlashOnly ? "bg-primary text-white border-primary" : "bg-white text-foreground border-border"}`}
            >
              Todas ({jobs.length})
            </button>
            <button
              onClick={() => setShowFlashOnly(true)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[13px] font-medium border transition-colors ${showFlashOnly ? "bg-[#F97316] text-white border-[#F97316]" : "bg-white text-foreground border-border"}`}
            >
              <Zap className="h-3 w-3" /> Flash ({jobs.filter(j => j.is_flash).length})
            </button>
          </div>
        )}
        {jobs.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Briefcase className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No tienes ofertas publicadas</h3>
              <p className="text-muted-foreground mb-4">Crea tu primera oferta de trabajo</p>
              <Button asChild className="bg-primary hover:bg-primary/90">
                <Link href="/jobs/create">Crear Oferta</Link>
              </Button>
            </CardContent>
          </Card>
        ) : visibleJobs.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Zap className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No tienes ofertas flash</h3>
              <p className="text-muted-foreground mb-4">Crea una oferta urgente y de corta duración</p>
              <Button asChild className="bg-[#F97316] hover:bg-[#EA6A0E]">
                <Link href="/jobs/create?flash=true">Crear Oferta Flash</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {visibleJobs.map((job) => (
              <Card key={job.id} className={`overflow-hidden ${job.is_flash ? "border-[#F97316]/40" : ""}`}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        {job.is_flash && (
                          <Badge className="bg-[#F97316] text-white text-[12px] px-1.5 py-0 gap-0.5">
                            <Zap className="h-2.5 w-2.5" /> Flash
                          </Badge>
                        )}
                        <CardTitle className="text-base truncate">{job.title}</CardTitle>
                      </div>
                      <CardDescription className="flex items-center gap-1 text-[13px] mt-1">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{job.city || job.location}</span>
                      </CardDescription>
                    </div>
                    <Badge
                      variant={job.is_active ? "default" : "secondary"}
                      className={job.is_active ? "bg-green-600" : job.is_flash ? "bg-amber-500 text-white" : ""}
                    >
                      {job.is_active ? "Activa" : job.is_flash ? "Pago pendiente" : "Inactiva"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center p-2 bg-[#01A89E]/5 rounded-lg border border-[#01A89E]/10">
                      <Eye className="h-4 w-4 text-[#01A89E] mx-auto mb-1" />
                      <p className="text-lg font-bold">{job.views || 0}</p>
                      <p className="text-[13px] text-muted-foreground">Vistas</p>
                    </div>
                    <div className="text-center p-2 bg-green-500/5 rounded-lg border border-green-500/10">
                      <Users className="h-4 w-4 text-green-600 mx-auto mb-1" />
                      <p className="text-lg font-bold">{job.applications_count || 0}</p>
                      <p className="text-[13px] text-muted-foreground">Candidatos</p>
                    </div>
                    <div className="text-center p-2 bg-primary/5 rounded-lg border border-primary/10">
                      <MessageCircle className="h-4 w-4 text-primary mx-auto mb-1" />
                      <p className="text-lg font-bold">
                        {job.applications?.filter(a => a.status === "interview").length || 0}
                      </p>
                      <p className="text-[13px] text-muted-foreground">Entrevistas</p>
                    </div>
                  </div>

                  {/* Job details */}
                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4 flex-shrink-0" />
                      <span>{contractTypeLabels[job.contract_type] || job.work_schedule || "No especificado"}</span>
                    </div>
                    {(job.salary_min || job.salary_max) && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Euro className="h-4 w-4 flex-shrink-0" />
                        <span>
                          {job.salary_display || `${job.salary_min || "?"} - ${job.salary_max || "?"} EUR/mes`}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Recent applicants */}
                  {job.applications && job.applications.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[13px] font-medium text-muted-foreground">Candidatos recientes:</p>
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                          {job.applications.slice(0, 3).map((app) => (
                            <Avatar key={app.id} className="h-8 w-8 border-2 border-background">
                              <AvatarImage src={app.worker?.avatar_url || undefined} />
                              <AvatarFallback className="text-[13px] bg-primary/10 text-primary">
                                {app.worker?.display_name?.[0] || "U"}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                        </div>
                        {(job.applications_count || 0) > 3 && (
                          <span className="text-[13px] text-muted-foreground">
                            +{(job.applications_count || 0) - 3} mas
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t">
                    <Button asChild variant="outline" size="sm" className="flex-1 bg-transparent text-[13px]">
                      <Link href={`/jobs/${job.id}`}>Ver</Link>
                    </Button>
                    <Button asChild size="sm" className="flex-1 bg-primary hover:bg-primary/90 text-[13px]">
                      <Link href={`/jobs/${job.id}/edit`}>Editar</Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-transparent"
                      onClick={() => handleToggleActive(job.id, job.is_active)}
                    >
                      {job.is_active ? (
                        <ToggleRight className="h-4 w-4 text-green-600" />
                      ) : (
                        <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-transparent text-destructive hover:text-destructive"
                      onClick={() => handleDelete(job.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
