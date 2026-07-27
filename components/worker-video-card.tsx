"use client"

import { Badge } from "@/components/ui/badge" 
import { MapPin, Star, Play } from "lucide-react"
import Link from "next/link"
import { useRef, useState, useEffect } from "react"
import MuxPlayer from "@mux/mux-player-react"

interface WorkerVideoCardProps {
  id: string
  name: string
  category: string
  location: string
  rating: number
  videoUrl?: string
  muxPlaybackId?: string | null
  experience: string
}

export function WorkerVideoCard({ id, name, category, location, rating, muxPlaybackId, videoUrl, experience }: WorkerVideoCardProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  // IntersectionObserver: autoplay only when card is in viewport
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

  const thumbnailSrc = muxPlaybackId
    ? `https://image.mux.com/${muxPlaybackId}/thumbnail.webp?width=400&height=534&fit_mode=smartcrop&time=2`
    : (videoUrl || "/placeholder.svg?height=400&width=300")

  return (
    <Link href={muxPlaybackId ? `/reels?worker=${id}` : `/profile/${id}`}>
      <div ref={containerRef} className="relative aspect-[3/4] overflow-hidden rounded-xl shadow-lg bg-black">
        {/* Mux autoplay preview when visible, static thumbnail as poster/fallback */}
        {muxPlaybackId && isVisible ? (
          <MuxPlayer
            playbackId={muxPlaybackId}
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
            alt={name}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        )}

        {/* Play icon */}
        <div className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <Play className="h-4 w-4 text-white fill-white" />
        </div>

        {/* Gradient overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0.3) 40%, rgba(0,0,0,0))" }}
        />

        {/* Category badge */}
        <div className="absolute top-3 left-3 pointer-events-none">
          <Badge className="bg-primary/90 text-primary-foreground text-[10px] backdrop-blur-sm">{category}</Badge>
        </div>

        {/* Info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3.5 space-y-1.5 pointer-events-none">
          <h3 className="font-bold text-white text-base leading-tight">{name}</h3>
          <p className="text-white/70 text-[11px]">{experience}</p>
          <div className="flex items-center gap-2 text-white/90 text-xs">
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold">{rating.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-1 min-w-0 flex-1">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{location}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
