"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card" 
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, MapPin, Bookmark } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { BottomNavigation } from "@/components/bottom-navigation"
import type { JobCategory, JobType, Profile } from "@/lib/types"

const categoryLabels: Record<JobCategory, string> = {
  restaurant: "Restaurante",
  medical: "Médico",
  design: "Diseño",
  information_technology: "Tecnología",
  finance: "Finanzas",
  education: "Educación",
  project_management: "Gestión de Proyectos",
}

const jobTypeLabels: Record<JobType, string> = {
  full_time: "Tiempo Completo",
  part_time: "Medio Tiempo",
  remote: "Remoto",
  temporary: "Temporal",
}

interface SavedJobsContentProps {
  savedJobs: any[]
  profile: Profile | null
}

export function SavedJobsContent({ savedJobs, profile }: SavedJobsContentProps) {
  return (
    <div className="min-h-screen bg-background pb-24 md:pt-14">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 pt-[env(safe-area-inset-top,0px)]">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <Image src="/logo-cpf.png" alt="CamareroPorFavor" width={36} height={36} className="object-contain rounded-full" />
            <h1 className="text-xl font-bold">Trabajos Guardados</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="space-y-4">
          {savedJobs.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Bookmark className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No tienes trabajos guardados</h3>
                <p className="text-muted-foreground mb-4">Guarda trabajos interesantes para revisarlos más tarde</p>
                <Button asChild className="bg-primary hover:bg-primary/90">
                  <Link href="/dashboard">Explorar Trabajos</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            savedJobs.map((saved) => {
              const job = saved.job
              return (
                <Card key={saved.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12 border">
                        <AvatarImage src={job.business.avatar_url || "/placeholder.svg"} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {job.business.display_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold mb-1">{job.title}</h3>
                            <p className="text-sm text-muted-foreground mb-2">{job.business.display_name}</p>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-3">
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {job.location}
                              </div>
                              {job.salary_display && (
                                <div className="flex items-center gap-1">
                                  <span className="font-semibold text-foreground">{job.salary_display}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="secondary">{categoryLabels[job.category]}</Badge>
                              <Badge variant="outline">{jobTypeLabels[job.job_type]}</Badge>
                              <Badge variant="outline">{job.position}</Badge>
                            </div>
                          </div>
                          <Button asChild size="sm" className="bg-primary hover:bg-primary/90">
                            <Link href={`/jobs/${job.id}`}>Ver Detalles</Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </div>

      <BottomNavigation profile={profile} />
    </div>
  )
}
