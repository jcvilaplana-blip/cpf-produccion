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
  "Español", "Inglés", "Francés", "Alemán", "Portugués", "Italiano", "Chino", "Árabe", "Ruso", "Japonés",
]

/**
 * Compara nombres de idioma ignorando acentos y mayúsculas.
 *
 * Hace falta porque en la base de datos conviven las dos grafías: hay filas
 * guardadas como "Espanol" (de cuando esta lista iba sin acentos) y otras como
 * "Español" (escritas por otra pantalla). Sin esto, al abrir el formulario un
 * candidato vería sus idiomas desmarcados y al guardar crearía duplicados.
 */
export function sameLanguage(a: unknown, b: unknown): boolean {
  const norm = (v: unknown) =>
    String(v ?? "")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .trim()
      .toLowerCase()
  return norm(a) === norm(b)
}

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

/**
 * Nombre en español de un tipo de contrato, venga de donde venga.
 *
 * Existía el mismo mapa copiado en tres pantallas, y ninguna de las tres cubría
 * las opciones completas del formulario de ofertas: `seasonal`, `weekend` y
 * `freelance` se publicaban desde el desplegable pero al mostrarlas caían al
 * valor crudo, así que la ficha de la oferta decía "weekend" en inglés.
 *
 * Incluye también las grafías antiguas en español que siguen guardadas en la
 * base de datos de cuando cada pantalla escribía la suya.
 */
export const CONTRACT_TYPE_LABELS: Record<string, string> = {
  full_time: "Jornada Completa",
  part_time: "Media Jornada",
  temporary: "Temporal",
  seasonal: "Estacional",
  weekend: "Fines de Semana",
  freelance: "Autónomo / Freelance",
  flash_offer: "Oferta Flash",
  one_time_event: "Evento Puntual",
  internship: "Prácticas",
  indefinite: "Indefinido",
  // Valores heredados, ya en español.
  temporal: "Temporal",
  extra: "Extra",
  parcial: "Media Jornada",
  completo: "Jornada Completa",
  practicas: "Prácticas",
  "prácticas": "Prácticas",
}

export function contractTypeLabel(value?: string | null): string {
  if (!value) return ""
  const key = String(value).trim()
  return CONTRACT_TYPE_LABELS[key] || CONTRACT_TYPE_LABELS[key.toLowerCase()] || key
}
