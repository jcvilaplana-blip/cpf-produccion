"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Zap, Star, Sparkles, Heart } from "lucide-react"
import { formatEuros } from "@/lib/tax"

/**
 * Las compras sueltas, presentadas como tarjetas.
 *
 * Hasta ahora los micropagos sólo aparecían en el punto exacto donde se
 * cobran -el botón "Destacar" dentro de una oferta, el interruptor de Flash al
 * crearla-, así que quien no pasara por esa pantalla concreta no llegaba a
 * saber que existían. Aquí se enseñan con su precio allí donde el usuario está
 * gestionando lo que la compra afecta.
 *
 * Los importes se declaran aquí sólo para mostrarlos: el cobro lo decide
 * siempre el servidor desde FEATURE_PRICES, en
 * app/api/micropayments/create/route.ts. Si los dos dejaran de coincidir, lo
 * que se cobra es lo del servidor.
 */

interface Producto {
  clave: string
  titulo: string
  descripcion: string
  precioCents: number
  href: string
  icono: typeof Zap
  /** Tinte de la tarjeta, en la línea del resto del panel. */
  color: string
}

const PRODUCTOS_EMPRESA: Producto[] = [
  {
    clave: "flash_job",
    titulo: "Oferta Flash",
    descripcion: "Prioridad y aviso a candidatos de tu zona",
    precioCents: 500,
    href: "/jobs/create?flash=true",
    icono: Zap,
    color: "#F97316",
  },
  {
    clave: "highlight_job",
    titulo: "Destacar Oferta",
    descripcion: "Tu oferta la primera durante 24 h",
    precioCents: 250,
    href: "/my-jobs",
    icono: Star,
    color: "#F48221",
  },
]

const PRODUCTOS_CANDIDATO: Producto[] = [
  {
    clave: "highlight_profile",
    titulo: "Destacar Perfil (7 días)",
    descripcion: "Apareces primero en las búsquedas",
    precioCents: 99,
    href: "/edit-profile",
    icono: Sparkles,
    color: "#F5A623",
  },
  {
    clave: "view_matches",
    titulo: "Ver Empresas Interesadas",
    descripcion: "Quién ha guardado tu perfil, 30 días",
    precioCents: 99,
    href: "/edit-profile",
    icono: Heart,
    color: "#EC4899",
  },
  // "Impulsar Visibilidad" existe en la lista de precios pero no se ofrece
  // aquí: su activación (lib/payments/activate-feature.ts) no cambia ningún
  // estado, así que cobrarlo no le daría al candidato nada a cambio. Vuelve a
  // esta lista el día que haga algo.
]

interface MicropaymentCardsProps {
  rol: "business" | "worker"
  /**
   * Dentro de una oferta concreta, "Destacar" apunta a esa oferta en lugar de
   * al listado: el usuario ya está donde quiere aplicarlo.
   */
  jobId?: string
  titulo?: string
  className?: string
}

export function MicropaymentCards({
  rol,
  jobId,
  titulo = "Impulsa tu visibilidad",
  className,
}: MicropaymentCardsProps) {
  const productos = rol === "business" ? PRODUCTOS_EMPRESA : PRODUCTOS_CANDIDATO

  return (
    <div className={className}>
      <p className="mb-2 text-[13px] font-semibold text-muted-foreground">{titulo}</p>
      <div className="grid grid-cols-2 gap-3">
        {productos.map((p) => {
          const Icono = p.icono
          const href = jobId && p.clave === "highlight_job" ? `/jobs/${jobId}` : p.href
          return (
            <Link key={p.clave} href={href} className="block">
              <Card
                className="h-full transition-colors"
                style={{ backgroundColor: `${p.color}0D`, borderColor: `${p.color}33` }}
              >
                <CardContent className="flex h-full flex-col gap-2 p-3">
                  <div className="flex items-center gap-2.5">
                    <div className="rounded-xl p-2.5" style={{ backgroundColor: `${p.color}1A` }}>
                      <Icono className="h-6 w-6" style={{ color: p.color }} />
                    </div>
                    <p className="text-[15px] font-bold leading-tight" style={{ color: p.color }}>
                      {formatEuros(p.precioCents)}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold leading-snug">{p.titulo}</p>
                    <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground">
                      {p.descripcion}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
