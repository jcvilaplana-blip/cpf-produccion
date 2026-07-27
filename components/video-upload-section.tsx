"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, Video, X, Loader2, CheckCircle, AlertCircle, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { Progress } from "@/components/ui/progress"

interface VideoUploadSectionProps {
  userId: string
  currentVideoUrl?: string
  currentPlaybackId?: string
  currentVideoStatus?: string
  profileType?: "worker" | "business"
  onUploadComplete?: (url: string) => void
}

export function VideoUploadSection({
  userId,
  currentVideoUrl,
  currentPlaybackId,
  currentVideoStatus = "none",
  profileType = "worker",
  onUploadComplete,
}: VideoUploadSectionProps) {
  const [status, setStatus] = useState<string>(currentVideoStatus)
  const [playbackId, setPlaybackId] = useState<string | null>(currentPlaybackId || null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Poll for status while processing
  useEffect(() => {
    if (status === "processing" || status === "uploading") {
      pollIntervalRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/mux/status?type=${profileType}`)
          const data = await res.json()

          if (data.status === "ready" && data.playbackId) {
            setStatus("ready")
            setPlaybackId(data.playbackId)
            onUploadComplete?.(`https://stream.mux.com/${data.playbackId}.m3u8`)
            toast.success("Video procesado correctamente")
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
          } else if (data.status === "error") {
            setStatus("error")
            setError("Error al procesar el video")
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
          } else {
            setStatus(data.status)
          }
        } catch {
          // Silently retry
        }
      }, 3000)
    }

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
    }
  }, [status, profileType, onUploadComplete])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("video/")) {
      setError("Por favor selecciona un archivo de video valido")
      return
    }

    if (file.size > 200 * 1024 * 1024) {
      setError("El video no puede superar los 200MB")
      return
    }

    setIsUploading(true)
    setError(null)
    setUploadProgress(0)
    setStatus("uploading")

    try {
      // Step 1: Get direct upload URL from our API
      const res = await fetch("/api/mux/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileType }),
      })

      if (!res.ok) throw new Error("Error al crear la subida")

      const { uploadUrl } = await res.json()

      // Step 2: Upload file directly to Mux using PUT
      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100)
          setUploadProgress(percent)
        }
      })

      await new Promise<void>((resolve, reject) => {
        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve()
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`))
          }
        })
        xhr.addEventListener("error", () => reject(new Error("Upload failed")))
        xhr.open("PUT", uploadUrl)
        xhr.send(file)
      })

      setStatus("processing")
      setIsUploading(false)
      toast.success("Video subido. Procesando...")
    } catch (err) {
      console.error("Error uploading video:", err)
      setError("Error al subir el video. Intentalo de nuevo.")
      setStatus("error")
      setIsUploading(false)
    }
  }

  const handleRemoveVideo = async () => {
    try {
      const res = await fetch(`/api/mux/status?type=${profileType}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Error al eliminar")

      setStatus("none")
      setPlaybackId(null)
      onUploadComplete?.("")
      toast.success("Video eliminado")
    } catch (err) {
      console.error("Error removing video:", err)
      setError("Error al eliminar el video")
    }
  }

  const thumbnailUrl = playbackId
    ? `https://image.mux.com/${playbackId}/thumbnail.webp?width=480&height=854&fit_mode=smartcrop`
    : null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5" />
          Video Reel Profesional
        </CardTitle>
        <CardDescription>
          Sube un video corto (max. 60 segundos) mostrando tus habilidades. Los videos se procesan automaticamente con
          streaming adaptativo de alta calidad.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Ready state - show thumbnail and player */}
        {status === "ready" && playbackId && (
          <div className="relative aspect-[9/16] max-w-xs mx-auto bg-black rounded-lg overflow-hidden">
            {thumbnailUrl ? (
              <img
                src={thumbnailUrl}
                alt="Video thumbnail"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white">
                <CheckCircle className="h-12 w-12" />
              </div>
            )}
            <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-400" />
              Video listo
            </div>
            <Button
              size="icon"
              variant="destructive"
              className="absolute top-2 right-2"
              onClick={handleRemoveVideo}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Processing state */}
        {status === "processing" && (
          <div className="border-2 border-dashed rounded-lg p-8 text-center space-y-4">
            <div className="flex flex-col items-center gap-4">
              <div className="bg-primary/10 p-4 rounded-full">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
              <div>
                <p className="font-medium mb-1">Procesando video...</p>
                <p className="text-sm text-muted-foreground">
                  Mux esta optimizando tu video para streaming. Esto puede tardar 1-2 minutos.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Uploading state */}
        {status === "uploading" && isUploading && (
          <div className="border-2 border-dashed rounded-lg p-8 text-center space-y-4">
            <div className="flex flex-col items-center gap-4">
              <div className="bg-primary/10 p-4 rounded-full">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <div className="w-full max-w-xs">
                <p className="font-medium mb-2">Subiendo video... {uploadProgress}%</p>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            </div>
          </div>
        )}

        {/* Empty state - upload form */}
        {(status === "none" || status === "error") && !isUploading && (
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className={`p-4 rounded-full ${status === "error" ? "bg-destructive/10" : "bg-primary/10"}`}>
                {status === "error" ? (
                  <AlertCircle className="h-8 w-8 text-destructive" />
                ) : (
                  <Upload className="h-8 w-8 text-primary" />
                )}
              </div>
              <div>
                <p className="font-medium mb-1">
                  {status === "error" ? "Error al procesar el video" : "Sube tu video reel"}
                </p>
                <p className="text-sm text-muted-foreground">MP4, MOV o WebM (max. 200MB)</p>
              </div>
              <label htmlFor="video-upload">
                <Button asChild>
                  <span className="cursor-pointer">
                    {status === "error" ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reintentar
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Seleccionar Video
                      </>
                    )}
                  </span>
                </Button>
              </label>
              <input
                id="video-upload"
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          </div>
        )}

        {error && <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">{error}</div>}

        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-medium">Consejos para un buen video reel:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Manten el video entre 15-60 segundos</li>
            <li>Muestra tus habilidades en accion</li>
            <li>Usa buena iluminacion y audio claro</li>
            <li>Se profesional pero autentico</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
