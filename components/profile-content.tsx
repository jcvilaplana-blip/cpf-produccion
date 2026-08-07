"use client"

import { useState } from "react" 
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  Star,
  MapPin,
  Phone,
  Mail,
  Briefcase,
  Edit,
  Building,
  HelpCircle,
  ImageIcon,
  Upload,
  Video,
  FileText,
} from "lucide-react"
import Link from "next/link"
import ImageComponent from "next/image"
import { BottomNavigation } from "@/components/bottom-navigation"
import { FlashOffersCarousel } from "@/components/flash-offers-carousel"
import type { Profile, BusinessProfile } from "@/lib/types"
import { useLanguage } from "@/lib/i18n/language-context"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ProfileContentProps {
  user: any
  profile: Profile | null
  businessProfile: BusinessProfile | null
  applications: any[]
  postedJobs: any[]
  ratings: any[]
}

const statusLabels = {
  pending: "Pendiente",
  accepted: "Aceptada",
  rejected: "Rechazada",
  withdrawn: "Retirada",
}

const statusColors = {
  pending: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
  accepted: "bg-green-500/10 text-green-700 border-green-500/20",
  rejected: "bg-red-500/10 text-red-700 border-red-500/20",
  withdrawn: "bg-gray-500/10 text-gray-700 border-gray-500/20",
}

export function ProfileContent({
  user,
  profile,
  businessProfile,
  applications,
  postedJobs,
  ratings,
}: ProfileContentProps) {
  const router = useRouter()
  const { t } = useLanguage()

  const [formData, setFormData] = useState({
    displayName: profile?.display_name || "Santiago García",
    phone: profile?.phone || "+34 612 345 678",
    location: profile?.location || "Madrid",
    bio: profile?.bio || "Profesional de hostelería con amplia experiencia en servicio de alta calidad.",
    companyName: businessProfile?.company_name || "",
    companyDescription: businessProfile?.company_description || "",
    website: businessProfile?.website || "",
    category: "Camarero",
    yearsExperience: "5",
    skills: ["Servicio de Mesa", "Coctelería", "Atención al Cliente", "Trabajo en Equipo"],
    languages: ["Español (Nativo)", "Inglés (Avanzado)", "Francés (Intermedio)"],
    availability: "Inmediata",
    certifications: [] as string[],
    references: "",
  })

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star key={i} className={`h-5 w-5 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
    ))
  }

  return (
    <div className="min-h-screen bg-background pb-24 md:pt-14">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white pt-[env(safe-area-inset-top,0px)]">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
              <ImageComponent
                src="/logo-cpf.png"
                alt="CamareroPorFavor"
                width={36}
                height={36}
                className="object-contain rounded-full"
              />
              <h1 className="text-lg font-bold">{t("profile.title")}</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/help">
                  <HelpCircle className="h-4 w-4 mr-2" />
                  {t("common.help")}
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href={profile?.user_type === "business" ? "/business-profile/edit" : "/profile/edit"}>
                  <Edit className="h-4 w-4 mr-2" />
                  {t("common.edit")}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start gap-6">
              <div className="relative w-full md:w-auto">
                <div className="relative w-full md:w-48 h-56 rounded-lg overflow-hidden border-4 border-background shadow-lg">
                  <ImageComponent
                    src="/professional-waiter-in-elegant-restaurant-uniform.jpg"
                    alt={profile?.display_name || "Profile"}
                    fill
                    className="object-cover"
                  />
                </div>
                {profile?.user_type === "business" && (
                  <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground rounded-full p-2">
                    <Building className="h-4 w-4" />
                  </div>
                )}
              </div>

              <div className="flex-1 w-full">
                <>
                    <div className="mb-3">
                      <h2 className="text-2xl font-bold mb-1">{formData.displayName}</h2>
                      {profile?.user_type === "business" && businessProfile?.company_name && (
                        <p className="text-lg text-muted-foreground">{businessProfile.company_name}</p>
                      )}
                      <Badge variant="secondary" className="mt-2">
                        {profile?.user_type === "business" ? t("auth.business") : t("auth.worker")}
                      </Badge>
                    </div>

                    <Link
                      href={
                        profile?.user_type === "business"
                          ? `/business/${profile?.id}/ratings`
                          : `/profile/${profile?.id}/ratings`
                      }
                      className="inline-flex items-center gap-2 mb-3 hover:opacity-80 transition-opacity"
                    >
                      <div className="flex items-center gap-1">{renderStars(Math.round(profile?.rating || 0))}</div>
                      <span className="text-sm text-muted-foreground">
                        {profile?.rating?.toFixed(1) || "0.0"} ({profile?.total_ratings || 0} valoraciones)
                      </span>
                    </Link>

                    <div className="space-y-2 text-sm">
                      {profile?.location && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          {profile.location}
                        </div>
                      )}
                      {profile?.phone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          {profile.phone}
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        {user.email}
                      </div>
                      {businessProfile?.website && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Building className="h-4 w-4" />
                          <a
                            href={businessProfile.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                          >
                            {businessProfile.website}
                          </a>
                        </div>
                      )}
                    </div>

                    {(profile?.bio || businessProfile?.company_description) && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {profile?.user_type === "business" ? businessProfile?.company_description : profile?.bio}
                        </p>
                      </div>
                    )}

                    {profile?.user_type === "worker" && (
                      <>
                        {formData.category && (
                          <div className="mt-4 pt-4 border-t">
                            <h3 className="font-semibold mb-2 text-sm">{t("profile.category")}</h3>
                            <p className="text-sm text-muted-foreground">{formData.category}</p>
                          </div>
                        )}

                        {formData.yearsExperience && (
                          <div className="mt-4 pt-4 border-t">
                            <h3 className="font-semibold mb-2 text-sm">{t("profile.yearsExperience")}</h3>
                            <p className="text-sm text-muted-foreground">
                              {formData.yearsExperience} {t("candidates.years")}
                            </p>
                          </div>
                        )}

                        {formData.skills.length > 0 && (
                          <div className="mt-4 pt-4 border-t">
                            <h3 className="font-semibold mb-2 text-sm">{t("profile.skills")}</h3>
                            <div className="flex flex-wrap gap-2">
                              {formData.skills.map((skill) => (
                                <Badge key={skill} variant="secondary">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {formData.languages.length > 0 && (
                          <div className="mt-4 pt-4 border-t">
                            <h3 className="font-semibold mb-2 text-sm">{t("profile.languages")}</h3>
                            <div className="flex flex-wrap gap-2">
                              {formData.languages.map((language) => (
                                <Badge key={language} variant="secondary">
                                  {language}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {formData.availability && (
                          <div className="mt-4 pt-4 border-t">
                            <h3 className="font-semibold mb-2 text-sm">{t("profile.availability")}</h3>
                            <p className="text-sm text-muted-foreground">{formData.availability}</p>
                          </div>
                        )}

                        {formData.certifications.length > 0 && (
                          <div className="mt-4 pt-4 border-t">
                            <h3 className="font-semibold mb-2 text-sm">{t("profile.certifications")}</h3>
                            <div className="flex flex-wrap gap-2">
                              {formData.certifications.map((cert) => (
                                <Badge key={cert} variant="secondary">
                                  {cert}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {formData.references && (
                          <div className="mt-4 pt-4 border-t">
                            <h3 className="font-semibold mb-2 text-sm">{t("profile.references")}</h3>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{formData.references}</p>
                          </div>
                        )}
                      </>
                    )}
                  </>
              </div>
            </div>

            {profile?.user_type === "worker" && (
              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold flex items-center gap-2 text-sm md:text-base">
                    <Video className="h-5 w-5 text-primary" />
                    {t("profile.videoPresentation")}
                  </h3>
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    {t("profile.uploadVideo")}
                  </Button>
                </div>
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-primary/30 hover:border-primary/60 transition-colors cursor-pointer">
                  <div className="text-center p-6">
                    <Video className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm font-medium mb-1">Sube tu video de presentación</p>
                    <p className="text-[13px] text-muted-foreground">
                      Destaca entre los demás candidatos con un video profesional
                    </p>
                  </div>
                </div>
              </div>
            )}

            {profile?.user_type === "worker" && (
              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 text-primary" />
                    {t("profile.imageGallery")}
                  </h3>
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    {t("profile.uploadImages")}
                  </Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {/* Profile image slot */}
                  <div className="aspect-square bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-primary/30 hover:border-primary/60 transition-colors cursor-pointer">
                    <div className="text-center p-2">
                      <ImageIcon className="h-8 w-8 text-muted-foreground mx-auto mb-1" />
                      <p className="text-[13px] text-muted-foreground font-medium">Foto de Perfil</p>
                    </div>
                  </div>
                  {/* Gallery image slots (up to 4) */}
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="aspect-square bg-muted rounded-lg flex items-center justify-center border-2 border-dashed hover:border-primary/40 transition-colors cursor-pointer"
                    >
                      <div className="text-center p-2">
                        <ImageIcon className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
                        <p className="text-[13px] text-muted-foreground">Imagen {i}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[13px] text-muted-foreground mt-3">
                  Sube 1 imagen de perfil y hasta 4 imágenes adicionales para tu galería profesional
                </p>
              </div>
            )}

            {profile?.user_type === "worker" && (
              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    {t("profile.cv")}
                  </h3>
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    {t("profile.uploadCV")}
                  </Button>
                </div>
                <div className="bg-muted rounded-lg p-6 flex items-center justify-center border-2 border-dashed border-primary/30 hover:border-primary/60 transition-colors cursor-pointer">
                  <div className="text-center">
                    <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm font-medium mb-1">Sube tu CV en formato PDF</p>
                    <p className="text-[13px] text-muted-foreground">Máximo 5MB</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Flash Offers Carousel */}
        {profile?.user_type === "worker" && (
          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2 text-sm md:text-base">
                <Briefcase className="h-5 w-5 text-[#E73A36]" />
                Ofertas Flash Disponibles
              </h3>
              <Link href="/flash-offers" className="text-sm text-[#01A89E] hover:text-[#018F86]">
                Ver todas
              </Link>
            </div>
            <FlashOffersCarousel offers={[]} />
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue={profile?.user_type === "worker" ? "applications" : "jobs"} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value={profile?.user_type === "worker" ? "applications" : "jobs"}>
              {profile?.user_type === "worker" ? t("profile.myApplications") : t("profile.postedJobs")}
            </TabsTrigger>
            <TabsTrigger value="ratings">{t("profile.ratings")}</TabsTrigger>
          </TabsList>

          {/* Applications Tab (Workers) */}
          {profile?.user_type === "worker" && (
            <TabsContent value="applications" className="space-y-4">
              {applications.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No has seleccionado ningún trabajo</h3>
                    <p className="text-muted-foreground mb-4">
                      Explora las ofertas disponibles y comienza a seleccionar
                    </p>
                    <Button asChild className="bg-primary hover:bg-primary/90">
                      <Link href="/jobs">Ver Trabajos</Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                applications.map((application) => (
                  <Card key={application.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12 border">
                          <AvatarImage src={application.job.business.avatar_url || "/placeholder.svg"} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {application.job.business.display_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="font-semibold mb-1">{application.job.title}</h3>
                              <p className="text-sm text-muted-foreground mb-2">
                                {application.job.business.display_name}
                              </p>
                              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  {application.job.location}
                                </span>
                                {application.job.salary_display && <span>{application.job.salary_display}</span>}
                              </div>
                            </div>
                            <Badge className={statusColors[application.status as keyof typeof statusColors]}>
                              {statusLabels[application.status as keyof typeof statusLabels]}
                            </Badge>
                          </div>
                          <div className="mt-3 pt-3 border-t text-[13px] text-muted-foreground">
                            Seleccionado el {new Date(application.created_at).toLocaleDateString("es-ES")}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          )}

          {/* Posted Jobs Tab (Businesses) */}
          {profile?.user_type === "business" && (
            <TabsContent value="jobs" className="space-y-4">
              {postedJobs.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No has publicado ningún trabajo</h3>
                    <p className="text-muted-foreground mb-4">Comienza a publicar ofertas para encontrar candidatos</p>
                    <Button asChild className="bg-primary hover:bg-primary/90">
                      <Link href="/jobs/create">Publicar Trabajo</Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                postedJobs.map((job) => (
                  <Card key={job.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">{job.title}</h3>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {job.location}
                            </span>
                            {job.salary_display && <span>{job.salary_display}</span>}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={job.is_active ? "default" : "secondary"}>
                              {job.is_active ? "Activo" : "Inactivo"}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {job.applications?.[0]?.count || 0} solicitudes
                            </span>
                          </div>
                        </div>
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/jobs/${job.id}/applications`}>Ver Solicitudes</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          )}

          {/* Ratings Tab */}
          <TabsContent value="ratings" className="space-y-4">
            {ratings.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aún no tienes valoraciones</h3>
                  <p className="text-muted-foreground">
                    Las valoraciones aparecerán aquí cuando completes trabajos o contrates personal
                  </p>
                </CardContent>
              </Card>
            ) : (
              ratings.map((rating) => (
                <Card key={rating.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={rating.reviewer_avatar || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {(rating.reviewer_name || "?")[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">{rating.reviewer_name || "Empresa"}</h4>
                          <div className="flex items-center gap-1">{renderStars(rating.score)}</div>
                        </div>
                        {rating.job_title && (
                          <p className="text-[13px] text-muted-foreground mb-1">Oferta: {rating.job_title}</p>
                        )}
                        {rating.comment && <p className="text-sm text-muted-foreground">{rating.comment}</p>}
                        <p className="text-[13px] text-muted-foreground mt-2">
                          {new Date(rating.created_at).toLocaleDateString("es-ES")}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Bottom Navigation Component */}
      <BottomNavigation profile={profile} />
    </div>
  )
}
