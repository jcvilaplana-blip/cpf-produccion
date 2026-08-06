"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowLeft, Heart, MapPin, Search } from "lucide-react"
import { WorkerVideoCard } from "@/components/worker-video-card"
import type { UserType } from "@/lib/types"

interface FavoritesContentProps {
  savedItems: any[]
  userType: UserType
}

export function FavoritesContent({ savedItems, userType }: FavoritesContentProps) {
  const router = useRouter()
  const isBusiness = userType === "business"

  return (
    <div className="min-h-screen bg-background pb-20 md:pt-14">
      {/* Cabecera con flecha de volver, como el resto de páginas. El título
          pasa de text-3xl a la medida que usan las demás cabeceras. */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur pt-[env(safe-area-inset-top,0px)]">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Volver">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-[17px] font-bold">
            {isBusiness ? "Candidatos Guardados" : "Favoritos"}
          </h1>
        </div>
      </header>

      <div className="container mx-auto px-4 pt-5 pb-8">
        <p className="mb-5 text-[14px] text-muted-foreground">
          {isBusiness ? "Candidatos que te interesan" : "Ofertas guardadas"}
        </p>

        {isBusiness && (
          <Card className="mb-6 bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <Search className="h-6 w-6 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-[15px]">Buscar Nuevos Candidatos</h3>
                    <p className="text-[13px] text-muted-foreground">Encuentra más profesionales para tu equipo</p>
                  </div>
                </div>
                <Button asChild className="bg-primary hover:bg-primary/90 shrink-0">
                  <Link href="/search">Buscar</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {savedItems.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Heart className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No tienes favoritos guardados</h3>
              <p className="text-muted-foreground mb-4 text-center">
                {isBusiness
                  ? "Guarda candidatos que te interesen para contactarlos más tarde"
                  : "Guarda ofertas de trabajo que te interesen"}
              </p>
              <Link href="/search">
                <Button className="bg-[#01A89E] hover:bg-[#018F86]">
                  {isBusiness ? "Buscar Candidatos" : "Buscar Ofertas"}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : isBusiness ? (
          /* La misma tarjeta que en los listados de candidatos, para que
             guardados y búsqueda se vean igual. La tarjeta ya es pulsable
             entera; el botón de debajo deja explícito a dónde lleva. */
          <div className="grid grid-cols-2 gap-3">
            {savedItems.map((item) => {
              const c = item.profile
              if (!c) return null
              return (
                <div key={item.id} className="space-y-2">
                  <WorkerVideoCard
                    id={c.id}
                    name={c.display_name || "Candidato"}
                    category={c.job_category || "General"}
                    location={(c.location || "").split(",")[0].trim() || "España"}
                    rating={Number(c.rating) || 0}
                    avatarUrl={c.avatar_url}
                    experience={c.experience_years ? `${c.experience_years} años de experiencia` : ""}
                  />
                  <Button
                    asChild
                    variant="outline"
                    className="h-10 w-full rounded-xl text-[13px] font-semibold"
                  >
                    <Link href={`/profile/${c.id}`}>Ver Perfil</Link>
                  </Button>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {savedItems.map((item) => {
              if (item.business) {
                const business = item.business
                return (
                  <Card key={item.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-base">{business.company_name || "Empresa"}</CardTitle>
                        <Heart className="h-5 w-5 fill-[#01A89E] text-[#01A89E]" />
                      </div>
                      <CardDescription className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {business.city || business.address}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0 p-4">
                      <div className="space-y-1.5">
                        <Badge>{business.business_type}</Badge>
                        <p className="text-sm text-muted-foreground line-clamp-2">{business.company_description}</p>
                        <Link href={`/business/${business.id}`}>
                          <Button className="w-full bg-[#01A89E] hover:bg-[#018F86]">Ver Empresa</Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                )
              }

              const job = item.job
              if (!job) return null
              return (
                <Card key={item.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-base">{job.title}</CardTitle>
                      <Heart className="h-5 w-5 fill-[#01A89E] text-[#01A89E]" />
                    </div>
                    <CardDescription className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {job.location || job.city}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 p-4">
                    <div className="space-y-1.5">
                      <Badge>{job.category}</Badge>
                      <p className="text-sm text-muted-foreground line-clamp-2">{job.description}</p>
                      <Link href={`/jobs/${job.id}`}>
                        <Button className="w-full bg-[#01A89E] hover:bg-[#018F86]">Ver Oferta</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
