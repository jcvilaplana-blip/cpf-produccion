"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft, Coins, Trophy, Handshake, UserCheck, Users, Star, CalendarCheck,
  CalendarClock, ImagePlus, Eye, Gift, ChevronRight, Sparkles,
} from "lucide-react"

/**
 * Cómo se ganan los puntos.
 *
 * Las cifras NO están escritas a mano: son las de `POINTS` en
 * lib/gamification/award-points.ts, que es lo que el servidor concede de
 * verdad. Si allí cambian, hay que cambiarlas aquí — por eso se citan con su
 * nombre en el comentario de cada tarjeta.
 */

type Way = {
  points: number
  title: string
  detail: string
  cadence: string
  icon: React.ComponentType<{ className?: string }>
  tint: string
  ring: string
  roles: "ambos" | "candidato" | "establecimiento"
}

// POINTS.hired, POINTS.referralCompleted, POINTS.profileComplete, etc.
const WAYS: Way[] = [
  {
    points: 150,
    title: "Invita a alguien y que se registre",
    detail:
      "Comparte tu enlace de invitación. Cuando la persona invitada se registra y completa su perfil, los puntos entran en tu saldo automáticamente.",
    cadence: "Por cada invitado",
    icon: Users,
    tint: "from-violet-500 to-fuchsia-500",
    ring: "ring-violet-200",
    roles: "ambos",
  },
  {
    points: 100,
    title: "Contratación cerrada",
    detail:
      "Cuando un proceso termina en contratación, ganáis puntos las dos partes: el candidato contratado y el establecimiento que contrata.",
    cadence: "Por cada contratación",
    icon: Handshake,
    tint: "from-emerald-500 to-teal-500",
    ring: "ring-emerald-200",
    roles: "ambos",
  },
  {
    points: 50,
    title: "Completa tu perfil",
    detail:
      "Se concede una sola vez, cuando tu perfil pasa a estar completo. Es la forma más rápida de empezar con saldo.",
    cadence: "Una sola vez",
    icon: UserCheck,
    tint: "from-sky-500 to-blue-500",
    ring: "ring-sky-200",
    roles: "ambos",
  },
  {
    points: 30,
    title: "Deja una valoración",
    detail:
      "Tras una contratación puedes valorar a la otra parte. Sólo puntúa una valoración real: hace falta que haya habido contratación.",
    cadence: "Por cada valoración",
    icon: Star,
    tint: "from-amber-400 to-orange-500",
    ring: "ring-amber-200",
    roles: "ambos",
  },
  {
    points: 30,
    title: "Confirma una entrevista",
    detail:
      "Cuando confirmas una entrevista que te han propuesto. Premia responder pronto y no dejar procesos en el aire.",
    cadence: "Por cada entrevista",
    icon: CalendarCheck,
    tint: "from-indigo-500 to-violet-500",
    ring: "ring-indigo-200",
    roles: "candidato",
  },
  {
    points: 15,
    title: "Añade una foto a tu portfolio",
    detail:
      "Sube trabajo tuyo al portfolio. Puntúa una vez al mes, así que conviene ir renovándolo poco a poco en lugar de subirlo todo de golpe.",
    cadence: "Una vez al mes",
    icon: ImagePlus,
    tint: "from-rose-400 to-pink-500",
    ring: "ring-rose-200",
    roles: "candidato",
  },
  {
    points: 10,
    title: "Mantén tu disponibilidad al día",
    detail:
      "Actualiza si estás disponible y cuándo. Puntúa una vez por semana, y de paso apareces mejor colocado ante quien busca cubrir un turno ya.",
    cadence: "Una vez por semana",
    icon: CalendarClock,
    tint: "from-cyan-500 to-teal-500",
    ring: "ring-cyan-200",
    roles: "candidato",
  },
  {
    points: 5,
    title: "Tu perfil recibe visitas",
    detail:
      "Un pequeño extra diario cuando alguien visita tu perfil. Cuanto más completo y activo esté, más visitas recibe.",
    cadence: "Una vez al día",
    icon: Eye,
    tint: "from-slate-400 to-slate-600",
    ring: "ring-slate-200",
    roles: "ambos",
  },
]

const ROLE_LABEL: Record<Way["roles"], string> = {
  ambos: "Candidatos y establecimientos",
  candidato: "Sólo candidatos",
  establecimiento: "Sólo establecimientos",
}

export default function HowToEarnPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pt-14">
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur pt-[env(safe-area-inset-top,0px)]">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Volver">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-[17px] font-bold">Cómo ganar puntos</h1>
        </div>
      </header>

      {/* Portada */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#01A89E] via-[#0d9488] to-[#115e59] px-5 py-10 text-white">
        <Sparkles className="pointer-events-none absolute -right-6 -top-6 h-40 w-40 text-white/10" />
        <Coins className="pointer-events-none absolute -bottom-8 -left-6 h-36 w-36 text-white/10" />
        <div className="relative mx-auto max-w-2xl">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-white/70">Gamificación</p>
          <h2 className="mt-2 text-[30px] font-extrabold leading-[1.1]">
            Usa CPF, acumula puntos, canjéalos
          </h2>
          <p className="mt-3 max-w-md text-[15px] leading-relaxed text-white/85">
            Los puntos se conceden solos cuando haces cosas que mueven la plataforma: completar tu
            perfil, cerrar una contratación, valorar a quien has tratado. No hay que reclamarlos.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-2xl space-y-6 px-4 py-6">
        {/* Cómo funciona, en tres pasos */}
        <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <h3 className="text-[15px] font-semibold text-slate-900">Cómo funciona</h3>
          <ol className="mt-4 space-y-4">
            {[
              { n: 1, t: "Haces algo que suma", d: "Completas el perfil, te contratan, valoras a alguien…" },
              { n: 2, t: "Los puntos entran solos", d: "El sistema lo detecta y los abona. No hay que pedirlos ni justificarlos." },
              { n: 3, t: "Los canjeas cuando quieras", d: "Cambias tu saldo por Perfil Premium, una Oferta Flash gratuita o destacar una oferta." },
            ].map((step) => (
              <li key={step.n} className="flex gap-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#01A89E] text-[15px] font-bold text-white">
                  {step.n}
                </span>
                <div className="min-w-0 pt-1">
                  <p className="text-[15px] font-semibold text-slate-900">{step.t}</p>
                  <p className="mt-0.5 text-[13px] leading-snug text-slate-500">{step.d}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Las formas de ganar */}
        <section>
          <h3 className="mb-3 px-1 text-[15px] font-semibold text-slate-900">
            Todas las formas de ganar puntos
          </h3>
          <div className="space-y-3">
            {WAYS.map((way) => {
              const Icon = way.icon
              return (
                <article
                  key={way.title}
                  className={`flex gap-4 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm ring-1 ${way.ring}`}
                >
                  <div
                    className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-gradient-to-br ${way.tint} text-white`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="mt-0.5 text-[13px] font-bold leading-none">+{way.points}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-semibold leading-snug text-slate-900">{way.title}</p>
                    <p className="mt-1 text-[13px] leading-relaxed text-slate-500">{way.detail}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[12px] font-medium text-slate-600">
                        {way.cadence}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[12px] font-medium text-slate-600">
                        {ROLE_LABEL[way.roles]}
                      </span>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        {/* Niveles */}
        <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-[#F5A623]" />
            <h3 className="text-[15px] font-semibold text-slate-900">Tu nivel</h3>
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-slate-500">
            Subes un nivel por cada <strong className="text-slate-700">100 puntos acumulados</strong>. El
            nivel refleja tu recorrido en la plataforma y no baja al canjear: canjear gasta saldo, no
            historial.
          </p>
          <div className="mt-4 flex items-end gap-1.5">
            {[1, 2, 3, 4, 5, 6].map((lvl) => (
              <div key={lvl} className="flex flex-1 flex-col items-center gap-1.5">
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-[#01A89E] to-[#5eead4]"
                  style={{ height: `${18 + lvl * 11}px` }}
                />
                <span className="text-[12px] font-semibold text-slate-500">{lvl}</span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-center text-[12px] text-slate-400">
            Nivel 1 = 0 ptos · Nivel 2 = 100 ptos · Nivel 3 = 200 ptos…
          </p>
        </section>

        {/* Qué se puede canjear */}
        <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Gift className="h-4 w-4 text-[#F48221]" />
            <h3 className="text-[15px] font-semibold text-slate-900">En qué puedes gastarlos</h3>
          </div>
          <ul className="mt-3 space-y-2.5 text-[13px] leading-relaxed text-slate-600">
            <li><strong className="text-slate-800">Perfil Premium (500 ptos)</strong> — 7 días por delante en los listados, con distintivo.</li>
            <li><strong className="text-slate-800">Oferta Flash gratuita (300 ptos)</strong> — publica una oferta urgente sin pagarla.</li>
            <li><strong className="text-slate-800">Destacar oferta (200 ptos)</strong> — una de tus ofertas sube a los primeros puestos.</li>
          </ul>
          <Link
            href="/rewards"
            className="mt-4 flex items-center justify-between rounded-2xl bg-[#01A89E] px-4 py-3 text-[14px] font-semibold text-white active:bg-[#018F86]"
          >
            Ir a canjear mis puntos
            <ChevronRight className="h-4 w-4" />
          </Link>
        </section>

        <p className="px-2 pb-2 text-center text-[12px] leading-relaxed text-slate-400">
          Los puntos se abonan automáticamente y quedan registrados en tu historial. Las acciones
          con límite (semanal, mensual o diario) sólo puntúan una vez dentro de ese periodo.
        </p>
      </main>
    </div>
  )
}
