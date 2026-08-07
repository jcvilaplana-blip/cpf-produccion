export interface SubscriptionPlan {
  id: string
  name: string
  description: string
  priceInCents: number
  features: string[]
  popular?: boolean
  /**
   * A quién va dirigido el plan.
   *
   * Antes la pantalla de suscripción decidía esto con listas negras de ids
   * ("todos menos premium-business"), y bastó añadir un plan para que se
   * colara: un candidato veía el Plan Standard de empresa y podía contratarlo.
   */
  role: "business" | "worker"
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "standard-business",
    role: "business",
    name: "Plan Standard",
    description: "Para empresas que empiezan a contratar",
    priceInCents: 1990,
    features: [
      "5 ofertas de trabajo activas",
      "Gestión de candidatos",
      "Mensajería con candidatos",
      "Estadísticas básicas",
      "Soporte por email",
    ],
  },
  {
    id: "premium-business",
    role: "business",
    name: "Plan Premium",
    description: "Para empresas que contratan activamente",
    priceInCents: 2990,
    popular: true,
    features: [
      "20 ofertas de trabajo activas",
      "7 días destacado en página principal",
      "Todas las ventajas del Plan Standard",
      "Estadísticas avanzadas",
      "Soporte prioritario",
      "Insignia Premium verificada",
    ],
  },
  {
    id: "premium-worker",
    role: "worker",
    name: "Premium Trabajador",
    description: "Para profesionales activos",
    priceInCents: 999,
    popular: true,
    features: [
      "Aplicaciones ilimitadas",
      "Perfil destacado",
      "Video reel profesional",
      "Prioridad en búsquedas",
      "Estadísticas de perfil",
      "Sin anuncios",
    ],
  },
]
