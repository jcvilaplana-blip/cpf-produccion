"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar } from "@/components/ui/calendar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import Link from "next/link"
import Image from "next/image"
import { toast } from "sonner"
import { resolveInterviewRequestAction } from "@/lib/actions"
import {
  CalendarIcon, Clock, MapPin, Phone, CheckCircle2, XCircle, AlertCircle,
  ArrowLeft, Video, PhoneCall, MessageSquare, ChevronRight,
} from "lucide-react"

export interface BusinessInterview {
  id: string
  workerId: string
  workerName: string
  workerAvatar: string | null
  workerPhone: string | null
  jobTitle: string
  scheduledAt: string
  interviewType: "call" | "in_person" | "video_call" | "other"
  otherTypeDetail: string | null
  status: "pending" | "confirmed" | "cancelled" | "approved" | "not_hired"
  notes: string | null
}

const TYPE_LABELS: Record<string, string> = {
  call: "Llamada", in_person: "Presencial", video_call: "Videoconferencia", other: "Otra",
}
const TYPE_ICONS: Record<string, typeof Video> = {
  call: PhoneCall, in_person: MapPin, video_call: Video, other: CalendarIcon,
}

export function InterviewsContent({ interviews: initialInterviews }: { interviews: BusinessInterview[] }) {
  const [interviews, setInterviews] = useState(initialInterviews)
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [selectedTab, setSelectedTab] = useState("todas")
  const [selectedInterview, setSelectedInterview] = useState<BusinessInterview | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [isResolving, setIsResolving] = useState(false)

  const handleResolve = async (interviewId: string, resolution: "approved" | "not_hired") => {
    setIsResolving(true)
    const result = await resolveInterviewRequestAction(interviewId, resolution)
    setIsResolving(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    setInterviews((prev) => prev.map((i) => (i.id === interviewId ? { ...i, status: resolution } : i)))
    setSelectedInterview((prev) => (prev ? { ...prev, status: resolution } : prev))
    toast.success(resolution === "approved" ? "Candidato contratado" : "Entrevista cerrada sin contratación")
  }

  const getStatusBadge = (status: BusinessInterview["status"]) => {
    const variants = {
      pending: { variant: "secondary" as const, icon: AlertCircle, text: "Pendiente de confirmar" },
      confirmed: { variant: "default" as const, icon: CheckCircle2, text: "Confirmada" },
      approved: { variant: "outline" as const, icon: CheckCircle2, text: "Contratado" },
      not_hired: { variant: "secondary" as const, icon: XCircle, text: "Sin contratación" },
      cancelled: { variant: "destructive" as const, icon: XCircle, text: "Cancelada" },
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

  const filteredInterviews = interviews.filter((interview) => {
    if (selectedTab === "todas") return true
    if (selectedTab === "pendientes") return interview.status === "pending"
    if (selectedTab === "confirmadas") return interview.status === "confirmed"
    if (selectedTab === "contratados") return interview.status === "approved"
    return true
  })

  const interviewsOnSelectedDate = interviews.filter(
    (i) => new Date(i.scheduledAt).toISOString().split("T")[0] === date?.toISOString().split("T")[0]
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
                  modifiers={{ hasInterview: interviews.map((i) => new Date(i.scheduledAt)) }}
                  modifiersStyles={{
                    hasInterview: { fontWeight: "bold", backgroundColor: "hsl(var(--primary))", color: "white" },
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
                            <AvatarImage src={interview.workerAvatar || "/placeholder.svg"} />
                            <AvatarFallback>{interview.workerName[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{interview.workerName}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>{new Date(interview.scheduledAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</span>
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
        </div>
      </header>

      <div className="px-4 py-4">
        <p className="text-xs text-muted-foreground mb-3">
          Las entrevistas se solicitan desde la ficha de cada candidato o desde el chat.
        </p>
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-4 h-auto">
            <TabsTrigger value="todas" className="text-xs sm:text-sm py-2">Todas</TabsTrigger>
            <TabsTrigger value="pendientes" className="text-xs sm:text-sm py-2">Pendientes</TabsTrigger>
            <TabsTrigger value="confirmadas" className="text-xs sm:text-sm py-2">Confirmadas</TabsTrigger>
            <TabsTrigger value="contratados" className="text-xs sm:text-sm py-2">Contratados</TabsTrigger>
          </TabsList>

          <TabsContent value={selectedTab} className="space-y-3 mt-0">
            {filteredInterviews.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CalendarIcon className="h-16 w-16 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No hay entrevistas en esta categoría</p>
              </div>
            ) : (
              filteredInterviews.map((interview) => {
                const TypeIcon = TYPE_ICONS[interview.interviewType]
                return (
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
                        onClick={() => { setSelectedInterview(interview); setIsSheetOpen(true) }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12 flex-shrink-0">
                              <AvatarImage src={interview.workerAvatar || "/placeholder.svg"} />
                              <AvatarFallback>{interview.workerName[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <div className="min-w-0 flex-1">
                                  <h3 className="font-semibold text-sm truncate">{interview.workerName}</h3>
                                  <p className="text-xs text-muted-foreground truncate">{interview.jobTitle}</p>
                                </div>
                                {getStatusBadge(interview.status)}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                                <div className="flex items-center gap-1">
                                  <CalendarIcon className="h-3 w-3" />
                                  <span>{new Date(interview.scheduledAt).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{new Date(interview.scheduledAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <TypeIcon className="h-3 w-3" />
                                  <span className="truncate">{TYPE_LABELS[interview.interviewType]}</span>
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
                            <AvatarImage src={interview.workerAvatar || "/placeholder.svg"} />
                            <AvatarFallback>{interview.workerName[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <SheetTitle className="text-lg">{interview.workerName}</SheetTitle>
                            <SheetDescription className="text-sm">{interview.jobTitle}</SheetDescription>
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
                                  {new Date(interview.scheduledAt).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                              <Clock className="h-5 w-5 text-primary" />
                              <div>
                                <p className="text-xs text-muted-foreground">Hora</p>
                                <p className="text-sm font-medium">
                                  {new Date(interview.scheduledAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                              <TypeIcon className="h-5 w-5 text-primary" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-muted-foreground">Tipo</p>
                                <p className="text-sm font-medium truncate">
                                  {TYPE_LABELS[interview.interviewType]}
                                  {interview.interviewType === "other" && interview.otherTypeDetail ? ` - ${interview.otherTypeDetail}` : ""}
                                </p>
                              </div>
                            </div>
                            {interview.workerPhone && (
                              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                <Phone className="h-5 w-5 text-primary" />
                                <div>
                                  <p className="text-xs text-muted-foreground">Teléfono</p>
                                  <p className="text-sm font-medium">{interview.workerPhone}</p>
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

                        {interview.status === "pending" && (
                          <div className="text-sm text-muted-foreground bg-amber-50 text-amber-700 p-3 rounded-lg">
                            Esperando a que el candidato confirme la cita desde el chat.
                          </div>
                        )}

                        <div className="space-y-2 pt-4">
                          <Button asChild className="w-full bg-transparent" variant="outline">
                            <Link href={`/profile/${interview.workerId}`}>Ver Perfil Completo</Link>
                          </Button>
                          <Button asChild className="w-full bg-transparent" variant="outline">
                            <Link href={`/messages?candidateId=${interview.workerId}`}>
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Enviar Mensaje
                            </Link>
                          </Button>
                          {interview.status === "confirmed" && (
                            <>
                              <Button
                                className="w-full bg-green-600 hover:bg-green-700"
                                disabled={isResolving}
                                onClick={() => handleResolve(interview.id, "approved")}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Candidato contratado
                              </Button>
                              <Button
                                variant="outline"
                                className="w-full"
                                disabled={isResolving}
                                onClick={() => handleResolve(interview.id, "not_hired")}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                No contratado
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>
                )
              })
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
