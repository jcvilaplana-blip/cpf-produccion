/**
 * Criterios de valoración de un candidato: única fuente de verdad.
 *
 * La lista estaba repetida en el perfil público y en la página de reseñas, y
 * el diálogo de valoración no la tenía en absoluto -por eso esos criterios
 * salían siempre a "—": nadie los escribía nunca-. Repetirla es cómo se
 * desincronizan: basta con que una pantalla añada un criterio y la otra no
 * para que se pierdan valoraciones al leerlas.
 *
 * `key` es lo que se guarda en `ratings.criteria`. `aliases` existe porque
 * algunas filas antiguas usan la versión en castellano de la clave; al leer se
 * aceptan ambas, al escribir se usa siempre `key`.
 */
export interface RatingCriterion {
  key: string
  aliases: string[]
  label: string
  /** Ayuda breve mostrada bajo el criterio al valorar. */
  hint: string
}

export const RATING_CRITERIA: RatingCriterion[] = [
  {
    key: "punctuality",
    aliases: ["puntualidad"],
    label: "Puntualidad",
    hint: "¿Llegaba a su hora?",
  },
  {
    key: "attitude",
    aliases: ["actitud"],
    label: "Actitud y predisposición",
    hint: "¿Buena disposición y trato?",
  },
  {
    key: "learning_speed",
    aliases: ["rapidez_aprendizaje"],
    label: "Rapidez de aprendizaje",
    hint: "¿Cogió el ritmo pronto?",
  },
  {
    key: "problem_solving",
    aliases: ["resolucion_problemas"],
    label: "Resolución de problemas",
    hint: "¿Salió airoso de los imprevistos?",
  },
  {
    key: "hygiene",
    aliases: ["higiene"],
    label: "Higiene y presentación",
    hint: "¿Cuidaba su imagen y limpieza?",
  },
  {
    key: "team_adaptation",
    aliases: ["adaptacion_equipo"],
    label: "Adaptación al equipo",
    hint: "¿Encajó con el resto del equipo?",
  },
  {
    key: "contract_fulfillment",
    aliases: ["cumplimiento_contrato"],
    label: "Cumplimiento del contrato",
    hint: "¿Cumplió lo acordado?",
  },
]

/**
 * Criterios con los que un candidato valora a un establecimiento.
 *
 * No son los mismos ni podrían serlo: "rapidez de aprendizaje" o "adaptación
 * al equipo" describen a una persona trabajando, no a un local contratando.
 * Lo que un trabajador puede juzgar de una empresa es otra cosa —si pagó lo
 * acordado, si el ambiente era sano, si el horario fue el pactado—, y es lo
 * que se pregunta aquí.
 */
export const BUSINESS_RATING_CRITERIA: RatingCriterion[] = [
  {
    key: "payment_compliance",
    aliases: ["pago_acordado"],
    label: "Pago acordado",
    hint: "¿Pagó lo pactado y a tiempo?",
  },
  {
    key: "work_environment",
    aliases: ["ambiente_trabajo"],
    label: "Ambiente de trabajo",
    hint: "¿Buen trato y clima en el equipo?",
  },
  {
    key: "schedule_respect",
    aliases: ["respeto_horario"],
    label: "Respeto del horario",
    hint: "¿Se cumplieron los turnos acordados?",
  },
  {
    key: "organization",
    aliases: ["organizacion"],
    label: "Organización",
    hint: "¿Estaba todo previsto y ordenado?",
  },
  {
    key: "facilities",
    aliases: ["instalaciones"],
    label: "Instalaciones y medios",
    hint: "¿Material y espacios en buen estado?",
  },
  {
    key: "communication",
    aliases: ["comunicacion"],
    label: "Comunicación",
    hint: "¿Dieron instrucciones claras?",
  },
  {
    key: "would_repeat",
    aliases: ["repetiria"],
    label: "Volvería a trabajar aquí",
    hint: "¿Repetirías con este establecimiento?",
  },
]

/** Los criterios que tocan según a quién se valore. */
export function criteriaFor(userType?: "worker" | "business" | null): RatingCriterion[] {
  return userType === "business" ? BUSINESS_RATING_CRITERIA : RATING_CRITERIA
}

/** Todas las claves que valen para un criterio, la actual y las antiguas. */
export function criterionKeys(criterion: RatingCriterion): string[] {
  return [criterion.key, ...criterion.aliases]
}

/**
 * Busca el valor de un criterio en un resumen, aceptando claves antiguas.
 * Devuelve undefined si ese criterio no se ha valorado nunca.
 */
export function readCriterion(
  summary: Record<string, number> | null | undefined,
  criterion: RatingCriterion
): number | undefined {
  if (!summary) return undefined
  for (const key of criterionKeys(criterion)) {
    const value = summary[key]
    if (typeof value === "number") return value
  }
  return undefined
}
