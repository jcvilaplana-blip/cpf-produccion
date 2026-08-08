"use client"

import { useRef, useState } from "react"
import { Video, Upload, X, Loader2, Play } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

interface PortfolioVideosSectionProps {
  videos: string[]
  onVideosChange: (videos: string[]) => void
  maxVideos?: number
}

function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video")
    video.preload = "metadata"
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src)
      resolve(video.duration)
    }
    video.onerror = () => {
      URL.revokeObjectURL(video.src)
      reject(new Error("No se pudo leer el video"))
    }
    video.src = URL.createObjectURL(file)
  })
}

export function PortfolioVideosSection({ videos = [], onVideosChange, maxVideos = 3 }: PortfolioVideosSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const currentVideos = Array.isArray(videos) ? videos.filter(Boolean) : []

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    if (currentVideos.length + files.length > maxVideos) {
      toast.error(`Maximo ${maxVideos} videos`)
      if (inputRef.current) inputRef.current.value = ""
      return
    }

    setUploading(true)
    const newUrls: string[] = []

    for (const file of files) {
      if (!file.type.startsWith("video/")) {
        toast.error("Solo se permiten videos")
        continue
      }
      if (file.size > 100 * 1024 * 1024) {
        toast.error(`El video ${file.name} no puede superar 100MB`)
        continue
      }

      try {
        const duration = await getVideoDuration(file)
        if (duration > 60) {
          toast.error(`El video ${file.name} no puede superar 1 minuto de duracion`)
          continue
        }
      } catch {
        toast.error(`No se pudo leer el video ${file.name}`)
        continue
      }

      try {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("type", "video")

        const res = await fetch("/api/upload", { method: "POST", body: formData })
        if (!res.ok) throw new Error("Error al subir")

        const { url } = await res.json()
        newUrls.push(url)
      } catch {
        toast.error(`Error al subir ${file.name}`)
      }
    }

    if (newUrls.length > 0) {
      onVideosChange([...currentVideos, ...newUrls])
      toast.success(`${newUrls.length} video(s) subido(s)`)
    }
    setUploading(false)
    if (inputRef.current) inputRef.current.value = ""
  }

  const removeVideo = (index: number) => {
    onVideosChange(currentVideos.filter((_, i) => i !== index))
  }

  return (
    <Card className="border-0 shadow-sm overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-[#01A89E]/10 to-transparent pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Video className="w-4 h-4 text-[#01A89E]" />
          Portfolio de Videos ({currentVideos.length}/{maxVideos})
        </CardTitle>
        <p className="text-[13px] text-gray-500 mt-1">
          El primero es tu vídeo de presentación y abre tu perfil; el resto
          aparecen en "Más vídeos". Solo se reproducen si la empresa pulsa.
        </p>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid grid-cols-2 gap-3">
          {currentVideos.map((url, index) => (
            <div key={index} className="relative aspect-video rounded-xl overflow-hidden bg-black group">
              {/* `#t=0.1` fuerza a los navegadores móviles a pintar el primer
                  fotograma. Sin él, el recuadro se quedaba en negro y no había
                  forma de distinguir un vídeo de otro. */}
              <video
                src={`${url}#t=0.1`}
                muted
                playsInline
                preload="metadata"
                className="w-full h-full object-cover"
              />
              {/* Cuál es cuál. Aquí se veían todos como una lista plana, así
                  que quien subía dos no entendía por qué su perfil público
                  enseñaba uno como presentación y sólo el otro en "Más
                  vídeos". */}
              <span className="absolute bottom-1.5 left-1.5 rounded-full bg-black/70 px-2 py-0.5 text-[11px] font-medium text-white">
                {index === 0 ? "Presentación" : "Adicional"}
              </span>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-black/40 rounded-full p-2">
                  <Play className="w-4 h-4 text-white" fill="white" />
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeVideo(index)}
                className="absolute top-1.5 right-1.5 bg-black/60 hover:bg-black/80 p-1 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}

          {currentVideos.length < maxVideos && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="aspect-video border-2 border-dashed border-gray-300 hover:border-[#01A89E] rounded-xl flex flex-col items-center justify-center gap-1 transition-colors group disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="w-5 h-5 text-[#01A89E] animate-spin" />
              ) : (
                <>
                  <Upload className="w-5 h-5 text-gray-400 group-hover:text-[#01A89E]" />
                  <span className="text-[13px] text-gray-400">Añadir video</span>
                </>
              )}
            </button>
          )}
        </div>

        <p className="text-[13px] text-gray-400 mt-3">MP4, WebM o MOV. Maximo 1 minuto y 100MB por video</p>
        <input ref={inputRef} type="file" accept="video/*" multiple className="hidden" onChange={handleUpload} />
      </CardContent>
    </Card>
  )
}
