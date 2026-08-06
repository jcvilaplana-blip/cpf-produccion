"use client"

import { useState } from "react"
import { Plus, X, CheckCircle2 } from "lucide-react" 
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SKILL_SUGGESTIONS } from "@/lib/profile-constants"

interface SkillsSectionProps {
  skills: string[]
  addSkill: (s: string) => void
  removeSkill: (s: string) => void
}

export function SkillsSection({ skills, addSkill, removeSkill }: SkillsSectionProps) {
  const [newSkill, setNewSkill] = useState("")

  const handleAdd = (s: string) => {
    addSkill(s)
    setNewSkill("")
  }

  return (
    <Card className="border-0 shadow-sm overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-[#01A89E]/10 to-transparent pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#01A89E]" />
          Habilidades y Competencias
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-3">
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {skills.map((skill) => (
              <Badge key={skill} variant="secondary" className="bg-[#01A89E]/10 text-[#01A89E] pl-2.5 pr-1 py-1 gap-1">
                {skill}
                <button type="button" onClick={() => removeSkill(skill)} className="hover:bg-[#01A89E]/20 rounded-full p-0.5">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Input
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAdd(newSkill) } }}
            placeholder="Escribe una habilidad..."
            className="flex-1"
          />
          <Button type="button" size="sm" variant="outline" onClick={() => handleAdd(newSkill)} className="shrink-0">
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        <div>
          <p className="text-[13px] text-gray-400 mb-1.5">Sugerencias:</p>
          <div className="flex flex-wrap gap-1">
            {SKILL_SUGGESTIONS.filter((s) => !skills.includes(s)).slice(0, 8).map((s) => (
              <button key={s} type="button" onClick={() => addSkill(s)} className="text-[12px] px-2 py-0.5 rounded-full border border-gray-200 text-gray-500 hover:border-[#01A89E] hover:text-[#01A89E] transition-colors">
                + {s}
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
