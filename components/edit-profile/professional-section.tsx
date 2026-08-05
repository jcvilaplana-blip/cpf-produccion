"use client"

import { useState, useEffect } from "react"
import { Briefcase, Loader2, Sparkles, Lock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AVAILABILITY_OPTIONS, CONTRACT_TYPES } from "@/lib/profile-constants"
import { createClient } from "@/lib/supabase/client"

type Category = { id: string; name: string }
type Subcategory = { id: string; name: string; category_id: string }

const MATCH_ALERT_STEPS = [
  { value: 100, label: "100% - coincidencia total" },
  { value: 75, label: "75% o más" },
  { value: 50, label: "50% o más" },
  { value: 25, label: "25% o más" },
  { value: 0, label: "Cualquier coincidencia" },
]

interface ProfessionalSectionProps {
  jobCategory: string; setJobCategory: (v: string) => void
  subcategory: string; setSubcategory: (v: string) => void
  /** Especialidad escrita a mano cuando la subcategoría elegida es "Otro". */
  customSubcategory: string; setCustomSubcategory: (v: string) => void
  experienceYears: string; setExperienceYears: (v: string) => void
  currentPosition: string; setCurrentPosition: (v: string) => void
  availability: string; setAvailability: (v: string) => void
  contractTypes: string[]; toggleContractType: (v: string) => void
  salaryMin: string; setSalaryMin: (v: string) => void
  salaryMax: string; setSalaryMax: (v: string) => void
  matchAlertThreshold: number; setMatchAlertThreshold: (v: number) => void
  isPremium: boolean
}

export function ProfessionalSection(p: ProfessionalSectionProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [filteredSubcategories, setFilteredSubcategories] = useState<Subcategory[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load categories and subcategories from database
  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient()
      
      const { data: cats } = await supabase
        .from("categories")
        .select("id, name")
        .order("name")
      
      const { data: subs } = await supabase
        .from("subcategories")
        .select("id, name, category_id")
        .order("name")
      
      setCategories(cats || [])
      setSubcategories(subs || [])
      setIsLoading(false)
    }
    loadData()
  }, [])

  // Filter subcategories when category changes
  useEffect(() => {
    if (p.jobCategory) {
      const selectedCat = categories.find(c => c.name === p.jobCategory)
      if (selectedCat) {
        setFilteredSubcategories(subcategories.filter(s => s.category_id === selectedCat.id))
      }
    } else {
      setFilteredSubcategories([])
    }
  }, [p.jobCategory, categories, subcategories])

  return (
    <Card className="border-0 shadow-sm overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-[#01A89E]/10 to-transparent pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-[#01A89E]" />
          Información Profesional
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-medium text-gray-600">Categoría profesional</Label>
            {isLoading ? (
              <div className="mt-1 h-10 flex items-center justify-center border rounded-md">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Select value={p.jobCategory} onValueChange={(v) => { p.setJobCategory(v); p.setSubcategory("") }}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecciona categoría" /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {categories.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>
          <div>
            <Label className="text-xs font-medium text-gray-600">Subcategoría</Label>
            <Select value={p.subcategory} onValueChange={p.setSubcategory} disabled={!p.jobCategory || filteredSubcategories.length === 0}>
              <SelectTrigger className="mt-1"><SelectValue placeholder={p.jobCategory ? "Selecciona subcategoría" : "Primero selecciona categoría"} /></SelectTrigger>
              <SelectContent className="max-h-60">
                {filteredSubcategories.map((s) => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {/* Mismo comportamiento que el registro: al elegir "Otro" se pide
                escribir la especialidad. Sin este campo, el valor guardado en
                el alta no podía editarse aquí. */}
            {p.subcategory?.toLowerCase() === "otro" && (
              <div className="mt-2">
                <Label htmlFor="customSub" className="text-xs font-medium text-gray-600">
                  Especifica tu especialidad
                </Label>
                <Input
                  id="customSub"
                  value={p.customSubcategory}
                  onChange={(e) => p.setCustomSubcategory(e.target.value)}
                  placeholder="Ej: Especialista en coctelería de autor"
                  className="mt-1"
                />
              </div>
            )}
          </div>
          <div>
            <Label htmlFor="expYears" className="text-xs font-medium text-gray-600">Años de experiencia</Label>
            <Input id="expYears" type="number" min="0" max="50" value={p.experienceYears} onChange={(e) => p.setExperienceYears(e.target.value)} placeholder="0" className="mt-1" />
          </div>
          <div>
            <Label htmlFor="currentPos" className="text-xs font-medium text-gray-600">Puesto actual</Label>
            <Input id="currentPos" value={p.currentPosition} onChange={(e) => p.setCurrentPosition(e.target.value)} placeholder="Ej: Camarero, Chef..." className="mt-1" />
          </div>
          <div>
            <Label className="text-xs font-medium text-gray-600">Disponibilidad</Label>
            <Select value={p.availability} onValueChange={p.setAvailability}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Selecciona" /></SelectTrigger>
              <SelectContent>
                {AVAILABILITY_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label className="text-xs font-medium text-gray-600 mb-2 block">Tipos de contrato deseados</Label>
          <div className="flex flex-wrap gap-2">
            {CONTRACT_TYPES.map((ct) => (
              <button
                key={ct.value}
                type="button"
                onClick={() => p.toggleContractType(ct.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  p.contractTypes.includes(ct.value)
                    ? "bg-[#01A89E] text-white border-[#01A89E]"
                    : "bg-white text-gray-600 border-gray-200 hover:border-[#01A89E]"
                }`}
              >
                {ct.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#F48221]" />
            Avisarme cuando una oferta coincida al menos
            {!p.isPremium && <Lock className="w-3 h-3 text-muted-foreground" />}
          </Label>
          {!p.isPremium && (
            <p className="text-xs text-muted-foreground mb-2">Función exclusiva para candidatos premium.</p>
          )}
          <div className="flex flex-wrap gap-2">
            {MATCH_ALERT_STEPS.map((step) => (
              <button
                key={step.value}
                type="button"
                disabled={!p.isPremium}
                onClick={() => p.setMatchAlertThreshold(step.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  p.matchAlertThreshold === step.value
                    ? "bg-[#F48221] text-white border-[#F48221]"
                    : "bg-white text-gray-600 border-gray-200 hover:border-[#F48221]"
                }`}
              >
                {step.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="salMin" className="text-xs font-medium text-gray-600">Salario mínimo deseado</Label>
            <Input id="salMin" type="number" value={p.salaryMin} onChange={(e) => p.setSalaryMin(e.target.value)} placeholder="1200" className="mt-1" />
          </div>
          <div>
            <Label htmlFor="salMax" className="text-xs font-medium text-gray-600">Salario máximo deseado</Label>
            <Input id="salMax" type="number" value={p.salaryMax} onChange={(e) => p.setSalaryMax(e.target.value)} placeholder="2500" className="mt-1" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
