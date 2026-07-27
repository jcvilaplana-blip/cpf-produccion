// Profile edit form constants

export const JOB_CATEGORIES = [
  "Hosteleria",
  "Tecnologia",
  "Sanidad",
  "Educacion",
  "Construccion",
  "Comercio",
  "Transporte",
  "Administracion",
  "Marketing",
  "Diseno",
  "Limpieza",
  "Seguridad",
  "Otros",
]

export const AVAILABILITY_OPTIONS = [
  { value: "immediate", label: "Disponibilidad inmediata" },
  { value: "2_weeks", label: "En 2 semanas" },
  { value: "1_month", label: "En 1 mes" },
  { value: "negotiable", label: "Negociable" },
]

export const CONTRACT_TYPES = [
  { value: "full_time", label: "Tiempo completo" },
  { value: "part_time", label: "Media jornada" },
  { value: "flash_offer", label: "Flash / Temporal" },
  { value: "one_time_event", label: "Evento puntual" },
]

export const LANGUAGE_LIST = [
  "Espanol", "Ingles", "Frances", "Aleman", "Portugues", "Italiano", "Chino", "Arabe", "Ruso", "Japones",
]

export const LANGUAGE_LEVELS = [
  { value: "basic", label: "Basico" },
  { value: "intermediate", label: "Intermedio" },
  { value: "advanced", label: "Avanzado" },
  { value: "native", label: "Nativo" },
]

export const SKILL_SUGGESTIONS = [
  "Atencion al cliente", "Cocina", "Camarero/a", "Bartender", "Limpieza",
  "Microsoft Office", "Conduccion B", "Ingles B2", "Trabajo en equipo",
  "Gestion de tiempo", "Comunicacion", "Resolucion de problemas",
  "Liderazgo", "Adaptabilidad", "Primeros auxilios",
]

// types
export interface WorkExperience {
  id: string
  company: string
  position: string
  startDate: string
  endDate: string
  current: boolean
  description: string
}

export interface Education {
  id: string
  institution: string
  title: string
  year: string
}

export interface LanguageEntry {
  id: string
  language: string
  level: string
}

// helpers
export function generateId() {
  return Math.random().toString(36).substring(2, 9)
}

export function parseJsonField(val: any, fallback: any[] = []) {
  if (Array.isArray(val)) return val
  if (typeof val === "string") {
    try { return JSON.parse(val) } catch { return fallback }
  }
  return fallback
}
