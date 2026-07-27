"use client"

import { useState } from "react"
import Link from "next/link" 
import { Zap, MapPin, Clock, Euro, Briefcase, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Job, User } from "@/lib/types"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

interface FlashJobsContentProps {
  jobs: Job[]
  currentUser: User | null
}

export function FlashJobsContent({ jobs: initialJobs, currentUser }: FlashJobsContentProps) {
  const [jobs, setJobs] = useState(initialJobs)
  const [displayCount, setDisplayCount] = useState(10)

  const displayedJobs = jobs.slice(0, displayCount)
  const hasMore = displayCount < jobs.length

  const loadMore = () => {
    setDisplayCount((prev) => Math.min(prev + 10, jobs.length))
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white pb-24 md:pt-14">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#01A89E] to-[#018F86] text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full">
              <Zap className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">Ofertas Flash</h1>
              <p className="text-white/90 mt-1">Trabajos urgentes con contratación inmediata</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4" />
            <span>{jobs.length} ofertas urgentes disponibles</span>
          </div>
        </div>
      </div>

      {/* Jobs Grid */}
      <div className="container mx-auto px-4 py-8">
        {displayedJobs.length === 0 ? (
          <div className="text-center py-12">
            <Zap className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No hay ofertas flash en este momento</h3>
            <p className="text-gray-500 mb-6">Vuelve pronto para ver nuevas oportunidades urgentes</p>
            <Button asChild>
              <Link href="/search">Ver Todas las Ofertas</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedJobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border-2 border-teal-200 hover:border-[#01A89E]"
                >
                  {/* Flash Badge */}
                  <div className="bg-gradient-to-r from-[#01A89E] to-[#018F86] text-white px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 animate-pulse" />
                      <span className="font-semibold text-sm">URGENTE</span>
                    </div>
                    <span className="text-xs">
                      {formatDistanceToNow(new Date(job.created_at), { addSuffix: true, locale: es })}
                    </span>
                  </div>

                  {/* Job Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-[#018F86] transition-colors">
                      {job.title}
                    </h3>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Briefcase className="h-4 w-4 text-[#01A89E]" />
                        <span className="text-sm">{job.category}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="h-4 w-4 text-[#01A89E]" />
                        <span className="text-sm">
                          {job.city}, {job.province}
                        </span>
                      </div>
                      {job.salary_min && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Euro className="h-4 w-4 text-[#01A89E]" />
                          <span className="text-sm font-semibold">
                            {job.salary_min}€ - {job.salary_max}€
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge variant="secondary">{job.work_schedule}</Badge>
                      <Badge variant="secondary">{job.contract_type}</Badge>
                    </div>

                    <p className="text-gray-600 text-sm line-clamp-2 mb-4">{job.description}</p>

                    <div className="flex items-center justify-between pt-4 border-t">
                      <span className="text-sm text-gray-500">Contratación inmediata</span>
                      <ChevronRight className="h-5 w-5 text-[#01A89E] group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="text-center mt-8">
                <Button
                  onClick={loadMore}
                  size="lg"
                  variant="outline"
                  className="border-[#01A89E] text-[#01A89E] hover:bg-teal-50 bg-transparent"
                >
                  CARGAR MÁS
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
