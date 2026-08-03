"use client"

import { useState } from "react"
import { Play, X } from "lucide-react"

interface PortfolioVideoViewerProps {
  videos: string[]
}

export function PortfolioVideoViewer({ videos = [] }: PortfolioVideoViewerProps) {
  const [activeVideo, setActiveVideo] = useState<string | null>(null)
  const items = Array.isArray(videos) ? videos.filter(Boolean) : []

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
        <div className="fixed inset-0 z-[60] bg-black flex items-center justify-center">
          <button
            type="button"
            onClick={() => setActiveVideo(null)}
            className="absolute top-4 right-4 z-10 bg-white/10 hover:bg-white/20 rounded-full p-2 text-white transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-6 h-6" />
          </button>
          <video
            src={activeVideo}
            controls
            autoPlay
            playsInline
            className="w-full h-full max-h-screen object-contain"
          />
        </div>
      )}
    </>
  )
}
