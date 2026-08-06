"use client"

import { GraduationCap, Plus, Trash2 } from "lucide-react" 
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import type { Education } from "@/lib/profile-constants"

interface EducationSectionProps {
  education: Education[]
  addEducation: () => void
  removeEducation: (id: string) => void
  updateEducation: (id: string, field: string, value: string) => void
}

export function EducationSection({ education, addEducation, removeEducation, updateEducation }: EducationSectionProps) {
  return (
    <Card className="border-0 shadow-sm overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-[#01A89E]/10 to-transparent pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-[#01A89E]" />
          Formacion y Certificaciones
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {education.map((edu, idx) => (
          <div key={edu.id} className="relative border border-gray-100 rounded-xl p-4 bg-gray-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold text-gray-400">Formacion {idx + 1}</span>
              <button type="button" onClick={() => removeEducation(edu.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-[13px] text-gray-500">Centro / Institucion</Label>
                <Input value={edu.institution} onChange={(e) => updateEducation(edu.id, "institution", e.target.value)} placeholder="Universidad, academia..." className="mt-1" />
              </div>
              <div>
                <Label className="text-[13px] text-gray-500">Titulo / Certificacion</Label>
                <Input value={edu.title} onChange={(e) => updateEducation(edu.id, "title", e.target.value)} placeholder="Grado, master, curso..." className="mt-1" />
              </div>
              <div>
                <Label className="text-[13px] text-gray-500">Ano</Label>
                <Input type="number" min="1970" max="2030" value={edu.year} onChange={(e) => updateEducation(edu.id, "year", e.target.value)} placeholder="2024" className="mt-1" />
              </div>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addEducation} className="w-full gap-1.5">
          <Plus className="w-4 h-4" /> Anadir formacion
        </Button>
      </CardContent>
    </Card>
  )
}
