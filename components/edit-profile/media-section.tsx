"use client"

import { useRef, useState, useEffect } from "react"
import { Camera, Video, Upload, X, AlertCircle, Loader2, CheckCircle, RefreshCw } from "lucide-react" 
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"

interface MediaSectionProps {
  avatarPreview: string | null
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  videoPreview: string | null
  onVideoChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemoveVideo: () => void
  videoError: string
  muxPlaybackId?: string | null
  videoStatus?: string
}

export function MediaSection({
  avatarPreview,
  onAvatarChange,
  videoPreview,
  onVideoChange,
  onRemoveVideo,
  videoError,
  muxPlaybackId: initialPlaybackId,
  videoStatus: initialVideoStatus = "none",
}: MediaSectionProps) {
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const [muxStatus, setMuxStatus] = useState<string>(initialVideoStatus)
  const [muxPlaybackId, setMuxPlaybackId] = useState<string | null>(initialPlaybackId || null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  // Poll for Mux processing status
  useEffect(() => {
    if (muxStatus === "processing" || muxStatus === "uploading") {
      pollRef.current = setInterval(async () => {
        try {
          const res = await fetch("/api/mux/status?type=worker")
          const data = await res.json()
          if (data.status === "ready" && data.playbackId) {
            setMuxStatus("ready")
            setMuxPlaybackId(data.playbackId)
            toast.success("Video procesado correctamente")
            if (pollRef.current) clearInterval(pollRef.current)
          } else if (data.status === "error") {
            setMuxStatus("error")
            if (pollRef.current) clearInterval(pollRef.current)
          }
        } catch { /* retry silently */ }
      }, 3000)
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [muxStatus])

  const handleMuxUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("video/")) {
      toast.error("Selecciona un archivo de video valido")
      return
    }
    if (file.size > 200 * 1024 * 1024) {
      toast.error("El video no puede superar los 200MB")
      return
    }

    setIsUploading(true)
    setUploadProgress(0)
    setMuxStatus("uploading")

    try {
      // Get direct upload URL from our API
      const res = await fetch("/api/mux/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileType: "worker" }),
      })

      if (!res.ok) throw new Error("Error al crear la subida")
      const { uploadUrl } = await res.json()

      // Upload directly to Mux
      const xhr = new XMLHttpRequest()
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          setUploadProgress(Math.round((event.loaded / event.total) * 100))
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

      setMuxStatus("processing")
      setIsUploading(false)
      toast.success("Video subido. Procesando...")
    } catch (err) {
      console.error("Mux upload error:", err)
      toast.error("Error al subir el video")
      setMuxStatus("error")
      setIsUploading(false)
    }
  }

  const handleRemoveMuxVideo = async () => {
    try {
      const res = await fetch("/api/mux/status?type=worker", { method: "DELETE" })
      if (!res.ok) throw new Error("Error al eliminar")
      setMuxStatus("none")
      setMuxPlaybackId(null)
      onRemoveVideo()
      toast.success("Video eliminado")
    } catch {
      toast.error("Error al eliminar el video")
    }
  }

  const thumbnailUrl = muxPlaybackId
    ? `https://image.mux.com/${muxPlaybackId}/thumbnail.webp?width=480&height=270&fit_mode=smartcrop`
    : null

  // Determine if we should show the Mux flow or the legacy flow
  const hasMuxVideo = muxStatus === "ready" && muxPlaybackId
  const isMuxProcessing = muxStatus === "processing"
  const isMuxUploading = muxStatus === "uploading" && isUploading
  const showLegacyVideo = !hasMuxVideo && !isMuxProcessing && !isMuxUploading && videoPreview && muxStatus === "none"

  return (
    <Card className="border-0 shadow-sm overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-[#01A89E]/10 to-transparent pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Camera className="w-4 h-4 text-[#01A89E]" />
          Foto y Video de Presentacion
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-5">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            className="relative w-28 h-28 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 hover:border-[#01A89E] transition-colors overflow-hidden group"
          >
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <Camera className="w-6 h-6 text-gray-400 group-hover:text-[#01A89E]" />
                <span className="text-[10px] text-gray-400 mt-1">Subir foto</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="w-5 h-5 text-white" />
            </div>
          </button>
          <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={onAvatarChange} />
          <p className="text-xs text-gray-500">JPG, PNG. Recomendado 400x400px</p>
        </div>

        {/* Video */}
        <div>
          <Label className="text-sm font-medium mb-2 flex items-center gap-1.5">
            <Video className="w-4 h-4 text-[#01A89E]" />
            Video de Presentacion (max. 1 minuto)
          </Label>

          {/* Mux Ready */}
          {hasMuxVideo && (
            <div className="relative rounded-xl overflow-hidden bg-black">
              <img
                src={thumbnailUrl!}
                alt="Video thumbnail"
                className="w-full max-h-56 object-cover"
              />
              <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-400" />
                Video con streaming HLS
              </div>
              <button
                type="button"
                onClick={handleRemoveMuxVideo}
                className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 p-1.5 rounded-full text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Mux Processing */}
          {isMuxProcessing && (
            <div className="w-full border-2 border-dashed border-[#01A89E]/50 rounded-xl py-10 flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-[#01A89E] animate-spin" />
              <span className="text-sm text-gray-600 font-medium">Procesando video...</span>
              <span className="text-xs text-gray-400">Mux esta optimizando tu video. Esto puede tardar 1-2 minutos.</span>
            </div>
          )}

          {/* Mux Uploading */}
          {isMuxUploading && (
            <div className="w-full border-2 border-dashed border-[#01A89E]/50 rounded-xl py-10 flex flex-col items-center gap-3 px-6">
              <Upload className="w-8 h-8 text-[#01A89E]" />
              <span className="text-sm text-gray-600 font-medium">Subiendo video... {uploadProgress}%</span>
              <Progress value={uploadProgress} className="h-2 w-full max-w-xs" />
            </div>
          )}

          {/* Legacy video migration prompt */}
          {showLegacyVideo && (
            <div className="relative rounded-xl overflow-hidden bg-muted p-6 text-center space-y-3">
              <p className="text-sm text-muted-foreground font-medium">Tienes un video antiguo. Sube uno nuevo para optimizarlo con Mux.</p>
              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                <Upload className="w-4 h-4" />
                Subir nuevo video
              </button>
              <button
                type="button"
                onClick={onRemoveVideo}
                className="block mx-auto text-xs text-muted-foreground hover:text-destructive transition-colors mt-2"
              >
                Eliminar video antiguo
              </button>
            </div>
          )}

          {/* Empty state - upload button */}
          {!hasMuxVideo && !isMuxProcessing && !isMuxUploading && !showLegacyVideo && (
            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-300 hover:border-[#01A89E] rounded-xl py-10 flex flex-col items-center gap-2 transition-colors group"
            >
              <div className="w-12 h-12 rounded-full bg-[#01A89E]/10 flex items-center justify-center group-hover:bg-[#01A89E]/20 transition-colors">
                {muxStatus === "error" ? (
                  <RefreshCw className="w-5 h-5 text-[#01A89E]" />
                ) : (
                  <Upload className="w-5 h-5 text-[#01A89E]" />
                )}
              </div>
              <span className="text-sm text-gray-600 font-medium">
                {muxStatus === "error" ? "Reintentar subida de video" : "Sube tu video de presentacion"}
              </span>
              <span className="text-xs text-gray-400">MP4, MOV, WebM. Maximo 200MB</span>
            </button>
          )}

          {/* File input that triggers Mux upload */}
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={handleMuxUpload}
          />

          {videoError && (
            <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {videoError}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
