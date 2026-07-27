"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button" 
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Heart, MapPin, Search } from "lucide-react"
import type { UserType } from "@/lib/types"

interface FavoritesContentProps {
  savedItems: any[]
  userType: UserType
}

export function FavoritesContent({ savedItems, userType }: FavoritesContentProps) {
  return (
    <div className="min-h-screen bg-background pb-20 md:pt-14">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">{userType === "business" ? "Candidatos Guardados" : "Favoritos"}</h1>
          <p className="text-muted-foreground">
            {userType === "business" ? "Candidatos que te interesan" : "Ofertas guardadas"}
          </p>
        </div>

        {userType === "business" && (
          <Card className="mb-6 bg-primary/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <Search className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Buscar Nuevos Candidatos</h3>
                    <p className="text-sm text-muted-foreground">Encuentra más profesionales para tu equipo</p>
                  </div>
                </div>
                <Button asChild className="bg-primary hover:bg-primary/90">
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
              <p className="text-muted-foreground mb-4">
                {userType === "business"
                  ? "Guarda candidatos que te interesen para contactarlos más tarde"
                  : "Guarda ofertas de trabajo que te interesen"}
              </p>
              <Link href={userType === "business" ? "/search" : "/search"}>
                <Button className="bg-[#01A89E] hover:bg-[#018F86]">
                  {userType === "business" ? "Buscar Candidatos" : "Buscar Ofertas"}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {savedItems.map((item) => {
              if (userType !== "business" && item.business) {
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

              const content = userType === "business" ? item.profile : item.job
              return (
                <Card key={item.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-base">
                        {userType === "business" ? content.display_name : content.title}
                      </CardTitle>
                      <Heart className="h-5 w-5 fill-[#01A89E] text-[#01A89E]" />
                    </div>
                    <CardDescription className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {content.location || content.city}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 p-4">
                    {userType === "business" ? (
                      <div className="space-y-1.5">
                        <Badge>{content.category}</Badge>
                        <p className="text-sm text-muted-foreground line-clamp-2">{content.bio}</p>
                        <Link href={`/profile/${content.id}`}>
                          <Button className="w-full bg-[#01A89E] hover:bg-[#018F86]">Ver Perfil</Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <Badge>{content.category}</Badge>
                        <p className="text-sm text-muted-foreground line-clamp-2">{content.description}</p>
                        <Link href={`/jobs/${content.id}`}>
                          <Button className="w-full bg-[#01A89E] hover:bg-[#018F86]">Ver Oferta</Button>
                        </Link>
                      </div>
                    )}
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
