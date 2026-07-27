"use client"

import type React from "react"
import { useRef, useEffect, useState, useCallback } from "react" 
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Play,
  Heart,
  MessageCircle,
  Share2,
  MapPin,
  Mail,
  AlertCircle,
  X,
  Star,
  Bookmark,
  User,
  Volume2,
  VolumeX,
  ChevronUp,
  Send,
  Copy,
  Check,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { RatingSummary } from "@/components/rating-summary"
import { ReportContentDialog } from "@/components/report-content-dialog"
import type { Profile } from "@/lib/types"
import MuxPlayer from "@mux/mux-player-react"

interface VideoReelPlayerProps {
  profile: Profile
  videoUrl: string
  isActive: boolean
  onVideoEnd?: () => void
  onClose?: () => void
}

export function VideoReelPlayer({ profile, videoUrl, isActive, onVideoEnd, onClose }: VideoReelPlayerProps) {
  const router = useRouter()
  const muxPlayerRef = useRef<any>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showShareSheet, setShowShareSheet] = useState(false)
  const [showCommentSheet, setShowCommentSheet] = useState(false)
  const [commentText, setCommentText] = useState("")
  const [linkCopied, setLinkCopied] = useState(false)
  const [likeCount, setLikeCount] = useState(Math.floor(Math.random() * 50) + 10)
  const [progress, setProgress] = useState(0)

  // Progress bar update
  useEffect(() => {
    if (!isActive) return
    const interval = setInterval(() => {
      const player = muxPlayerRef.current
      if (player && player.duration) {
        setProgress((player.currentTime / player.duration) * 100)
      }
    }, 200)
    return () => clearInterval(interval)
  }, [isActive])

  useEffect(() => {
    const player = muxPlayerRef.current
    if (!player) return
    if (isActive) {
      setError(false)
      setIsLoading(true)
      player.muted = true
      setIsMuted(true)
      player.play?.().then(() => {
        setIsPlaying(true)
        setIsLoading(false)
      }).catch(() => {
        setIsLoading(false)
      })
    } else {
      player.pause?.()
      setIsPlaying(false)
    }
  }, [isActive])

  const togglePlay = useCallback(() => {
    if (error) return
    const player = muxPlayerRef.current
    if (!player) return
    if (player.paused) { player.play?.(); setIsPlaying(true) }
    else { player.pause?.(); setIsPlaying(false) }
  }, [error])

  const toggleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    const player = muxPlayerRef.current
    if (!player) return
    player.muted = !player.muted
    setIsMuted(player.muted)
  }, [])

  const handleLike = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setLiked(prev => {
      setLikeCount(c => prev ? c - 1 : c + 1)
      return !prev
    })
  }, [])

  const handleShare = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation()
    const shareUrl = `${window.location.origin}/profile/${profile.id}`
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile.display_name} - CamareroPorFavor`,
          text: `Mira el perfil profesional de ${profile.display_name} en CamareroPorFavor`,
          url: shareUrl,
        })
      } catch { /* user cancelled */ }
    } else {
      setShowShareSheet(true)
    }
  }, [profile])

  const handleCopyLink = useCallback(async () => {
    const shareUrl = `${window.location.origin}/profile/${profile.id}`
    await navigator.clipboard.writeText(shareUrl)
    setLinkCopied(true)
    setTimeout(() => { setLinkCopied(false); setShowShareSheet(false) }, 1500)
  }, [profile.id])

  const handleViewProfile = useCallback(() => {
    router.push(`/profile/${profile.id}?noVideo=true`)
  }, [router, profile.id])

  const handleContact = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    router.push(`/messages?candidateId=${profile.id}&candidateName=${encodeURIComponent(profile.display_name)}`)
  }, [router, profile])

  const handleRatings = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    router.push(`/profile/${profile.id}/ratings`)
  }, [router, profile.id])

  const profileLink = `/profile/${profile.id}?noVideo=true`

  return (
    <div className="relative h-screen w-full snap-start snap-always bg-black flex items-center justify-center">
      {/* Close Button */}
      <div className="absolute top-4 right-4 z-50">
        <Button
          size="icon"
          variant="ghost"
          className="h-10 w-10 rounded-full bg-black/40 backdrop-blur-md hover:bg-black/60 text-white"
          onClick={(e) => { e.stopPropagation(); handleViewProfile() }}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Progress bar at top */}
      <div className="absolute top-0 left-0 right-0 z-50 h-1 bg-white/20">
        <div
          className="h-full bg-primary transition-all duration-200 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="relative w-full h-full max-w-[100vw] lg:max-w-[500px] lg:mx-auto">
        {/* Mux Player */}
        <MuxPlayer
          ref={muxPlayerRef}
          playbackId={profile.mux_playback_id!}
          streamType="on-demand"
          autoPlay={isActive ? "muted" : false}
          muted={isMuted}
          loop
          playsInline
          preload={isActive ? "auto" : "metadata"}
          className="absolute inset-0 w-full h-full [--controls:none] [--media-object-fit:cover]"
          style={{ aspectRatio: "9/16", height: "100%", width: "100%", objectFit: "cover" } as React.CSSProperties}
          onPlay={() => { setIsPlaying(true); setIsLoading(false) }}
          onPause={() => setIsPlaying(false)}
          onError={() => { setError(true); setIsLoading(false) }}
          onCanPlay={() => setIsLoading(false)}
          onLoadedData={() => setIsLoading(false)}
          onEnded={() => onVideoEnd?.()}
        />

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70 pointer-events-none z-10" />

        {/* Error state */}
        {error && (
          <div className="absolute inset-0 w-full h-full bg-black flex items-center justify-center z-20">
            <div
              className="absolute inset-0 w-full h-full bg-cover bg-center opacity-20"
              style={{ backgroundImage: `url(${profile.avatar_url || "/placeholder.svg?height=800&width=600"})` }}
            />
            <div className="relative z-10 text-center text-white p-6">
              <AlertCircle className="h-14 w-14 mx-auto mb-4 text-red-400" />
              <h3 className="text-xl font-bold mb-2">Error al cargar el video</h3>
              <p className="text-sm text-white/70 mb-4">No se pudo reproducir el video de presentacion</p>
              <Button onClick={handleViewProfile} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Ver perfil completo
              </Button>
            </div>
          </div>
        )}

        {/* Loading spinner */}
        {isLoading && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-20">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-white/30 border-t-white mx-auto mb-3" />
              <p className="text-xs text-white/70">Cargando...</p>
            </div>
          </div>
        )}

        {/* Tap to play/pause */}
        {!error && (
          <div className="absolute inset-0 z-10" onClick={togglePlay}>
            {!isPlaying && !isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-black/40 backdrop-blur-md rounded-full p-5 animate-pulse">
                  <Play className="h-10 w-10 text-white fill-white" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========== RIGHT SIDE ACTION BAR ========== */}
        <div className="absolute bottom-32 right-3 flex flex-col items-center gap-5 z-30">
          {/* Profile avatar */}
          <Link href={profileLink} onClick={(e) => e.stopPropagation()}>
            <div className="relative">
              <Avatar className="h-12 w-12 border-2 border-white shadow-lg">
                <AvatarImage src={profile.avatar_url || "/placeholder.svg"} />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
                  {profile.display_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-primary rounded-full w-5 h-5 flex items-center justify-center border-2 border-black">
                <span className="text-[10px] text-primary-foreground font-bold">+</span>
              </div>
            </div>
          </Link>

          {/* Like */}
          <button
            className="flex flex-col items-center gap-1"
            onClick={handleLike}
          >
            <div className={`h-12 w-12 rounded-full flex items-center justify-center transition-all duration-200 ${liked ? "bg-red-500/20 scale-110" : "bg-white/15 backdrop-blur-sm hover:bg-white/25"}`}>
              <Heart className={`h-6 w-6 transition-all duration-200 ${liked ? "fill-red-500 text-red-500 scale-110" : "text-white"}`} />
            </div>
            <span className="text-white text-[11px] font-semibold">{likeCount}</span>
          </button>

          {/* Comment */}
          <button
            className="flex flex-col items-center gap-1"
            onClick={(e) => { e.stopPropagation(); setShowCommentSheet(true) }}
          >
            <div className="h-12 w-12 rounded-full bg-white/15 backdrop-blur-sm hover:bg-white/25 flex items-center justify-center transition-colors">
              <MessageCircle className="h-6 w-6 text-white" />
            </div>
            <span className="text-white text-[11px] font-semibold">{profile.total_ratings || 0}</span>
          </button>

          {/* Save / Bookmark */}
          <button
            className="flex flex-col items-center gap-1"
            onClick={(e) => { e.stopPropagation(); setSaved(s => !s) }}
          >
            <div className={`h-12 w-12 rounded-full flex items-center justify-center transition-all duration-200 ${saved ? "bg-primary/20 scale-110" : "bg-white/15 backdrop-blur-sm hover:bg-white/25"}`}>
              <Bookmark className={`h-6 w-6 transition-all duration-200 ${saved ? "fill-primary text-primary" : "text-white"}`} />
            </div>
            <span className="text-white text-[11px] font-semibold">Guardar</span>
          </button>

          {/* Share */}
          <button
            className="flex flex-col items-center gap-1"
            onClick={handleShare}
          >
            <div className="h-12 w-12 rounded-full bg-white/15 backdrop-blur-sm hover:bg-white/25 flex items-center justify-center transition-colors">
              <Share2 className="h-6 w-6 text-white" />
            </div>
            <span className="text-white text-[11px] font-semibold">Compartir</span>
          </button>

          {/* Mute/Unmute */}
          <button
            className="flex flex-col items-center gap-1"
            onClick={toggleMute}
          >
            <div className="h-10 w-10 rounded-full bg-white/15 backdrop-blur-sm hover:bg-white/25 flex items-center justify-center transition-colors">
              {isMuted ? <VolumeX className="h-5 w-5 text-white" /> : <Volume2 className="h-5 w-5 text-white" />}
            </div>
          </button>

          {/* Report content */}
          <div className="flex flex-col items-center gap-1">
            <ReportContentDialog
              contentType="video"
              contentId={profile.id}
              reportedUserId={profile.id}
              triggerClassName="h-10 w-10 rounded-full bg-white/15 backdrop-blur-sm hover:bg-white/25 text-white"
              triggerVariant="ghost"
              triggerSize="icon"
            />
            <span className="text-white/60 text-[10px]">Reportar</span>
          </div>
        </div>

        {/* ========== BOTTOM PROFILE INFO + CTAs ========== */}
        <div className="absolute bottom-6 left-3 right-20 z-30">
          {/* Name + Rating */}
          <Link href={profileLink}>
            <div className="flex items-center gap-2.5 mb-2">
              <h3 className="font-bold text-lg text-white drop-shadow-lg">{profile.display_name}</h3>
              <div className="flex items-center gap-1 bg-black/30 backdrop-blur-sm rounded-full px-2 py-0.5">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span className="text-white text-xs font-semibold">{profile.rating?.toFixed(1) || "0.0"}</span>
              </div>
            </div>
          </Link>

          {/* Location */}
          {profile.location && (
            <div className="flex items-center gap-1.5 mb-1.5">
              <MapPin className="h-3.5 w-3.5 text-white/80" />
              <span className="text-white/80 text-xs">{profile.location}</span>
            </div>
          )}

          {/* Bio */}
          {profile.bio && (
            <p className="text-white/90 text-sm line-clamp-2 mb-3 leading-relaxed drop-shadow">{profile.bio}</p>
          )}

          {/* Action buttons row */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-full px-4 h-9 shadow-lg"
              onClick={handleContact}
            >
              <Mail className="h-4 w-4 mr-1.5" />
              Contactar
            </Button>

            <Button
              size="sm"
              variant="outline"
              className="bg-white/15 backdrop-blur-sm border-white/30 text-white hover:bg-white/25 rounded-full px-4 h-9"
              onClick={(e) => { e.stopPropagation(); handleViewProfile() }}
            >
              <User className="h-4 w-4 mr-1.5" />
              Ver perfil
            </Button>

            <Button
              size="sm"
              variant="outline"
              className="bg-white/15 backdrop-blur-sm border-white/30 text-white hover:bg-white/25 rounded-full px-3 h-9"
              onClick={handleRatings}
            >
              <Star className="h-4 w-4 mr-1.5" />
              Reseñar
            </Button>
          </div>

          {/* Swipe up hint */}
          <div className="flex items-center justify-center gap-1 mt-3 opacity-60">
            <ChevronUp className="h-3.5 w-3.5 text-white animate-bounce" />
            <span className="text-white text-[10px]">Desliza para ver más</span>
          </div>
        </div>
      </div>

      {/* ========== SHARE BOTTOM SHEET ========== */}
      {showShareSheet && (
        <div className="fixed inset-0 z-[60]" onClick={() => setShowShareSheet(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="absolute bottom-0 left-0 right-0 bg-zinc-900 rounded-t-2xl p-5 animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-zinc-600 rounded-full mx-auto mb-5" />
            <h3 className="text-white font-bold text-lg mb-4">Compartir perfil</h3>
            <div className="grid grid-cols-4 gap-4 mb-5">
              <button
                className="flex flex-col items-center gap-2"
                onClick={() => {
                  window.open(`https://wa.me/?text=${encodeURIComponent(`Mira el perfil de ${profile.display_name} en CamareroPorFavor: ${window.location.origin}/profile/${profile.id}`)}`, "_blank")
                  setShowShareSheet(false)
                }}
              >
                <div className="h-14 w-14 rounded-full bg-green-600 flex items-center justify-center">
                  <svg className="h-7 w-7 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                </div>
                <span className="text-white/80 text-[11px]">WhatsApp</span>
              </button>

              <button
                className="flex flex-col items-center gap-2"
                onClick={() => {
                  window.open(`https://t.me/share/url?url=${encodeURIComponent(`${window.location.origin}/profile/${profile.id}`)}&text=${encodeURIComponent(`Mira el perfil de ${profile.display_name} en CamareroPorFavor`)}`, "_blank")
                  setShowShareSheet(false)
                }}
              >
                <div className="h-14 w-14 rounded-full bg-[#01A89E] flex items-center justify-center">
                  <Send className="h-7 w-7 text-white" />
                </div>
                <span className="text-white/80 text-[11px]">Telegram</span>
              </button>

              <button
                className="flex flex-col items-center gap-2"
                onClick={() => {
                  window.open(`mailto:?subject=${encodeURIComponent(`Perfil de ${profile.display_name} en CamareroPorFavor`)}&body=${encodeURIComponent(`${window.location.origin}/profile/${profile.id}`)}`, "_blank")
                  setShowShareSheet(false)
                }}
              >
                <div className="h-14 w-14 rounded-full bg-zinc-600 flex items-center justify-center">
                  <Mail className="h-7 w-7 text-white" />
                </div>
                <span className="text-white/80 text-[11px]">Email</span>
              </button>

              <button
                className="flex flex-col items-center gap-2"
                onClick={handleCopyLink}
              >
                <div className="h-14 w-14 rounded-full bg-zinc-600 flex items-center justify-center">
                  {linkCopied ? <Check className="h-7 w-7 text-green-400" /> : <Copy className="h-7 w-7 text-white" />}
                </div>
                <span className="text-white/80 text-[11px]">{linkCopied ? "Copiado" : "Copiar"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== COMMENT BOTTOM SHEET ========== */}
      {showCommentSheet && (
        <div className="fixed inset-0 z-[60]" onClick={() => setShowCommentSheet(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="absolute bottom-0 left-0 right-0 bg-zinc-900 rounded-t-2xl p-5 animate-in slide-in-from-bottom duration-300 max-h-[60vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-zinc-600 rounded-full mx-auto mb-4" />
            <h3 className="text-white font-bold text-lg mb-4">Comentarios</h3>

            {/* Placeholder comments */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 min-h-[120px]">
              <div className="flex gap-3">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="bg-zinc-700 text-white text-xs">MR</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-white text-sm"><span className="font-semibold">Maria R.</span>{" "}Excelente profesional, muy recomendable!</p>
                  <span className="text-white/50 text-xs">Hace 2h</span>
                </div>
              </div>
              <div className="flex gap-3">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="bg-zinc-700 text-white text-xs">JL</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-white text-sm"><span className="font-semibold">Juan L.</span>{" "}Gran video de presentacion, se nota la experiencia.</p>
                  <span className="text-white/50 text-xs">Hace 5h</span>
                </div>
              </div>
              <div className="flex gap-3">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="bg-zinc-700 text-white text-xs">AS</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-white text-sm"><span className="font-semibold">Ana S.</span>{" "}Trabaje con esta persona, 100% fiable.</p>
                  <span className="text-white/50 text-xs">Hace 1d</span>
                </div>
              </div>
            </div>

            {/* Comment input */}
            <div className="flex items-center gap-2 pt-3 border-t border-zinc-700">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Escribe un comentario..."
                className="flex-1 bg-zinc-800 text-white rounded-full px-4 py-2.5 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <Button
                size="icon"
                className="h-10 w-10 rounded-full bg-primary hover:bg-primary/90"
                disabled={!commentText.trim()}
                onClick={() => { setCommentText(""); setShowCommentSheet(false) }}
              >
                <Send className="h-4 w-4 text-primary-foreground" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
