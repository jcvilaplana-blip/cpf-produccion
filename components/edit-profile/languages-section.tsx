"use client"

import { Languages, Plus, Trash2 } from "lucide-react" 
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LANGUAGE_LIST, LANGUAGE_LEVELS } from "@/lib/profile-constants"
import type { LanguageEntry } from "@/lib/profile-constants"

interface LanguagesSectionProps {
  languages: LanguageEntry[]
  addLanguage: () => void
  removeLanguage: (id: string) => void
  updateLanguage: (id: string, field: string, value: string) => void
}

export function LanguagesSection({ languages, addLanguage, removeLanguage, updateLanguage }: LanguagesSectionProps) {
  return (
    <Card className="border-0 shadow-sm overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-[#01A89E]/10 to-transparent pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Languages className="w-4 h-4 text-[#01A89E]" />
          Idiomas
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-3">
        {languages.map((lang) => (
          <div key={lang.id} className="flex items-center gap-2">
            <Select value={lang.language} onValueChange={(v) => updateLanguage(lang.id, "language", v)}>
              <SelectTrigger className="flex-1"><SelectValue placeholder="Idioma" /></SelectTrigger>
              <SelectContent>
                {LANGUAGE_LIST.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={lang.level} onValueChange={(v) => updateLanguage(lang.id, "level", v)}>
              <SelectTrigger className="w-32"><SelectValue placeholder="Nivel" /></SelectTrigger>
              <SelectContent>
                {LANGUAGE_LEVELS.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <button type="button" onClick={() => removeLanguage(lang.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addLanguage} className="w-full gap-1.5">
          <Plus className="w-4 h-4" /> Anadir idioma
        </Button>
      </CardContent>
    </Card>
  )
}
