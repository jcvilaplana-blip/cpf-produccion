"use client"

import { Briefcase, Plus, Trash2 } from "lucide-react" 
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import type { WorkExperience } from "@/lib/profile-constants"

interface ExperienceSectionProps {
  workExperience: WorkExperience[]
  addExperience: () => void
  removeExperience: (id: string) => void
  updateExperience: (id: string, field: string, value: any) => void
}

export function ExperienceSection({ workExperience, addExperience, removeExperience, updateExperience }: ExperienceSectionProps) {
  return (
    <Card className="border-0 shadow-sm overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-[#01A89E]/10 to-transparent pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-[#01A89E]" />
          Experiencia Laboral
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {workExperience.map((exp, idx) => (
          <div key={exp.id} className="relative border border-gray-100 rounded-xl p-4 bg-gray-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold text-gray-400">Experiencia {idx + 1}</span>
              <button type="button" onClick={() => removeExperience(exp.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-[13px] text-gray-500">Empresa</Label>
                <Input value={exp.company} onChange={(e) => updateExperience(exp.id, "company", e.target.value)} placeholder="Nombre de la empresa" className="mt-1" />
              </div>
              <div>
                <Label className="text-[13px] text-gray-500">Puesto</Label>
                <Input value={exp.position} onChange={(e) => updateExperience(exp.id, "position", e.target.value)} placeholder="Tu puesto" className="mt-1" />
              </div>
              <div>
                <Label className="text-[13px] text-gray-500">Fecha inicio</Label>
                <Input type="month" value={exp.startDate} onChange={(e) => updateExperience(exp.id, "startDate", e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-[13px] text-gray-500">Fecha fin</Label>
                <Input type="month" value={exp.endDate} onChange={(e) => updateExperience(exp.id, "endDate", e.target.value)} disabled={exp.current} className="mt-1" />
                <label className="flex items-center gap-1.5 mt-1.5">
                  <input type="checkbox" checked={exp.current} onChange={(e) => updateExperience(exp.id, "current", e.target.checked)} className="rounded border-gray-300" />
                  <span className="text-[13px] text-gray-500">Actualmente aqui</span>
                </label>
              </div>
            </div>
            <div>
              <Label className="text-[13px] text-gray-500">Descripcion</Label>
              <Textarea value={exp.description} onChange={(e) => updateExperience(exp.id, "description", e.target.value)} placeholder="Describe tus responsabilidades y logros..." rows={3} className="mt-1 resize-none" />
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addExperience} className="w-full gap-1.5">
          <Plus className="w-4 h-4" /> Anadir experiencia
        </Button>
      </CardContent>
    </Card>
  )
}
