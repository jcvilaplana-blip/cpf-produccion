"use client"

import { FileText } from "lucide-react" 
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface PersonalSectionProps {
  displayName: string; setDisplayName: (v: string) => void
  email: string
  phone: string; setPhone: (v: string) => void
  dateOfBirth: string; setDateOfBirth: (v: string) => void
  location: string; setLocation: (v: string) => void
  bio: string; setBio: (v: string) => void
}

export function PersonalSection(p: PersonalSectionProps) {
  return (
    <Card className="border-0 shadow-sm overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-[#01A89E]/10 to-transparent pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#01A89E]" />
          Datos Personales
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="displayName" className="text-xs font-medium text-gray-600">Nombre completo *</Label>
            <Input id="displayName" value={p.displayName} onChange={(e) => p.setDisplayName(e.target.value)} placeholder="Tu nombre completo" className="mt-1" />
          </div>
          <div>
            <Label htmlFor="email" className="text-xs font-medium text-gray-600">Email</Label>
            <Input id="email" value={p.email} readOnly className="mt-1 bg-gray-50 text-gray-500 cursor-not-allowed" />
          </div>
          <div>
            <Label htmlFor="phone" className="text-xs font-medium text-gray-600">Teléfono</Label>
            <Input id="phone" type="tel" value={p.phone} onChange={(e) => p.setPhone(e.target.value)} placeholder="+34 612 345 678" className="mt-1" />
          </div>
          <div>
            <Label htmlFor="dob" className="text-xs font-medium text-gray-600">Fecha de nacimiento</Label>
            <Input id="dob" type="date" value={p.dateOfBirth} onChange={(e) => p.setDateOfBirth(e.target.value)} className="mt-1" />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="location" className="text-xs font-medium text-gray-600">Ciudad</Label>
            <Input id="location" value={p.location} readOnly className="mt-1 bg-gray-50 text-gray-500 cursor-not-allowed" placeholder="Registrada al crear cuenta" />
          </div>
        </div>
        <div>
          <Label htmlFor="bio" className="text-xs font-medium text-gray-600">Sobre mí</Label>
          <Textarea id="bio" value={p.bio} onChange={(e) => p.setBio(e.target.value)} placeholder="Cuéntanos sobre ti, tu experiencia y lo que te apasiona..." rows={4} className="mt-1 resize-none" />
        </div>
      </CardContent>
    </Card>
  )
}
