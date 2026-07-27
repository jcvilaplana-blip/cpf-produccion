"use client"

import { useRef, useState } from "react"
import { Image as ImageIcon, Upload, X, Loader2 } from "lucide-react" 
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

interface PortfolioSectionProps {
  images: string[]
  onImagesChange: (images: string[]) => void
  maxImages?: number
}

export function PortfolioSection({ images = [], onImagesChange, maxImages = 3 }: PortfolioSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const currentImages = Array.isArray(images) ? images.filter(Boolean) : []

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    if (currentImages.length + files.length > maxImages) {
      toast.error(`Maximo ${maxImages} imagenes`)
      return
    }

    setUploading(true)
    const newUrls: string[] = []

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        toast.error("Solo se permiten imagenes")
        continue
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Cada imagen debe ser menor a 5MB")
        continue
      }

      try {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("type", "portfolio")

        const res = await fetch("/api/upload", { method: "POST", body: formData })
        if (!res.ok) throw new Error("Error al subir")
        
        const { url } = await res.json()
        newUrls.push(url)
      } catch {
        toast.error(`Error al subir ${file.name}`)
      }
    }

    if (newUrls.length > 0) {
      onImagesChange([...currentImages, ...newUrls])
      toast.success(`${newUrls.length} imagen(es) subida(s)`)
    }
    setUploading(false)
    if (inputRef.current) inputRef.current.value = ""
  }

  const removeImage = (index: number) => {
    const updated = currentImages.filter((_, i) => i !== index)
    onImagesChange(updated)
  }

  return (
    <Card className="border-0 shadow-sm overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-[#01A89E]/10 to-transparent pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-[#01A89E]" />
          Portfolio de Imagenes ({currentImages.length}/{maxImages})
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid grid-cols-3 gap-3">
          {currentImages.map((url, index) => (
            <div key={index} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group">
              <img src={url} alt={`Portfolio ${index + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-1.5 right-1.5 bg-black/60 hover:bg-black/80 p-1 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          
          {currentImages.length < maxImages && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="aspect-square border-2 border-dashed border-gray-300 hover:border-[#01A89E] rounded-xl flex flex-col items-center justify-center gap-1 transition-colors group disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="w-5 h-5 text-[#01A89E] animate-spin" />
              ) : (
                <>
                  <Upload className="w-5 h-5 text-gray-400 group-hover:text-[#01A89E]" />
                  <span className="text-[10px] text-gray-400">Añadir</span>
                </>
              )}
            </button>
          )}
        </div>
        
        <p className="text-xs text-gray-400 mt-3">JPG, PNG. Maximo 5MB por imagen</p>
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
      </CardContent>
    </Card>
  )
}
