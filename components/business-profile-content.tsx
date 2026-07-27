"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card" 
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { MapPin, Globe, Mail, Phone, Edit, Star, Briefcase, Users } from "lucide-react"
import type { Profile, BusinessProfile } from "@/lib/types"
import { createClient } from "@/lib/supabase/client"

interface BusinessProfileContentProps {
  user: any
  profile: Profile | null
  businessProfile: BusinessProfile | null
}

export function BusinessProfileContent({ user, profile, businessProfile }: BusinessProfileContentProps) {
  const supabase = createClient()
  const [stats, setStats] = useState({ totalJobs: 0, hiredCandidates: 0 })

  useEffect(() => {
    const loadStats = async () => {
      if (!user) return

      const { count: jobsCount } = await supabase
        .from("jobs")
        .select("id", { count: "exact", head: true })
        .eq("business_id", user.id)

      const jobIds = (await supabase.from("jobs").select("id").eq("business_id", user.id)).data?.map((j: any) => j.id) || []

      let hiredCount = 0
      if (jobIds.length > 0) {
        const { count } = await supabase
          .from("applications")
          .select("id", { count: "exact", head: true })
          .in("job_id", jobIds)
          .eq("status", "accepted")
        hiredCount = count || 0
      }

      setStats({
        totalJobs: jobsCount || 0,
        hiredCandidates: hiredCount,
      })
    }
    loadStats()
  }, [user, supabase])

  return (
    <div className="min-h-screen bg-background pb-20 md:pt-14">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <Avatar className="h-24 w-24 border-4 border-white">
              <AvatarImage src={businessProfile?.company_logo_url || "/placeholder.svg"} />
              <AvatarFallback className="text-2xl">
                {businessProfile?.company_name?.[0] || profile?.display_name?.[0] || "E"}
              </AvatarFallback>
            </Avatar>
            <div className="text-center md:text-left flex-1">
              <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                <h1 className="text-3xl font-bold">{businessProfile?.company_name || profile?.display_name}</h1>
                {businessProfile?.verified && (
                  <Badge variant="secondary" className="bg-[#01A89E] text-white">
                    Verificado
                  </Badge>
                )}
              </div>
              <p className="text-primary-foreground/90 mb-2">{profile?.location}</p>
              <Link
                href={`/business/${profile?.id}/ratings`}
                className="inline-flex items-center gap-4 hover:opacity-80 transition-opacity"
              >
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{profile?.rating || 0}</span>
                  <span className="text-sm">({profile?.total_ratings || 0} valoraciones)</span>
                </div>
              </Link>
            </div>
            <Button asChild variant="secondary">
              <Link href="/business-profile/edit">
                <Edit className="h-4 w-4 mr-2" />
                Editar Perfil
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* About */}
            <Card>
              <CardHeader>
                <CardTitle>Sobre la Empresa</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {businessProfile?.company_description || "No hay descripción disponible."}
                </p>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Estadísticas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Briefcase className="h-8 w-8 text-primary" />
                    <div>
                      <p className="text-2xl font-bold">{stats.totalJobs}</p>
                      <p className="text-sm text-muted-foreground">Ofertas Publicadas</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="h-8 w-8 text-[#01A89E]" />
                    <div>
                      <p className="text-2xl font-bold">{stats.hiredCandidates}</p>
                      <p className="text-sm text-muted-foreground">Candidatos Contratados</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle>Información de Contacto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {profile?.location && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Ubicación</p>
                      <p className="text-sm text-muted-foreground">{profile.location}</p>
                    </div>
                  </div>
                )}
                {businessProfile?.website && (
                  <div className="flex items-start gap-3">
                    <Globe className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Sitio Web</p>
                      <a
                        href={businessProfile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        {businessProfile.website}
                      </a>
                    </div>
                  </div>
                )}
                {user?.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                )}
                {profile?.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Teléfono</p>
                      <p className="text-sm text-muted-foreground">{profile.phone}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Acciones Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button asChild className="w-full bg-transparent" variant="outline">
                  <Link href="/jobs/create">Publicar Nueva Oferta</Link>
                </Button>
                <Button asChild className="w-full bg-transparent" variant="outline">
                  <Link href="/my-jobs">Ver Mis Ofertas</Link>
                </Button>
                <Button asChild className="w-full bg-transparent" variant="outline">
                  <Link href="/favorites">Ver Candidatos Guardados</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
