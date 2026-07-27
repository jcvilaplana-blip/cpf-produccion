"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button" 
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import Image from "next/image"
import { MapPin, Globe, Mail, Phone, Edit, Star, Briefcase, Users, Crown, ArrowLeft } from "lucide-react"
import type { Profile, BusinessProfile } from "@/lib/types"

interface BusinessProfileViewContentProps {
  user: any
  profile: Profile | null
  businessProfile: BusinessProfile | null
}

export function BusinessProfileViewContent({ user, profile, businessProfile }: BusinessProfileViewContentProps) {
  const subscriptionInfo = {
    plan: businessProfile?.subscription_plan === "premium" ? "Plan Premium" : "Plan Standard",
    price: businessProfile?.subscription_plan === "premium" ? "29,90€/mes" : "19,90€/mes",
    features:
      businessProfile?.subscription_plan === "premium"
        ? ["20 ofertas de trabajo", "7 días destacado en página principal", "Todas las ventajas del Plan Standard"]
        : ["5 ofertas de trabajo", "Todas las ventajas del Plan Standard"],
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pt-14">
      {/* Header with back button */}
      <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm pt-[env(safe-area-inset-top,0px)]">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/business-profile">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <Link href="/">
              <Image src="/logo-cpf.png" alt="CamareroPorFavor" width={36} height={36} className="object-contain rounded-full" />
            </Link>
            <h1 className="text-lg font-semibold">Perfil de Empresa</h1>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <Avatar className="h-24 w-24 border-4 border-white">
              <AvatarImage src={businessProfile?.company_logo_url || profile?.avatar_url} />
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
                className="inline-block hover:opacity-80 transition-opacity"
              >
                <div className="flex items-center gap-4 justify-center md:justify-start">
                  <div className="flex items-center gap-1.5">
                    <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold text-xl">{profile?.rating || 0}</span>
                    <span className="text-base">({profile?.total_ratings || 0} valoraciones)</span>
                  </div>
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

            {/* Subscription Plan */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Plan de Suscripción</CardTitle>
                  <Badge
                    variant="secondary"
                    className={
                      businessProfile?.subscription_plan === "premium"
                        ? "bg-primary text-primary-foreground"
                        : "bg-[#01A89E] text-white"
                    }
                  >
                    {subscriptionInfo.plan}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Precio</span>
                    <span className="text-2xl font-bold">{subscriptionInfo.price}</span>
                  </div>
                  <div>
                    <p className="font-medium mb-2">Características incluidas:</p>
                    <ul className="space-y-2">
                      {subscriptionInfo.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Button asChild className="w-full">
                    <Link href="/subscribe">
                      <Crown className="h-4 w-4 mr-2" />
                      Gestionar Suscripción
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Map */}
            <Card>
              <CardHeader>
                <CardTitle>Ubicación</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video w-full bg-muted rounded-lg overflow-hidden">
                  <iframe
                    src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(
                      profile?.location || "Madrid, España",
                    )}`}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
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
                      <p className="text-2xl font-bold">12</p>
                      <p className="text-sm text-muted-foreground">Ofertas Publicadas</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="h-8 w-8 text-[#01A89E]" />
                    <div>
                      <p className="text-2xl font-bold">45</p>
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
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Ubicación</p>
                      <p className="text-sm text-muted-foreground">{profile.location}</p>
                    </div>
                  </div>
                )}
                {businessProfile?.website && (
                  <div className="flex items-start gap-3">
                    <Globe className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Sitio Web</p>
                      <a
                        href={businessProfile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline break-all"
                      >
                        {businessProfile.website}
                      </a>
                    </div>
                  </div>
                )}
                {user?.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Email</p>
                      <p className="text-sm text-muted-foreground break-all">{user.email}</p>
                    </div>
                  </div>
                )}
                {profile?.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
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
