export interface JobFilters {
  search?: string
  category?: string
  jobType?: string
  salaryMin?: number
  salaryMax?: number
  location?: string
  distance?: number // en km
  userLocation?: {
    latitude: number
    longitude: number
  }
  sortBy?: "recent" | "salary" | "distance"
}

export const JOB_CATEGORIES = ["Todos", "Restaurante", "Bar", "Hotel", "Catering", "Cafetería", "Cocina", "Eventos"]

export const JOB_TYPES = ["Todos", "Tiempo Completo", "Medio Tiempo", "Temporal", "Fin de Semana"]

export const SALARY_RANGES = [
  { label: "Cualquiera", min: 0, max: 999999 },
  { label: "Hasta 1.500€", min: 0, max: 1500 },
  { label: "1.500€ - 2.000€", min: 1500, max: 2000 },
  { label: "2.000€ - 2.500€", min: 2000, max: 2500 },
  { label: "Más de 2.500€", min: 2500, max: 999999 },
]

export const DISTANCE_OPTIONS = [
  { label: "Cualquier distancia", value: 999999 },
  { label: "Hasta 5 km", value: 5 },
  { label: "Hasta 10 km", value: 10 },
  { label: "Hasta 25 km", value: 25 },
  { label: "Hasta 50 km", value: 50 },
]
