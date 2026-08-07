"use client"

import { useRouter } from "next/navigation"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card" 
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  ArrowLeft,
  Star,
  MapPin,
  Phone,
  MessageCircle,
  Check,
  X,
  Calendar,
  FileText,
  Users,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import type { Job, Profile } from "@/lib/types"
import { updateApplicationStatusAction } from "@/lib/actions"
import { toast } from "sonner"

interface ApplicationWithWorker {
  id: string
  job_id: string
  worker_id: string
  status: string
  cover_letter?: string
  cv_url?: string
  created_at: string
  worker: {
    id: string
    display_name: string
    avatar_url: string | null
    rating: number
    total_ratings: number
    location: string | null
    phone: string | null
    bio: string | null
    specialties: string[] | null
    job_category: string | null
  } | null
}

interface JobApplicationsContentProps {
  job: Job
  applications: ApplicationWithWorker[]
  profile: Profile | null
}

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  accepted: "Aceptado",
  rejected: "Rechazado",
  interview: "Entrevista",
  withdrawn: "Cancelada",
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
  accepted: "bg-green-500/10 text-green-700 border-green-500/20",
  rejected: "bg-red-500/10 text-red-700 border-red-500/20",
  interview: "bg-[#01A89E]/10 text-[#018F86] border-[#01A89E]/20",
  withdrawn: "bg-orange-500/10 text-orange-700 border-orange-500/20",
}

export function JobApplicationsContent({
  job,
  applications: initialApps,
  profile,
}: JobApplicationsContentProps) {
  const router = useRouter()
  const [applications, setApplications] = useState(initialApps)
  const [filter, setFilter] = useState<string>("all")

  const handleStatusChange = async (appId: string, newStatus: string) => {
    const result = await updateApplicationStatusAction(appId, newStatus)
    if (result.error) {
      toast.error(result.error)
    } else {
      setApplications(prev =>
        prev.map(a => a.id === appId ? { ...a, status: newStatus } : a)
      )
      toast.success(`Estado cambiado a "${statusLabels[newStatus]}"`)
    }
  }

  const filteredApps = filter === "all"
    ? applications
    : applications.filter(a => a.status === filter)

  const counts = {
    all: applications.length,
    pending: applications.filter(a => a.status === "pending").length,
    accepted: applications.filter(a => a.status === "accepted").length,
    interview: applications.filter(a => a.status === "interview").length,
    rejected: applications.filter(a => a.status === "rejected").length,
    withdrawn: applications.filter(a => a.status === "withdrawn").length,
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pt-14">
      <header className="sticky top-0 z-50 w-full bg-card/95 backdrop-blur border-b pt-[env(safe-area-inset-top,0px)]">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          <Image src="/logo-cpf.png" alt="CamareroPorFavor" width={36} height={36} className="object-contain rounded-full" />
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold truncate">Candidatos</h1>
            <p className="text-[13px] text-muted-foreground truncate">{job.title}</p>
          </div>
          <Badge variant="outline">{applications.length} total</Badge>
        </div>
      </header>

      <div className="container mx-auto px-4 py-4 max-w-3xl">
        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
          {(["all", "pending", "interview", "accepted", "rejected", "withdrawn"] as const).map(status => (
            <Button
              key={status}
              variant={filter === status ? "default" : "outline"}
              size="sm"
              className={`flex-shrink-0 ${filter === status ? "bg-primary" : "bg-transparent"}`}
              onClick={() => setFilter(status)}
            >
              {status === "all" ? "Todos" : statusLabels[status]}
              <Badge variant="secondary" className="ml-1.5 h-5 min-w-5 text-[13px]">
                {counts[status]}
              </Badge>
            </Button>
          ))}
        </div>

        {/* Applications List */}
        {filteredApps.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {filter === "all" ? "No hay candidatos" : `No hay candidatos con estado "${statusLabels[filter]}"`}
              </h3>
              <p className="text-sm text-muted-foreground">
                Los candidatos apareceran aqui cuando apliquen a esta oferta.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredApps.map(app => (
              <Card key={app.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12 flex-shrink-0">
                      <AvatarImage src={app.worker?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {app.worker?.display_name?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-sm">
                            {app.worker?.display_name || "Usuario"}
                          </h3>
                          {app.worker?.job_category && (
                            <p className="text-[13px] text-muted-foreground">{app.worker.job_category}</p>
                          )}
                        </div>
                        <Badge className={`text-[13px] flex-shrink-0 ${statusColors[app.status] || ""}`}>
                          {statusLabels[app.status] || app.status}
                        </Badge>
                      </div>

                      {/* Worker info */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[13px] text-muted-foreground">
                        {app.worker?.rating && app.worker.rating > 0 && (
                          <div className="flex items-center gap-0.5">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span>{app.worker.rating}</span>
                          </div>
                        )}
                        {app.worker?.location && (
                          <div className="flex items-center gap-0.5">
                            <MapPin className="h-3 w-3" />
                            <span>{app.worker.location}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-0.5">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(app.created_at).toLocaleDateString("es-ES")}</span>
                        </div>
                      </div>

                      {/* Cover letter */}
                      {app.cover_letter && (
                        <div className="mt-2 p-2 bg-muted rounded-md">
                          <div className="flex items-center gap-1 text-[13px] font-medium mb-1">
                            <FileText className="h-3 w-3" />
                            Carta de presentacion
                          </div>
                          <p className="text-[13px] text-muted-foreground line-clamp-2">
                            {app.cover_letter}
                          </p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2 mt-3">
                        <Button asChild variant="outline" size="sm" className="h-8 text-[13px] bg-transparent">
                          <Link href={`/profile/${app.worker_id}`}>Ver Perfil</Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-[13px] bg-transparent"
                          asChild
                        >
                          <Link href={`/messages?candidateId=${app.worker_id}`}>
                            <MessageCircle className="h-3 w-3 mr-1" />
                            Mensaje
                          </Link>
                        </Button>
                        {app.worker?.phone && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-[13px] bg-transparent"
                            asChild
                          >
                            <a href={`tel:${app.worker.phone}`}>
                              <Phone className="h-3 w-3 mr-1" />
                              Llamar
                            </a>
                          </Button>
                        )}
                      </div>

                      {/* Status change buttons */}
                      {app.status === "pending" && (
                        <div className="flex gap-2 mt-3 pt-3 border-t">
                          <Button
                            size="sm"
                            className="h-8 text-[13px] bg-[#01A89E] hover:bg-[#018F86]"
                            onClick={() => handleStatusChange(app.id, "interview")}
                          >
                            <Calendar className="h-3 w-3 mr-1" />
                            Citar Entrevista
                          </Button>
                          <Button
                            size="sm"
                            className="h-8 text-[13px] bg-green-600 hover:bg-green-700"
                            onClick={() => handleStatusChange(app.id, "accepted")}
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Aceptar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-[13px] bg-transparent text-destructive hover:text-destructive"
                            onClick={() => handleStatusChange(app.id, "rejected")}
                          >
                            <X className="h-3 w-3 mr-1" />
                            Rechazar
                          </Button>
                        </div>
                      )}
                      {app.status === "interview" && (
                        <div className="flex gap-2 mt-3 pt-3 border-t">
                          <Button
                            size="sm"
                            className="h-8 text-[13px] bg-green-600 hover:bg-green-700"
                            onClick={() => handleStatusChange(app.id, "accepted")}
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Aceptar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-[13px] bg-transparent text-destructive hover:text-destructive"
                            onClick={() => handleStatusChange(app.id, "rejected")}
                          >
                            <X className="h-3 w-3 mr-1" />
                            Rechazar
                          </Button>
                        </div>
                      )}
                    </div>
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
