"use client"

import { useRef } from "react"
import { Camera } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface MediaSectionProps {
  avatarPreview: string | null
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export function MediaSection({ avatarPreview, onAvatarChange }: MediaSectionProps) {
  const avatarInputRef = useRef<HTMLInputElement>(null)

  return (
    <Card className="border-0 shadow-sm overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-[#01A89E]/10 to-transparent pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Camera className="w-4 h-4 text-[#01A89E]" />
          Foto de Perfil
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
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
      </CardContent>
    </Card>
  )
}
