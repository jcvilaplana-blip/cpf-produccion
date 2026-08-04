"use client"

import { useEffect, useRef, useState } from "react"
import { Pause, Play, X } from "lucide-react"

interface PortfolioVideoViewerProps {
  videos: string[]
  reel?: boolean
}

export function PortfolioVideoViewer({ videos = [], reel = false }: PortfolioVideoViewerProps) {
  const [activeVideo, setActiveVideo] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const items = Array.isArray(videos) ? videos.filter(Boolean) : []

  useEffect(() => {
    if (!activeVideo || !videoRef.current) return
    videoRef.current.pause()
    setIsPlaying(false)
  }, [activeVideo])

  const togglePlayback = () => {
    if (!videoRef.current) return
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {})
      setIsPlaying(true)
    } else {
      videoRef.current.pause()
      setIsPlaying(false)
    }
  }

  if (items.length === 0) return null

  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {items.map((url, index) => (
          <button
            key={index}
            type="button"
            onClick={() => setActiveVideo(url)}
            className="relative aspect-[9/16] rounded-lg overflow-hidden bg-black group"
          >
            <video src={url} muted preload="metadata" className="w-full h-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
              <div className="bg-white/90 rounded-full p-2.5">
                <Play className="w-4 h-4 text-black" fill="black" />
              </div>
            </div>
          </button>
        ))}
      </div>

      {activeVideo && (
        <div className="fixed inset-0 z-[60] bg-black flex items-center justify-center p-4">
          <button
            type="button"
            onClick={() => setActiveVideo(null)}
            className="absolute top-4 right-4 z-10 bg-white/10 hover:bg-white/20 rounded-full p-2 text-white transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="relative w-full max-w-3xl aspect-[9/16]">
            <video
              ref={videoRef}
              src={activeVideo}
              muted
              playsInline
              className="w-full h-full object-cover rounded-3xl bg-black"
            />
            <button
              type="button"
              onClick={togglePlayback}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="rounded-full bg-black/50 p-4">
                {isPlaying ? <Pause className="h-6 w-6 text-white" /> : <Play className="h-6 w-6 text-white" />}
              </div>
            </button>
          </div>
        </div>
      )}
    </>
  )
}
