"use client"

import { useRef, useState } from "react"
import { Video, Upload, X, Loader2, Play, CheckCircle } from "lucide-react" 
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"

interface VideoItem {
  url?: string
  playbackId?: string
  status: "none" | "uploading" | "processing" | "ready" | "error"
}

interface AdditionalVideosSectionProps {
  videos: VideoItem[]
  onVideosChange: (videos: VideoItem[]) => void
  maxVideos?: number
}

export function AdditionalVideosSection({ videos = [], onVideosChange, maxVideos = 2 }: AdditionalVideosSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)
  const [progress, setProgress] = useState(0)
  
  // Ensure we have an array
  const currentVideos: VideoItem[] = Array.isArray(videos) ? videos : []
  
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("video/")) {
      toast.error("Selecciona un archivo de video valido")
      return
    }
    if (file.size > 200 * 1024 * 1024) {
      toast.error("El video no puede superar 200MB")
      return
    }

    const index = currentVideos.length
    setUploadingIndex(index)
    setProgress(0)

    // Add placeholder
    const newVideos = [...currentVideos, { status: "uploading" as const }]
    onVideosChange(newVideos)

    try {
      // Get upload URL from API
      const res = await fetch("/api/mux/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileType: "worker", videoType: "additional", index }),
      })

      if (!res.ok) throw new Error("Error al crear la subida")
      const { uploadUrl } = await res.json()

      // Upload to Mux
      const xhr = new XMLHttpRequest()
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          setProgress(Math.round((event.loaded / event.total) * 100))
        }
      })

      await new Promise<void>((resolve, reject) => {
        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve()
          else reject(new Error(`Upload failed: ${xhr.status}`))
        })
        xhr.addEventListener("error", () => reject(new Error("Upload failed")))
        xhr.open("PUT", uploadUrl)
        xhr.send(file)
      })

      // Update to processing
      const updatedVideos = [...currentVideos]
      updatedVideos[index] = { status: "processing" }
      onVideosChange(updatedVideos)

      toast.success("Video subido. Procesando...")

      // Poll for status (simplified - in production you'd want a more robust solution)
      const pollStatus = async () => {
        for (let i = 0; i < 60; i++) {
          await new Promise(r => setTimeout(r, 3000))
          try {
            const statusRes = await fetch(`/api/mux/status?type=worker&videoType=additional&index=${index}`)
            const statusData = await statusRes.json()
            if (statusData.status === "ready" && statusData.playbackId) {
              const finalVideos = [...currentVideos]
              finalVideos[index] = { status: "ready", playbackId: statusData.playbackId }
              onVideosChange(finalVideos)
              toast.success("Video listo")
              return
            }
          } catch {}
        }
      }
      pollStatus()

    } catch (err) {
      toast.error("Error al subir el video")
      // Remove failed upload
      onVideosChange(currentVideos.filter((_, i) => i !== index))
    } finally {
      setUploadingIndex(null)
      setProgress(0)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  const removeVideo = async (index: number) => {
    try {
      await fetch(`/api/mux/status?type=worker&videoType=additional&index=${index}`, { method: "DELETE" })
      onVideosChange(currentVideos.filter((_, i) => i !== index))
      toast.success("Video eliminado")
    } catch {
      toast.error("Error al eliminar")
    }
  }

  const getThumbnail = (playbackId: string) => 
    `https://image.mux.com/${playbackId}/thumbnail.webp?width=320&height=180&fit_mode=smartcrop`

  return (
    <Card className="border-0 shadow-sm overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-[#01A89E]/10 to-transparent pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Video className="w-4 h-4 text-[#01A89E]" />
          Videos Adicionales ({currentVideos.filter(v => v.status === "ready").length}/{maxVideos})
        </CardTitle>
        <p className="text-xs text-gray-500 mt-1">Estos videos solo se muestran en tu perfil, no en los Video Reels</p>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid grid-cols-2 gap-3">
          {currentVideos.map((video, index) => (
            <div key={index} className="relative aspect-video rounded-xl overflow-hidden bg-gray-100">
              {video.status === "ready" && video.playbackId && (
                <>
                  <img src={getThumbnail(video.playbackId)} alt={`Video ${index + 1}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-black/40 rounded-full p-2">
                      <Play className="w-4 h-4 text-white" fill="white" />
                    </div>
                  </div>
                  <div className="absolute bottom-1 left-1 bg-emerald-500 text-white text-[9px] px-1.5 py-0.5 rounded flex items-center gap-0.5">
                    <CheckCircle className="w-2.5 h-2.5" /> Listo
                  </div>
                  <button
                    type="button"
                    onClick={() => removeVideo(index)}
                    className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 p-1 rounded-full text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </>
              )}
              
              {video.status === "uploading" && (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-blue-50">
                  <Upload className="w-5 h-5 text-blue-500" />
                  <span className="text-xs text-blue-600">Subiendo... {progress}%</span>
                  <Progress value={progress} className="h-1.5 w-3/4" />
                </div>
              )}
              
              {video.status === "processing" && (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-amber-50">
                  <Loader2 className="w-5 h-5 text-amber-600 animate-spin" />
                  <span className="text-xs text-amber-700">Procesando...</span>
                </div>
              )}
            </div>
          ))}
          
          {currentVideos.length < maxVideos && uploadingIndex === null && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="aspect-video border-2 border-dashed border-gray-300 hover:border-[#01A89E] rounded-xl flex flex-col items-center justify-center gap-1 transition-colors group"
            >
              <Upload className="w-5 h-5 text-gray-400 group-hover:text-[#01A89E]" />
              <span className="text-xs text-gray-400">Añadir video</span>
            </button>
          )}
        </div>
        
        <p className="text-xs text-gray-400 mt-3">MP4, MOV, WebM. Maximo 200MB por video</p>
        <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={handleUpload} />
      </CardContent>
    </Card>
  )
}
