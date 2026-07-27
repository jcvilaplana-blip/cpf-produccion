export interface SubscriptionPlan {
  id: string
  name: string
  description: string
  priceInCents: number
  features: string[]
  popular?: boolean
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "standard-business",
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
