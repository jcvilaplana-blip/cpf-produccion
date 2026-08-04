"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"
import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { requestToWorkHereAction } from "@/lib/actions"
import { toast } from "sonner"
import { PortfolioImageViewer } from "@/components/portfolio-image-viewer"
import { PortfolioVideoViewer } from "@/components/portfolio-video-viewer"
import {
  ArrowLeft, MapPin, Star, Briefcase, CheckCircle, MessageCircle, Heart,
  Send, X, Loader2, Phone, Globe, Clock, Sparkles,
  Image as ImageIcon, Video as VideoIcon,
} from "lucide-react"

interface BusinessData {
  id: string
  display_name: string
  type: string
  location: string
  rating: number
  activeJobs: number
  logo: string
  verified: boolean
  description: string
  source: "supabase"
  phone?: string
  website?: string
  city?: string
  address?: string
  company_description?: string
  service_description?: string
  photos?: string[]
  video_url?: string | null
  latitude?: number | null
  longitude?: number | null
}

export function BusinessDetailContent({ id }: { id: string }) {
  const router = useRouter()
  const [business, setBusiness] = useState<BusinessData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showContactForm, setShowContactForm] = useState(false)
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [jobs, setJobs] = useState<any[]>([])
  const [isFavorite, setIsFavorite] = useState(false)
  const [favoriteLoading, setFavoriteLoading] = useState(false)
  const [isPremiumWorker, setIsPremiumWorker] = useState(false)
  const [requestingToWork, setRequestingToWork] = useState(false)
  const [requestedToWork, setRequestedToWork] = useState(false)

  const loadBusiness = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: bp } = await supabase.from("business_profiles").select("*").eq("id", id).single()
      if (bp) {
        const { data: profile } = await supabase.from("profiles").select("display_name, location, rating, total_ratings, phone").eq("id", id).single()
        const { data: jobsData } = await supabase.from("jobs").select("*").eq("business_id", id).eq("is_active", true).order("created_at", { ascending: false })
        setBusiness({
          id: bp.id, display_name: bp.company_name || profile?.display_name || "Empresa",
          type: bp.business_type || "General", location: bp.city || bp.address || profile?.location || "Espana",
          rating: profile?.rating || 4.5, activeJobs: jobsData?.length || 0,
          logo: bp.company_logo_url || "/images/companies/el-gourmet.jpg", verified: bp.verified || false,
          description: bp.company_description || bp.service_description || "", source: "supabase",
          phone: bp.phone || profile?.phone, website: bp.website, city: bp.city, address: bp.address,
          company_description: bp.company_description, service_description: bp.service_description,
          photos: Array.isArray(bp.photos) ? bp.photos : [],
          video_url: bp.video_url || null,
          latitude: bp.latitude || null,
          longitude: bp.longitude || null,
        })
        setJobs(jobsData || [])
        setLoading(false)
        return
      }
    } catch { /* fall through */ }
    setBusiness(null)
    setLoading(false)
  }, [id])

  useEffect(() => { loadBusiness() }, [loadBusiness])

  useEffect(() => {
    const checkFavorite = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) return
      const [{ data: saved }, { data: profile }] = await Promise.all([
        supabase.from("saved_businesses").select("id").eq("user_id", user.id).eq("business_id", id).maybeSingle(),
        supabase.from("profiles").select("user_type, is_premium, premium_expires_at").eq("id", user.id).single(),
      ])
      setIsFavorite(!!saved)
      const premiumActive =
        profile?.user_type === "worker" &&
        profile?.is_premium &&
        (!profile?.premium_expires_at || new Date(profile.premium_expires_at) > new Date())
      setIsPremiumWorker(!!premiumActive)
    }
    checkFavorite()
  }, [id])

  const handleRequestToWork = async () => {
    setRequestingToWork(true)
    try {
      const result = await requestToWorkHereAction(id)
      if (result.error) {
        toast.error(result.error)
      } else {
        setRequestedToWork(true)
        toast.success("Le hemos avisado a la empresa de tu interés")
      }
    } finally {
      setRequestingToWork(false)
    }
  }

  const handleToggleFavorite = async () => {
    setFavoriteLoading(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) { router.push(`/auth/login?redirect=/business/${id}`); return }

      if (isFavorite) {
        await supabase.from("saved_businesses").delete().eq("user_id", user.id).eq("business_id", id)
        setIsFavorite(false)
      } else {
        await supabase.from("saved_businesses").insert({ user_id: user.id, business_id: id })
        setIsFavorite(true)
      }
    } finally {
      setFavoriteLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!message.trim()) return
    setSending(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) { router.push(`/auth/login?redirect=/business/${id}`); return }
      const { data: existingConv } = await supabase.from("conversations").select("id")
        .or(`and(participant_1.eq.${user.id},participant_2.eq.${id}),and(participant_1.eq.${id},participant_2.eq.${user.id})`).single()
      let conversationId = existingConv?.id
      if (!conversationId) {
        const { data: newConv } = await supabase.from("conversations").insert({ participant_1: user.id, participant_2: id, last_message: message.trim(), last_message_at: new Date().toISOString() }).select("id").single()
        conversationId = newConv?.id
      }
      if (conversationId) {
        await supabase.from("messages").insert({ conversation_id: conversationId, sender_id: user.id, receiver_id: id, content: message.trim(), read: false })
        await supabase.from("conversations").update({ last_message: message.trim(), last_message_at: new Date().toISOString() }).eq("id", conversationId)
        setSent(true); setMessage("")
        setTimeout(() => { setSent(false); setShowContactForm(false); router.push("/messages") }, 1500)
      }
    } catch {
      setSent(true); setMessage("")
      setTimeout(() => { setSent(false); setShowContactForm(false) }, 2000)
    } finally { setSending(false) }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center pb-20"><Loader2 className="h-8 w-8 animate-spin text-[#01A89E]" /></div>
  if (!business) return (
    <div className="min-h-screen flex items-center justify-center pb-20">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Empresa no encontrada</h1>
        <p className="text-muted-foreground mb-4">Esta empresa no existe o fue eliminada.</p>
        <Button asChild><Link href="/businesses">Ver empresas</Link></Button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background pb-24 md:pt-14">
      <div className="relative w-full h-56 overflow-hidden">
        <img src={business.logo} alt={business.display_name} className="w-full h-full object-cover" crossOrigin="anonymous" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-end gap-3">
            <Avatar className="h-20 w-20 border-4 border-white shadow-lg flex-shrink-0">
              <AvatarImage src={business.logo} alt={business.display_name} />
              <AvatarFallback className="text-2xl font-bold bg-[#01A89E] text-white">{business.display_name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-white text-balance drop-shadow-md">{business.display_name}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge variant="secondary" className="bg-white/90 text-foreground text-xs">{business.type}</Badge>
                {business.verified && <Badge className="gap-1 bg-green-500 text-white text-xs"><CheckCircle className="w-3 h-3" /> Verificada</Badge>}
              </div>
            </div>
          </div>
        </div>
        <div className="absolute top-4 left-4">
          <Button variant="ghost" size="icon" className="bg-white/80 hover:bg-white rounded-full shadow" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        <div className="flex items-center justify-around bg-muted/50 rounded-2xl py-3 px-2">
          <Link href={`/business/${id}/ratings`} className="flex flex-col items-center gap-0.5 hover:opacity-70 transition-opacity">
            <div className="flex items-center gap-1"><Star className="h-5 w-5 fill-yellow-400 text-yellow-400" /><span className="font-bold text-lg">{business.rating}</span></div>
            <span className="text-xs text-muted-foreground">Valoración</span>
          </Link>
          <div className="w-px h-8 bg-border" />
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              business.address || business.location || business.city || business.display_name
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-0.5 hover:opacity-70 transition-opacity"
          >
            <div className="flex items-center gap-1">
              <span className="font-bold text-sm text-[#01A89E]">Ver Mapa</span>
              <MapPin className="h-5 w-5 text-[#01A89E]" />
            </div>
            <span className="text-xs text-muted-foreground text-center">
              {(business.city || business.location || "").split(",")[0].trim()}
            </span>
          </a>
          <div className="w-px h-8 bg-border" />
          <Link
            href={`/business/${id}/jobs`}
            className="flex flex-col items-center gap-0.5 hover:opacity-70 transition-opacity"
          >
            <div className="flex items-center gap-1"><Briefcase className="h-5 w-5 text-[#E73A36]" /><span className="font-bold text-lg">{business.activeJobs}</span></div>
            <span className="text-xs text-muted-foreground">Ofertas</span>
          </Link>
        </div>

        <div className="flex gap-3">
          <Button className="flex-1 h-12 rounded-xl bg-[#01A89E] hover:bg-[#018F86] text-white font-bold text-sm" onClick={() => setShowContactForm(!showContactForm)}>
            <MessageCircle className="h-5 w-5 mr-2" /> Contactar
          </Button>
          <Button
            variant="outline"
            className={`flex-1 h-12 rounded-xl font-bold text-sm ${isFavorite ? "border-[#01A89E] text-[#01A89E] bg-[#01A89E]/5" : ""}`}
            onClick={handleToggleFavorite}
            disabled={favoriteLoading}
          >
            <Heart className={`h-5 w-5 mr-2 ${isFavorite ? "fill-[#01A89E]" : ""}`} /> Favorito
          </Button>
        </div>

        {isPremiumWorker && (
          <Button
            variant="outline"
            className="w-full h-12 rounded-xl font-bold text-sm border-[#F48221]/40 text-[#F48221] hover:bg-[#F48221]/5 disabled:opacity-60"
            onClick={handleRequestToWork}
            disabled={requestingToWork || requestedToWork}
          >
            <Sparkles className="h-5 w-5 mr-2" />
            {requestedToWork ? "Interés enviado" : requestingToWork ? "Enviando..." : "Quiero trabajar aquí"}
          </Button>
        )}

        {showContactForm && (
          <Card className="border-[#01A89E]/30 bg-teal-50/50">
            <CardContent className="p-4">
              {sent ? (
                <div className="text-center py-4">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3"><CheckCircle className="w-6 h-6 text-green-600" /></div>
                  <p className="font-semibold text-green-700">Mensaje enviado</p>
                  <p className="text-sm text-muted-foreground mt-1">Redirigiendo al chat...</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-sm">Enviar mensaje a {business.display_name}</h3>
                    <button onClick={() => setShowContactForm(false)} className="p-1 rounded-full hover:bg-gray-200"><X className="w-4 h-4" /></button>
                  </div>
                  <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Hola, me interesa trabajar con ustedes..." className="min-h-[100px] text-sm bg-white border-gray-200 rounded-xl mb-3 resize-none" />
                  <Button className="w-full h-11 rounded-xl bg-[#01A89E] hover:bg-[#018F86] text-white font-bold" onClick={handleSendMessage} disabled={sending || !message.trim()}>
                    {sending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando...</> : <><Send className="w-4 h-4 mr-2" /> Enviar mensaje</>}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}

        <Card><CardContent className="p-4"><h3 className="font-semibold mb-2 text-base">Sobre la empresa</h3><p className="text-sm text-muted-foreground leading-relaxed">{business.description || business.company_description || "Empresa registrada en la plataforma CamareroPorFavor."}</p></CardContent></Card>

        {business.service_description && (
          <Card><CardContent className="p-4">
            <h3 className="font-semibold mb-2 text-base">Tipo de servicio</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{business.service_description}</p>
          </CardContent></Card>
        )}

        {(business.phone || business.website || business.address) && (
          <Card><CardContent className="p-4 space-y-3">
            <h3 className="font-semibold text-base">Información de contacto</h3>
            {business.phone && <div className="flex items-center gap-3 text-sm"><Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" /><span>{business.phone}</span></div>}
            {business.website && <div className="flex items-center gap-3 text-sm"><Globe className="w-4 h-4 text-muted-foreground flex-shrink-0" /><a href={business.website} target="_blank" rel="noopener noreferrer" className="text-[#01A89E] hover:underline truncate">{business.website}</a></div>}
            {business.address && <div className="flex items-center gap-3 text-sm"><MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" /><span>{business.address}</span></div>}
          </CardContent></Card>
        )}

        {(business.address || business.location || business.city) && (
          <Card><CardContent className="p-4">
            <h3 className="font-semibold mb-3 text-base">Ubicación</h3>
            <div className="aspect-video w-full bg-muted rounded-lg overflow-hidden">
              <iframe
                src={
                  business.latitude && business.longitude
                    ? `https://www.google.com/maps/embed/v1/view?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&center=${business.latitude},${business.longitude}&zoom=15`
                    : `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(
                        business.address || business.location || business.city || business.display_name
                      )}`
                }
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </CardContent></Card>
        )}

        {business.photos && business.photos.length > 0 && (
          <Card><CardContent className="p-4">
            <h3 className="font-semibold mb-3 text-base flex items-center gap-1.5"><ImageIcon className="h-4 w-4 text-[#01A89E]" /> Fotos del local</h3>
            <PortfolioImageViewer images={business.photos} />
          </CardContent></Card>
        )}

        {business.video_url && (
          <Card><CardContent className="p-4">
            <h3 className="font-semibold mb-3 text-base flex items-center gap-1.5"><VideoIcon className="h-4 w-4 text-[#01A89E]" /> Vídeo del local</h3>
            <PortfolioVideoViewer videos={[business.video_url]} />
          </CardContent></Card>
        )}

        <Card id="ofertas-activas">
          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Briefcase className="w-5 h-5" /> Ofertas Activas ({jobs.length})</CardTitle></CardHeader>
          <CardContent>
            {jobs.length > 0 ? (
              <div className="space-y-3">
                {jobs.map((job: any) => (
                  <Link key={job.id} href={`/jobs/${job.id}`}>
                    <div className="p-3 border rounded-xl hover:bg-accent transition-colors">
                      <h4 className="font-semibold text-sm">{job.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{job.description}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs flex-wrap">
                        <span className="flex items-center gap-1 text-muted-foreground"><MapPin className="h-3 w-3" /> {job.location || job.city}</span>
                        {job.salary_min && job.salary_max && <Badge variant="secondary" className="text-xs">{job.salary_min}-{job.salary_max} EUR</Badge>}
                        {job.contract_type && <Badge variant="outline" className="text-xs">{job.contract_type}</Badge>}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8"><Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" /><p className="text-muted-foreground text-sm">No hay ofertas activas en este momento</p></div>
            )}
          </CardContent>
        </Card>

        <Card><CardContent className="p-4 space-y-3">
          <h3 className="font-semibold mb-2 text-base">Detalles</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted-foreground block text-xs">Sector</span><span className="font-medium">{business.type}</span></div>
            <div><span className="text-muted-foreground block text-xs">Ubicación</span><span className="font-medium">{business.location}</span></div>
            <div><span className="text-muted-foreground block text-xs">Valoración</span><span className="font-medium flex items-center gap-1">{business.rating} <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" /></span></div>
            <div><span className="text-muted-foreground block text-xs">Estado</span><span className="font-medium flex items-center gap-1">{business.verified ? <><CheckCircle className="w-3 h-3 text-green-500" /> Verificada</> : "Pendiente"}</span></div>
          </div>
        </CardContent></Card>
      </div>
    </div>
  )
}
