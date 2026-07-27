"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  ArrowLeft, MapPin, Star, Play, Briefcase, MessageCircle, Heart,
  Globe, Clock, Award, Video, Image as ImageIcon, Loader2, FileText
} from "lucide-react"
import { useState, useEffect } from "react"
import useSWR from "swr"
import MuxPlayer from "@mux/mux-player-react"

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function ProfileDetailContent({ id }: { id: string }) {
  const router = useRouter()
  const [liked, setLiked] = useState(false)
  const [showVideo, setShowVideo] = useState(false)
  const [activeImage, setActiveImage] = useState<string | null>(null)

  // Fetch real profile data from Supabase
  const { data: profileData, isLoading } = useSWR(`/api/profile/${id}`, fetcher)
  const worker = profileData?.data

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#01A89E]" />
      </div>
    )
  }

  if (!worker) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-20">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Perfil no encontrado</h1>
          <p className="text-muted-foreground mb-4">Este perfil no existe o fue eliminado.</p>
          <Button asChild><Link href="/candidates">Ver candidatos</Link></Button>
        </div>
      </div>
    )
  }

  const specialties = (() => {
    try {
      if (Array.isArray(worker.specialties)) return worker.specialties
      if (typeof worker.specialties === "string") return JSON.parse(worker.specialties)
      return []
    } catch { return [] }
  })()
  const languages = (() => {
    try {
      let raw = worker.languages
      if (typeof raw === "string") raw = JSON.parse(raw)
      if (!Array.isArray(raw)) return []
      return raw.map((l: any) =>
        typeof l === "string" ? l : [l.name || l.language, l.level].filter(Boolean).join(" - ")
      )
    } catch { return [] }
  })()
  const contractTypes = (() => {
    try {
      if (Array.isArray(worker.contract_type_sought)) return worker.contract_type_sought
      if (typeof worker.contract_type_sought === "string") return JSON.parse(worker.contract_type_sought)
      return []
    } catch { return [] }
  })()
  const portfolioImages = Array.isArray(worker.portfolio_images) ? worker.portfolio_images : []

  const availabilityMap: Record<string, { label: string; color: string }> = {
    available: { label: "Disponible", color: "bg-emerald-100 text-emerald-700" },
    busy: { label: "Ocupado", color: "bg-amber-100 text-amber-700" },
    not_looking: { label: "No busca empleo", color: "bg-slate-100 text-slate-600" },
  }
  const avail = availabilityMap[worker.availability_status] || { label: "No indicado", color: "bg-slate-100 text-slate-600" }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero - Video reel or avatar */}
      <div className="relative w-full aspect-[9/12] max-h-[50vh] bg-black overflow-hidden">
        {worker.mux_playback_id && showVideo ? (
          <MuxPlayer
            playbackId={worker.mux_playback_id}
            autoPlay="muted"
            loop
            muted
            className="w-full h-full [&>mux-player]:w-full [&>mux-player]:h-full"
            style={{ aspectRatio: "9/16", width: "100%", height: "100%", objectFit: "cover", "--controls": "none" } as any}
            thumbnailTime={2}
          />
        ) : worker.mux_playback_id ? (
          <div className="w-full h-full relative cursor-pointer group" onClick={() => setShowVideo(true)}>
            <img
              src={`https://image.mux.com/${worker.mux_playback_id}/thumbnail.webp?time=2&width=800`}
              alt={worker.display_name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
              <div className="h-20 w-20 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                <Play className="h-9 w-9 text-[#01A89E] ml-1" fill="#01A89E" />
              </div>
            </div>
          </div>
        ) : worker.avatar_url ? (
          <img src={worker.avatar_url} alt={worker.display_name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#01A89E]/20 to-[#01A89E]/5 flex items-center justify-center">
            <div className="h-28 w-28 rounded-full bg-white/80 flex items-center justify-center text-4xl font-bold text-[#01A89E]">
              {(worker.display_name || "?")[0]?.toUpperCase()}
            </div>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 pointer-events-none" />

        <div className="absolute top-4 left-4 z-10">
          <Button variant="ghost" size="icon" className="bg-black/40 text-white hover:bg-black/60 rounded-full" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>

        <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
          <Button
            variant="ghost" size="icon"
            className={`rounded-full ${liked ? "bg-red-500 text-white" : "bg-black/40 text-white hover:bg-black/60"}`}
            onClick={() => setLiked(!liked)}
          >
            <Heart className={`h-5 w-5 ${liked ? "fill-white" : ""}`} />
          </Button>
        </div>

        {/* Status badges */}
        <div className="absolute top-14 left-4 flex flex-col gap-1.5 z-10">
          {worker.is_premium && (
            <Badge className="bg-[#F5A623]/90 text-white border-0 text-xs px-2.5 py-1">
              <Award className="h-3.5 w-3.5 mr-1" /> Premium
            </Badge>
          )}
          {worker.video_status === "ready" && (
            <Badge className="bg-[#01A89E]/90 text-white border-0 text-xs px-2.5 py-1">
              <Video className="h-3.5 w-3.5 mr-1" /> Video Reel
            </Badge>
          )}
        </div>

        <div className="absolute bottom-4 left-4 right-4 z-10 text-white">
          <h1 className="text-2xl font-bold">{worker.display_name}</h1>
          <p className="text-white/80 text-sm">{worker.job_category || "Sin categoría"}</p>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Quick stats */}
        <div className="flex items-center gap-3 flex-wrap">
          <Badge className={`${avail.color} border-0 text-xs px-2.5 py-1`}>{avail.label}</Badge>
          {worker.rating > 0 && (
            <div className="flex items-center gap-1">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              <span className="font-bold text-lg">{worker.rating}</span>
            </div>
          )}
          {worker.location && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-4 w-4" /><span className="text-sm">{worker.location}</span>
            </div>
          )}
          {worker.experience_years > 0 && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Briefcase className="h-4 w-4" /><span className="text-sm">{worker.experience_years} años exp.</span>
            </div>
          )}
        </div>

        {/* CTA Buttons */}
        <div className="flex gap-3">
          {worker.mux_playback_id && (
            <Button
              onClick={() => { window.scrollTo({ top: 0, behavior: "smooth" }); setShowVideo(true) }}
              className="flex-1 h-12 rounded-xl bg-[#01A89E] hover:bg-[#018F86] text-white font-bold"
            >
              <Play className="h-4 w-4 mr-2" fill="white" /> Ver Video Reel
            </Button>
          )}
          <Button
            variant="outline"
            className="flex-1 h-12 rounded-xl font-bold"
            onClick={() => router.push(`/messages?candidateId=${worker.id}&candidateName=${encodeURIComponent(worker.display_name)}`)}
          >
            <MessageCircle className="h-4 w-4 mr-2" /> Contactar
          </Button>
        </div>

        {/* Bio */}
        {worker.bio && (
          <Card><CardContent className="p-4">
            <h3 className="font-semibold mb-2">Sobre mí</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{worker.bio}</p>
          </CardContent></Card>
        )}

        {/* Specialties */}
        {specialties.length > 0 && (
          <Card><CardContent className="p-4">
            <h3 className="font-semibold mb-3">Especialidades</h3>
            <div className="flex flex-wrap gap-2">
              {specialties.map((s: string, i: number) => (
                <Badge key={i} variant="secondary" className="rounded-full px-3 py-1 bg-[#01A89E]/10 text-[#01A89E] border-0">{s}</Badge>
              ))}
            </div>
          </CardContent></Card>
        )}

        {/* Details */}
        <Card><CardContent className="p-4 space-y-3">
          <h3 className="font-semibold mb-2">Detalles</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-muted-foreground block">Categoría</span><span className="font-medium">{worker.job_category || "-"}</span></div>
            <div><span className="text-muted-foreground block">Experiencia</span><span className="font-medium">{worker.experience_years ? `${worker.experience_years} años` : "-"}</span></div>
            <div><span className="text-muted-foreground block">Ubicación</span><span className="font-medium">{worker.location || "-"}</span></div>
            <div><span className="text-muted-foreground block">Nivel</span><span className="font-medium">{worker.level ? `Nivel ${worker.level}` : "-"}</span></div>
            <div><span className="text-muted-foreground block">Puntos</span><span className="font-medium">{worker.points ?? "-"}</span></div>
            <div><span className="text-muted-foreground block">Valoración</span><span className="font-medium flex items-center gap-1">{worker.rating || "-"} {worker.rating > 0 && <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />}</span></div>
          </div>
        </CardContent></Card>

        {/* Languages */}
        {languages.length > 0 && (
          <Card><CardContent className="p-4">
            <h3 className="font-semibold mb-2 flex items-center gap-1.5">
              <Globe className="h-4 w-4 text-[#01A89E]" /> Idiomas
            </h3>
            <div className="flex flex-wrap gap-2">
              {languages.map((l: string, i: number) => (
                <Badge key={i} variant="outline" className="rounded-full px-3 py-1">{l}</Badge>
              ))}
            </div>
          </CardContent></Card>
        )}

        {/* Contract types */}
        {contractTypes.length > 0 && (
          <Card><CardContent className="p-4">
            <h3 className="font-semibold mb-2 flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-[#01A89E]" /> Tipo de contrato buscado
            </h3>
            <div className="flex flex-wrap gap-2">
              {contractTypes.map((ct: string, i: number) => (
                <Badge key={i} variant="secondary" className="rounded-full px-3 py-1">{ct}</Badge>
              ))}
            </div>
          </CardContent></Card>
        )}

        {/* CV */}
        {worker.cv_url && (
          <Card><CardContent className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-[#01A89E]" /> Currículum
            </h3>
            <Button asChild variant="outline" className="w-full rounded-xl">
              <a href={worker.cv_url} target="_blank" rel="noopener noreferrer">
                {worker.cv_filename || "Descargar CV"}
              </a>
            </Button>
          </CardContent></Card>
        )}

        {/* Portfolio images */}
        {portfolioImages.length > 0 && (
          <Card><CardContent className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-1.5">
              <ImageIcon className="h-4 w-4 text-[#01A89E]" /> Portfolio ({portfolioImages.length}/5)
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {portfolioImages.map((img: string, i: number) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(img)}
                  className="aspect-square rounded-xl overflow-hidden border bg-slate-50 hover:opacity-80 transition-opacity"
                >
                  <img src={img} alt={`Portfolio ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </CardContent></Card>
        )}
      </div>

      {/* Full image lightbox */}
      {activeImage && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setActiveImage(null)}>
          <img src={activeImage} alt="Portfolio" className="max-w-full max-h-full rounded-lg" />
        </div>
      )}
    </div>
  )
}
