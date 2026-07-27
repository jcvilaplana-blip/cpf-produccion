"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MapPin, Star, Play } from "lucide-react"
import Link from "next/link"
import { useRef, useState, useEffect } from "react"
import MuxPlayer from "@mux/mux-player-react"

interface CandidateVideoCardProps {
  candidate: {
    id: string
    display_name: string
    avatar_url: string | null
    location: string | null
    rating: number
    total_ratings: number
    mux_playback_id: string | null
  }
}

export function CandidateVideoCard({ candidate }: CandidateVideoCardProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const thumbnailSrc = candidate.mux_playback_id
    ? `https://image.mux.com/${candidate.mux_playback_id}/thumbnail.webp?width=300&height=400&fit_mode=smartcrop&time=2`
    : (candidate.avatar_url || "/placeholder.svg?height=400&width=300")

  return (
    <Link href={candidate.mux_playback_id ? `/reels?worker=${candidate.id}` : `/profile/${candidate.id}`} className="block">
      <div ref={containerRef} className="relative aspect-[3/4] overflow-hidden rounded-xl shadow-md bg-black">
        {/* Mux autoplay preview when visible */}
        {candidate.mux_playback_id && isVisible ? (
          <MuxPlayer
            playbackId={candidate.mux_playback_id}
            autoPlay="muted"
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full"
            style={{
              aspectRatio: "3/4",
              width: "100%",
              height: "100%",
              objectFit: "cover",
              "--controls": "none",
              "--media-object-fit": "cover",
              "--media-object-position": "center",
            } as React.CSSProperties}
          />
        ) : (
          <img
            src={thumbnailSrc}
            alt={candidate.display_name}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
            draggable={false}
          />
        )}

        {/* Play icon */}
        <div className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <Play className="h-4 w-4 text-white fill-white" />
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

        {/* Info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3 pointer-events-none">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Avatar className="h-8 w-8 border-2 border-white shrink-0">
              <AvatarImage src={candidate.avatar_url || "/placeholder.svg"} />
              <AvatarFallback>{candidate.display_name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold truncate text-white">{candidate.display_name}</h3>
              <div className="flex items-center gap-1 text-xs text-white">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span>{candidate.rating.toFixed(1)}</span>
                <span className="text-white/70">({candidate.total_ratings})</span>
              </div>
            </div>
          </div>
          {candidate.location && (
            <div className="flex items-center gap-1 text-xs text-white/90">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{candidate.location}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
