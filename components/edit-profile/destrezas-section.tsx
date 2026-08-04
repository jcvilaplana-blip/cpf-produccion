"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { ChefHat } from "lucide-react"

// Skill/task taxonomy from the spec - distinct from "Especialidades"
// (profiles.specialties), which holds role/subcategory names and feeds the
// candidate<->job matching engine (lib/matching.ts). Mixing the two would
// break 1.1/2.1/7.2, so this is its own field (profiles.skills).
export const DESTREZAS_LIST = [
  "Barra", "Sala", "Bandeja", "Coctelería", "Cocina fría", "Cocina caliente",
  "Parrilla", "Plancha", "Ayudante", "Limpieza",
]

interface DestrezasSectionProps {
  skills: string[]
  toggleSkill: (v: string) => void
}

export function DestrezasSection({ skills, toggleSkill }: DestrezasSectionProps) {
  return (
    <Card className="border-0 shadow-sm overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-[#01A89E]/10 to-transparent pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ChefHat className="w-4 h-4 text-[#01A89E]" />
          Destrezas
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-2">
        <Label className="text-xs font-medium text-gray-600 block">¿Qué tareas dominas?</Label>
        <div className="flex flex-wrap gap-2">
          {DESTREZAS_LIST.map((skill) => (
            <button
              key={skill}
              type="button"
              onClick={() => toggleSkill(skill)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                skills.includes(skill)
                  ? "bg-[#01A89E] text-white border-[#01A89E]"
                  : "bg-white text-gray-600 border-gray-200 hover:border-[#01A89E]"
              }`}
            >
              {skill}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
