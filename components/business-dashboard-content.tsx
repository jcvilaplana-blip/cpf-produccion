"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card" 
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import Image from "next/image"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Briefcase,
  Heart,
  MessageCircle,
  Calendar,
  TrendingUp,
  Users,
  Eye,
  Plus,
  Star,
  LogOut,
  Building2,
  Crown,
  Bell,
  MapPin,
} from "lucide-react"
import type { Profile } from "@/lib/types"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { BottomNavigation } from "@/components/bottom-navigation"

interface BusinessStats {
  activeJobs: number
  totalViews: number
  favorites: number
  interviews: number
  unreadMessages: number
  totalApplications: number
  pendingApplications: number
}

interface RecentApplication {
  id: string
  job_id: string
  worker_id: string
  status: string
  created_at: string
  worker: {
    id: string
    display_name: string
    avatar_url: string | null
    rating: number
    job_category: string | null
  } | null
}

interface BusinessDashboardContentProps {
  user: any
  profile: Profile | null
  stats: BusinessStats
  recentApplications: RecentApplication[]
  jobs: { id: string; title: string; views: number; is_active: boolean; created_at: string }[]
}

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  accepted: "Aceptado",
  rejected: "Rechazado",
  interview: "Entrevista",
  withdrawn: "Retirado",
}

export function BusinessDashboardContent({
  user,
  profile,
  stats,
  recentApplications,
  jobs,
}: BusinessDashboardContentProps) {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pt-14">
      <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 pt-[env(safe-area-inset-top,0px)]">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/">
                <Image src="/logo-cpf.png" alt="CamareroPorFavor" width={40} height={40} className="object-contain rounded-full" />
              </Link>
              <div>
                <h2 className="text-base font-semibold">Panel de Control</h2>
                <p className="text-xs text-muted-foreground">
                  Bienvenido, {profile?.display_name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {stats.unreadMessages > 0 && (
                <Button asChild variant="ghost" size="icon" className="relative">
                  <Link href="/messages">
                    <Bell className="h-5 w-5" />
                    <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {stats.unreadMessages}
                    </span>
                  </Link>
                </Button>
              )}
              <Button
                asChild
                variant="outline"
                size="sm"
                className="hidden md:flex border-primary text-primary hover:bg-primary/10 bg-transparent"
              >
                <Link href="/subscribe">
                  <Crown className="h-4 w-4 mr-2" />
                  Premium
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.display_name} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {profile?.display_name?.[0] || user?.email?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{profile?.display_name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <Building2 className="mr-2 h-4 w-4" />
                      <span>Perfil de Empresa</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/subscribe" className="cursor-pointer">
                      <Crown className="mr-2 h-4 w-4 text-primary" />
                      <span>Gestionar Suscripcion</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar Sesion</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Button asChild className="h-auto py-4 flex-col gap-2 bg-primary hover:bg-primary/90">
            <Link href="/jobs/create">
              <Plus className="h-6 w-6" />
              <span className="text-xs">Publicar Oferta</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2 bg-transparent">
            <Link href="/candidates">
              <Users className="h-6 w-6" />
              <span className="text-xs">Candidatos</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2 bg-transparent">
            <Link href="/messages">
              <MessageCircle className="h-6 w-6" />
              <span className="text-xs">Mensajes</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2 bg-transparent">
            <Link href="/reels">
              <TrendingUp className="h-6 w-6" />
              <span className="text-xs">Ver Reels</span>
            </Link>
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <Link href="/my-jobs">
            <Card className="cursor-pointer hover:shadow-md transition-shadow h-full">
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center">
                  <Briefcase className="h-7 w-7 text-primary mb-1.5" />
                  <p className="text-2xl font-bold">{stats.activeJobs}</p>
                  <p className="text-xs text-muted-foreground">Ofertas Activas</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col items-center text-center">
                <Eye className="h-7 w-7 text-[#01A89E] mb-1.5" />
                <p className="text-2xl font-bold">{stats.totalViews}</p>
                <p className="text-xs text-muted-foreground">Visualizaciones</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col items-center text-center">
                <Users className="h-7 w-7 text-[#01A89E] mb-1.5" />
                <p className="text-2xl font-bold">{stats.totalApplications}</p>
                <p className="text-xs text-muted-foreground">Solicitudes</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col items-center text-center">
                <Bell className="h-7 w-7 text-yellow-500 mb-1.5" />
                <p className="text-2xl font-bold">{stats.pendingApplications}</p>
                <p className="text-xs text-muted-foreground">Pendientes</p>
              </div>
            </CardContent>
          </Card>

          <Link href="/messages">
            <Card className="cursor-pointer hover:shadow-md transition-shadow h-full">
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center">
                  <MessageCircle className="h-7 w-7 text-primary mb-1.5" />
                  <p className="text-2xl font-bold">{stats.unreadMessages}</p>
                  <p className="text-xs text-muted-foreground">Mensajes</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/saved">
            <Card className="cursor-pointer hover:shadow-md transition-shadow h-full">
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center">
                  <Heart className="h-7 w-7 text-red-500 mb-1.5" />
                  <p className="text-2xl font-bold">{stats.favorites}</p>
                  <p className="text-xs text-muted-foreground">Favoritos</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Recent Applications */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Solicitudes Recientes</CardTitle>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/my-jobs">Ver todas</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentApplications.length === 0 ? (
                <div className="text-center py-6">
                  <Users className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No hay solicitudes recientes</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentApplications.map((app) => (
                    <div key={app.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={app.worker?.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {app.worker?.display_name?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold truncate">
                          {app.worker?.display_name || "Usuario"}
                        </h4>
                        <p className="text-xs text-muted-foreground truncate">
                          {app.worker?.job_category || "Hosteleria"}
                        </p>
                        {app.worker?.rating > 0 && (
                          <div className="flex items-center gap-0.5 mt-0.5">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs">{app.worker.rating}</span>
                          </div>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <Badge variant="outline" className="text-xs mb-1">
                          {statusLabels[app.status] || app.status}
                        </Badge>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(app.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* My Active Jobs */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Mis Ofertas</CardTitle>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/my-jobs">Gestionar</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {jobs.length === 0 ? (
                <div className="text-center py-6">
                  <Briefcase className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-3">No tienes ofertas publicadas</p>
                  <Button asChild size="sm" className="bg-primary hover:bg-primary/90">
                    <Link href="/jobs/create">Crear Oferta</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {jobs.slice(0, 5).map(job => (
                    <Link key={job.id} href={`/jobs/${job.id}`}>
                      <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold truncate">{job.title}</h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                              <Eye className="h-3 w-3" /> {job.views || 0}
                            </span>
                          </div>
                        </div>
                        <Badge
                          variant={job.is_active ? "default" : "secondary"}
                          className={`text-xs ${job.is_active ? "bg-green-600" : ""}`}
                        >
                          {job.is_active ? "Activa" : "Inactiva"}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <BottomNavigation profile={profile} />
    </div>
  )
}
