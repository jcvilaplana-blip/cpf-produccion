"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Briefcase, MapPin, Zap, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface BusinessJobsContentProps {
  businessId: string
}

export function BusinessJobsContent({ businessId }: BusinessJobsContentProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [businessName, setBusinessName] = useState("Empresa")
  const [jobs, setJobs] = useState<any[]>([])
  const [filter, setFilter] = useState<"all" | "regular" | "flash">("all")

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = createClient()
        const [{ data: bp }, { data: jobsData }] = await Promise.all([
          supabase.from("business_profiles").select("company_name").eq("id", businessId).single(),
          supabase.from("jobs").select("*").eq("business_id", businessId).eq("is_active", true).order("created_at", { ascending: false }),
        ])
        if (bp?.company_name) setBusinessName(bp.company_name)
        setJobs(jobsData || [])
      } catch (e) {
        console.error("Error loading business jobs:", e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [businessId])

  const regularJobs = jobs.filter((j) => !j.is_flash)
  const flashJobs = jobs.filter((j) => j.is_flash)
  const visibleJobs = filter === "all" ? jobs : filter === "flash" ? flashJobs : regularJobs

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#01A89E]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24 md:pt-14">
      <header className="sticky top-0 z-40 w-full border-b bg-card shadow-sm pt-[env(safe-area-inset-top,0px)]">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold">Ofertas de {businessName}</h1>
              <p className="text-[13px] text-muted-foreground">{jobs.length} ofertas publicadas</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-5 max-w-3xl">
        <div className="flex gap-2 mb-5">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-full text-[13px] font-medium border transition-colors ${filter === "all" ? "bg-primary text-white border-primary" : "bg-white text-foreground border-border"}`}
          >
            Todas ({jobs.length})
          </button>
          <button
            onClick={() => setFilter("regular")}
            className={`px-3 py-1.5 rounded-full text-[13px] font-medium border transition-colors ${filter === "regular" ? "bg-primary text-white border-primary" : "bg-white text-foreground border-border"}`}
          >
            Ofertas ({regularJobs.length})
          </button>
          <button
            onClick={() => setFilter("flash")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[13px] font-medium border transition-colors ${filter === "flash" ? "bg-[#F97316] text-white border-[#F97316]" : "bg-white text-foreground border-border"}`}
          >
            <Zap className="h-3 w-3" /> Flash ({flashJobs.length})
          </button>
        </div>

        {visibleJobs.length === 0 ? (
          <div className="text-center py-16">
            <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              {filter === "flash" ? "No hay ofertas flash activas" : filter === "regular" ? "No hay ofertas activas" : "No hay ofertas activas en este momento"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleJobs.map((job) => (
              <Link key={job.id} href={job.is_flash ? `/flash-offers/${job.id}` : `/jobs/${job.id}`}>
                <Card className={`hover:shadow-md transition-shadow ${job.is_flash ? "border-[#F97316]/40" : ""}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-1.5 mb-1">
                      {job.is_flash && (
                        <Badge className="bg-[#F97316] text-white text-[12px] px-1.5 py-0 gap-0.5">
                          <Zap className="h-2.5 w-2.5" /> Flash
                        </Badge>
                      )}
                      <h3 className="font-semibold text-sm">{job.title}</h3>
                    </div>
                    <p className="text-[13px] text-muted-foreground mb-2 line-clamp-2">{job.description}</p>
                    <div className="flex items-center gap-3 flex-wrap text-[13px]">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-3 w-3" /> {job.city || job.location}
                      </span>
                      {job.salary_min && job.salary_max && (
                        <Badge variant="secondary" className="text-[13px]">{job.salary_min}-{job.salary_max} EUR</Badge>
                      )}
                      {job.contract_type && <Badge variant="outline" className="text-[13px]">{job.contract_type}</Badge>}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
