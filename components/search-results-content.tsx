"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { MapPin, Bookmark } from "lucide-react"
import type { Job } from "@/lib/types"

interface SearchResultsContentProps {
  jobs: (Job & { business: { display_name: string; avatar_url?: string } })[]
}

const ITEMS_PER_PAGE = 20

export function SearchResultsContent({ jobs }: SearchResultsContentProps) {
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE)

  const visibleJobs = jobs.slice(0, displayCount)
  const hasMore = displayCount < jobs.length

  const loadMore = () => {
    setDisplayCount((prev) => prev + ITEMS_PER_PAGE)
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pt-14">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Resultados de Búsqueda</h1>
          <p className="text-muted-foreground">
            {jobs.length} {jobs.length === 1 ? "oferta encontrada" : "ofertas encontradas"}
          </p>
        </div>

        <div className="space-y-4">
          {visibleJobs.map((job, index) => (
            <div key={job.id}>
              <Card className="hover:shadow-md transition-shadow">
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
                            </div>
                            {job.salary_display && (
                              <div className="flex items-center gap-1">
                                <span className="font-semibold text-foreground">{job.salary_display}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            <Badge variant="secondary">{job.category}</Badge>
                            <Badge variant="outline">{job.job_type}</Badge>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button asChild size="sm" className="bg-primary hover:bg-primary/90">
                            <Link href={`/jobs/${job.id}`}>Ver Oferta</Link>
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

              {(index + 1) % 5 === 0 && index + 1 < visibleJobs.length && (
                <div className="text-center py-4">
                  <div className="inline-block px-4 py-2 bg-muted rounded-full text-sm text-muted-foreground">
                    Mostrando {index + 1} de {visibleJobs.length} ofertas
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {hasMore && (
          <div className="text-center mt-8">
            <Button onClick={loadMore} size="lg" variant="outline" className="min-w-[200px] bg-transparent">
              CARGAR MÁS
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              Mostrando {visibleJobs.length} de {jobs.length} ofertas
            </p>
          </div>
        )}

        {!hasMore && jobs.length > ITEMS_PER_PAGE && (
          <div className="text-center mt-8">
            <p className="text-sm text-muted-foreground">Has visto todas las ofertas disponibles</p>
          </div>
        )}
      </div>
    </div>
  )
}
