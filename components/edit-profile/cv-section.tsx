"use client"

import { useRef, useState } from "react"
import { FileText, Upload, X, Loader2, ExternalLink } from "lucide-react" 
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

interface CvSectionProps {
  cvFileName: string
  cvUrl: string
  onCvUploaded: (url: string, filename: string) => void
  onRemoveCv: () => void
}

export function CvSection({ cvFileName, cvUrl, onCvUploaded, onRemoveCv }: CvSectionProps) {
  const cvInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.includes("pdf")) {
      toast.error("Solo se permiten archivos PDF")
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("El archivo no puede superar 10MB")
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", "cv")

      const res = await fetch("/api/upload", { method: "POST", body: formData })
      if (!res.ok) throw new Error("Error al subir")
      
      const { url } = await res.json()
      onCvUploaded(url, file.name)
      toast.success("CV subido correctamente")
    } catch {
      toast.error("Error al subir el CV")
    } finally {
      setUploading(false)
      if (cvInputRef.current) cvInputRef.current.value = ""
    }
  }

  return (
    <Card className="border-0 shadow-sm overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-[#01A89E]/10 to-transparent pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#01A89E]" />
          Curriculum Vitae (CV)
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {cvFileName || cvUrl ? (
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-red-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{cvFileName || "CV.pdf"}</p>
              <p className="text-[13px] text-gray-400">PDF subido</p>
            </div>
            {cvUrl && (
              <a href={cvUrl} target="_blank" rel="noopener noreferrer" className="text-[#01A89E] hover:text-[#018F86]">
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
            <button type="button" onClick={onRemoveCv} className="text-gray-400 hover:text-red-500">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => cvInputRef.current?.click()}
            disabled={uploading}
            className="w-full border-2 border-dashed border-gray-300 hover:border-[#01A89E] rounded-xl py-8 flex flex-col items-center gap-2 transition-colors group disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="w-5 h-5 text-[#01A89E] animate-spin" />
            ) : (
              <Upload className="w-5 h-5 text-gray-400 group-hover:text-[#01A89E]" />
            )}
            <span className="text-sm text-gray-600">{uploading ? "Subiendo..." : "Sube tu CV en PDF"}</span>
            <span className="text-[13px] text-gray-400">Maximo 10MB</span>
          </button>
        )}
        <input ref={cvInputRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={handleUpload} />
      </CardContent>
    </Card>
  )
}
