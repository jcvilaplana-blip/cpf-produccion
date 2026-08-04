// "Estado laboral" (5.º valor pedido: Disponible/En contacto/En
// entrevista/Ocupado/Inactivo temporal) - los 3 autoinformados
// (available/busy/not_looking) siguen siendo el fallback, pero "En
// contacto"/"En entrevista" se calculan a partir de señales reales
// (solicitudes/entrevistas activas) para que no se puedan falsear.

export interface DisplayStatusInput {
  selfReported?: string | null
  hasActiveInterview: boolean // interview_requests.status in (pending, confirmed) for this worker
  hasOpenApplication: boolean // applications.status in (pending, interview) for this worker
}

export interface DisplayStatus {
  value: "in_interview" | "in_contact" | "available" | "busy" | "not_looking"
  label: string
  color: string
}

const SELF_REPORTED: Record<string, { label: string; color: string }> = {
  available: { label: "Disponible", color: "bg-emerald-100 text-emerald-700" },
  busy: { label: "Ocupado", color: "bg-amber-100 text-amber-700" },
  not_looking: { label: "Inactivo temporal", color: "bg-slate-100 text-slate-600" },
}

export function computeDisplayStatus(input: DisplayStatusInput): DisplayStatus {
  if (input.hasActiveInterview) {
    return { value: "in_interview", label: "En entrevista", color: "bg-blue-100 text-blue-700" }
  }
  if (input.hasOpenApplication) {
    return { value: "in_contact", label: "En contacto", color: "bg-purple-100 text-purple-700" }
  }
  const fallback = SELF_REPORTED[input.selfReported || ""] || { label: "No indicado", color: "bg-slate-100 text-slate-600" }
  return { value: (input.selfReported as DisplayStatus["value"]) || "not_looking", ...fallback }
}
