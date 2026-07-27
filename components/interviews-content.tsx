"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card" 
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar } from "@/components/ui/calendar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import Image from "next/image"
import {
  CalendarIcon,
  Clock,
  MapPin,
  Phone,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  ArrowLeft,
  Video,
  MessageSquare,
  ChevronRight,
} from "lucide-react"

interface Interview {
  id: string
  candidateId: string // Added candidateId to link to actual candidate profile
  candidateName: string
  candidateAvatar: string
  position: string
  date: string
  time: string
  location: string
  type: "presencial" | "video"
  status: "pendiente" | "confirmada" | "completada" | "cancelada"
  notes?: string
  candidatePhone?: string
  candidateEmail?: string
}

export function InterviewsContent() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [selectedTab, setSelectedTab] = useState("todas")
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null)
  const [interviewsList, setInterviewsList] = useState<Interview[]>([
    {
      id: "1",
      candidateId: "laura-sanchez", // Added candidateId for profile navigation
      candidateName: "Laura Sánchez",
      candidateAvatar: "/professional-chef-woman-headshot.jpg",
      position: "Chef",
      date: "2025-01-30",
      time: "15:00",
      location: "Restaurante La Bella Vista",
      type: "presencial",
      status: "confirmada",
      candidatePhone: "+34 612 345 678",
      candidateEmail: "laura.sanchez@email.com",
      notes: "Experiencia en cocina mediterránea",
    },
    {
      id: "2",
      candidateId: "david-ruiz", // Added candidateId for profile navigation
      candidateName: "David Ruiz",
      candidateAvatar: "/professional-sommelier-headshot.jpg",
      position: "Sumiller",
      date: "2025-01-31",
      time: "10:00",
      location: "Videollamada",
      type: "video",
      status: "pendiente",
      candidatePhone: "+34 623 456 789",
      candidateEmail: "david.ruiz@email.com",
    },
    {
      id: "3",
      candidateId: "carlos-martinez", // Added candidateId for profile navigation
      candidateName: "Carlos Martínez",
      candidateAvatar: "/professional-waiter-headshot.jpg",
      position: "Camarero",
      date: "2025-01-29",
      time: "11:30",
      location: "Restaurante La Bella Vista",
      type: "presencial",
      status: "completada",
      candidatePhone: "+34 634 567 890",
      candidateEmail: "carlos.martinez@email.com",
      notes: "Muy buena presentación y actitud",
    },
    {
      id: "4",
      candidateId: "ana-garcia", // Added candidateId for profile navigation
      candidateName: "Ana García",
      candidateAvatar: "/professional-chef-woman-headshot.jpg",
      position: "Cocinera",
      date: "2025-01-28",
      time: "16:00",
      location: "Restaurante La Bella Vista",
      type: "presencial",
      status: "cancelada",
      candidatePhone: "+34 645 678 901",
      candidateEmail: "ana.garcia@email.com",
      notes: "Cancelada por el candidato",
    },
    {
      id: "5",
      candidateId: "miguel-lopez", // Added candidateId for profile navigation
      candidateName: "Miguel López",
      candidateAvatar: "/professional-bartender-headshot.jpg",
      position: "Bartender",
      date: "2025-02-01",
      time: "14:00",
      location: "Videollamada",
      type: "video",
      status: "pendiente",
      candidatePhone: "+34 656 789 012",
      candidateEmail: "miguel.lopez@email.com",
    },
  ])
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  const handleCloseInterview = (interviewId: string) => {
    setInterviewsList((prev) =>
      prev.map((interview) =>
        interview.id === interviewId ? { ...interview, status: "completada" as const } : interview,
      ),
    )
    setIsSheetOpen(false)
    setSelectedInterview(null)
  }

  const handleCancelInterview = (interviewId: string) => {
    setInterviewsList((prev) =>
      prev.map((interview) =>
        interview.id === interviewId ? { ...interview, status: "cancelada" as const } : interview,
      ),
    )
    setIsSheetOpen(false)
    setSelectedInterview(null)
  }

  const getStatusBadge = (status: Interview["status"]) => {
    const variants = {
      pendiente: { variant: "secondary" as const, icon: AlertCircle, text: "Pendiente", color: "text-yellow-600" },
      confirmada: { variant: "default" as const, icon: CheckCircle2, text: "Confirmada", color: "text-green-600" },
      completada: { variant: "outline" as const, icon: CheckCircle2, text: "Completada", color: "text-gray-600" },
      cancelada: { variant: "destructive" as const, icon: XCircle, text: "Cancelada", color: "text-red-600" },
    }
    const config = variants[status]
    const Icon = config.icon
    return (
      <Badge variant={config.variant} className="gap-1 text-xs">
        <Icon className="h-3 w-3" />
        {config.text}
      </Badge>
    )
  }

  const filteredInterviews = interviewsList.filter((interview) => {
    if (selectedTab === "todas") return true
    if (selectedTab === "pendientes") return interview.status === "pendiente"
    if (selectedTab === "confirmadas") return interview.status === "confirmada"
    if (selectedTab === "completadas") return interview.status === "completada"
    return true
  })

  const interviewsOnSelectedDate = interviewsList.filter(
    (interview) => interview.date === date?.toISOString().split("T")[0],
  )

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pt-14">
      <header className="sticky top-0 z-50 w-full bg-white border-b shadow-sm pt-[env(safe-area-inset-top,0px)]">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="icon" className="h-9 w-9">
              <Link href="/business-profile">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo-cpf.png" alt="CamareroPorFavor" width={32} height={32} className="object-contain rounded-full" />
              <div className="hidden sm:block">
                <h1 className="text-base font-bold leading-tight">Entrevistas</h1>
                <p className="text-xs text-muted-foreground">Gestiona tus citas</p>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                  <CalendarIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Calendario</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="bg-white h-[80vh]">
                <SheetHeader>
                  <SheetTitle>Calendario de Entrevistas</SheetTitle>
                  <SheetDescription>Selecciona una fecha para ver las entrevistas programadas</SheetDescription>
                </SheetHeader>
                <div className="py-6 flex flex-col items-center">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="rounded-md border"
                    modifiers={{
                      hasInterview: interviewsList.map((i) => new Date(i.date)),
                    }}
                    modifiersStyles={{
                      hasInterview: {
                        fontWeight: "bold",
                        backgroundColor: "hsl(var(--primary))",
                        color: "white",
                      },
                    }}
                  />
                  {interviewsOnSelectedDate.length > 0 && (
                    <div className="mt-6 w-full space-y-2">
                      <h3 className="font-semibold text-sm">
                        {interviewsOnSelectedDate.length} entrevista(s) el{" "}
                        {date?.toLocaleDateString("es-ES", { day: "numeric", month: "long" })}
                      </h3>
                      {interviewsOnSelectedDate.map((interview) => (
                        <Card key={interview.id} className="p-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={interview.candidateAvatar || "/placeholder.svg"} />
                              <AvatarFallback>{interview.candidateName[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{interview.candidateName}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>{interview.time}</span>
                              </div>
                            </div>
                            {getStatusBadge(interview.status)}
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-primary hover:bg-primary/90 gap-2">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Nueva</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Programar Nueva Entrevista</DialogTitle>
                  <DialogDescription>Completa los detalles de la entrevista</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="candidate">Candidato</Label>
                    <Select>
                      <SelectTrigger id="candidate">
                        <SelectValue placeholder="Seleccionar candidato" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="1">Laura Sánchez - Chef</SelectItem>
                        <SelectItem value="2">David Ruiz - Sumiller</SelectItem>
                        <SelectItem value="3">Carlos Martínez - Camarero</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="date">Fecha</Label>
                      <Input id="date" type="date" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="time">Hora</Label>
                      <Input id="time" type="time" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo</Label>
                    <Select>
                      <SelectTrigger id="type">
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="presencial">Presencial</SelectItem>
                        <SelectItem value="video">Videollamada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Ubicación</Label>
                    <Input id="location" placeholder="Dirección o enlace de videollamada" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notas (opcional)</Label>
                    <Textarea id="notes" placeholder="Añade notas sobre la entrevista" rows={3} />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <DialogTrigger asChild>
                    <Button variant="outline">Cancelar</Button>
                  </DialogTrigger>
                  <Button className="bg-primary hover:bg-primary/90">Programar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <div className="px-4 py-4">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-4 h-auto">
            <TabsTrigger value="todas" className="text-xs sm:text-sm py-2">
              Todas
            </TabsTrigger>
            <TabsTrigger value="pendientes" className="text-xs sm:text-sm py-2">
              Pendientes
            </TabsTrigger>
            <TabsTrigger value="confirmadas" className="text-xs sm:text-sm py-2">
              Confirmadas
            </TabsTrigger>
            <TabsTrigger value="completadas" className="text-xs sm:text-sm py-2">
              Completadas
            </TabsTrigger>
          </TabsList>

          <TabsContent value={selectedTab} className="space-y-3 mt-0">
            {filteredInterviews.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CalendarIcon className="h-16 w-16 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No hay entrevistas en esta categoría</p>
              </div>
            ) : (
              <>
                {filteredInterviews.map((interview) => (
                  <Sheet
                    key={interview.id}
                    open={isSheetOpen && selectedInterview?.id === interview.id}
                    onOpenChange={(open) => {
                      setIsSheetOpen(open)
                      if (!open) setSelectedInterview(null)
                    }}
                  >
                    <SheetTrigger asChild>
                      <Card
                        className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer active:scale-[0.98]"
                        onClick={() => {
                          setSelectedInterview(interview)
                          setIsSheetOpen(true)
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12 flex-shrink-0">
                              <AvatarImage src={interview.candidateAvatar || "/placeholder.svg"} />
                              <AvatarFallback>{interview.candidateName[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <div className="min-w-0 flex-1">
                                  <h3 className="font-semibold text-sm truncate">{interview.candidateName}</h3>
                                  <p className="text-xs text-muted-foreground truncate">{interview.position}</p>
                                </div>
                                {getStatusBadge(interview.status)}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                                <div className="flex items-center gap-1">
                                  <CalendarIcon className="h-3 w-3" />
                                  <span>
                                    {new Date(interview.date).toLocaleDateString("es-ES", {
                                      day: "numeric",
                                      month: "short",
                                    })}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{interview.time}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  {interview.type === "video" ? (
                                    <Video className="h-3 w-3" />
                                  ) : (
                                    <MapPin className="h-3 w-3" />
                                  )}
                                  <span className="truncate">
                                    {interview.type === "video" ? "Video" : "Presencial"}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                          </div>
                        </CardContent>
                      </Card>
                    </SheetTrigger>

                    <SheetContent side="bottom" className="bg-white h-[85vh] overflow-y-auto">
                      <SheetHeader className="text-left">
                        <div className="flex items-center gap-3 mb-2">
                          <Avatar className="h-16 w-16">
                            <AvatarImage src={interview.candidateAvatar || "/placeholder.svg"} />
                            <AvatarFallback>{interview.candidateName[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <SheetTitle className="text-lg">{interview.candidateName}</SheetTitle>
                            <SheetDescription className="text-sm">{interview.position}</SheetDescription>
                          </div>
                          {getStatusBadge(interview.status)}
                        </div>
                      </SheetHeader>

                      <div className="space-y-4 py-6">
                        <div className="space-y-3">
                          <h3 className="font-semibold text-sm">Detalles de la Entrevista</h3>
                          <div className="space-y-2">
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                              <CalendarIcon className="h-5 w-5 text-primary" />
                              <div>
                                <p className="text-xs text-muted-foreground">Fecha</p>
                                <p className="text-sm font-medium">
                                  {new Date(interview.date).toLocaleDateString("es-ES", {
                                    weekday: "long",
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                  })}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                              <Clock className="h-5 w-5 text-primary" />
                              <div>
                                <p className="text-xs text-muted-foreground">Hora</p>
                                <p className="text-sm font-medium">{interview.time}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                              {interview.type === "video" ? (
                                <Video className="h-5 w-5 text-primary" />
                              ) : (
                                <MapPin className="h-5 w-5 text-primary" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-muted-foreground">
                                  {interview.type === "video" ? "Videollamada" : "Ubicación"}
                                </p>
                                <p className="text-sm font-medium truncate">{interview.location}</p>
                              </div>
                            </div>
                            {interview.candidatePhone && (
                              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                <Phone className="h-5 w-5 text-primary" />
                                <div>
                                  <p className="text-xs text-muted-foreground">Teléfono</p>
                                  <p className="text-sm font-medium">{interview.candidatePhone}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {interview.notes && (
                          <div className="space-y-2">
                            <h3 className="font-semibold text-sm">Notas</h3>
                            <p className="text-sm text-muted-foreground bg-gray-50 p-3 rounded-lg">{interview.notes}</p>
                          </div>
                        )}

                        <div className="space-y-2 pt-4">
                          <Button asChild className="w-full bg-transparent" variant="outline">
                            <Link href={`/profile/${interview.candidateId}`}>Ver Perfil Completo</Link>
                          </Button>
                          <Button asChild className="w-full bg-transparent" variant="outline">
                            <Link href={`/messages?candidateId=${interview.candidateId}`}>
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Enviar Mensaje
                            </Link>
                          </Button>
                          {(interview.status === "pendiente" || interview.status === "confirmada") && (
                            <>
                              <Button
                                className="w-full bg-[#01A89E] hover:bg-[#018F86]"
                                onClick={() => handleCancelInterview(interview.id)}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Cancelar Entrevista
                              </Button>
                              <Button
                                className="w-full bg-green-600 hover:bg-green-700"
                                onClick={() => handleCloseInterview(interview.id)}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Marcar como Cerrada
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>
                ))}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
