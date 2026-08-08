/**
 * Prioridad de las ofertas destacadas.
 *
 * "Destacar Oferta" cobra 2,50 € por 24 horas en los primeros puestos. El cobro
 * y la activación ya funcionaban -el webhook marca `is_highlighted` y fija
 * `highlight_expires_at`-, pero **ningún listado ordenaba por ese campo**: la
 * oferta se pintaba con su insignia y se quedaba donde le tocara por fecha. Se
 * estaba cobrando por una posición que no se daba.
 *
 * El único sitio que sí lo miraba, el panel del candidato, ignoraba la
 * caducidad, de modo que una oferta destacada una vez encabezaba la lista para
 * siempre. Por eso la vigencia se comprueba aquí y no en cada pantalla.
 */

interface Destacable {
  is_highlighted?: boolean | null
  highlight_expires_at?: string | null
  /** Variante en camelCase, como la usan algunas pantallas ya mapeadas. */
  isHighlighted?: boolean | null
  highlightExpiresAt?: string | null
}

/** ¿La oferta está destacada AHORA MISMO? */
export function isHighlightActive(job: Destacable | null | undefined): boolean {
  if (!job) return false
  const activo = job.is_highlighted ?? job.isHighlighted
  if (!activo) return false

  const caduca = job.highlight_expires_at ?? job.highlightExpiresAt
  // Sin fecha de caducidad se considera vigente: es como quedaron las filas
  // destacadas a mano desde el panel de administración.
  if (!caduca) return true
  return new Date(caduca).getTime() > Date.now()
}

/**
 * Ordena poniendo delante las destacadas vigentes, sin alterar el orden
 * relativo del resto (el criterio que traiga la lista: fecha, relevancia…).
 */
export function sortJobsHighlightedFirst<T extends Destacable>(jobs: T[]): T[] {
  return [...jobs].sort((a, b) => {
    const da = isHighlightActive(a)
    const db = isHighlightActive(b)
    if (da === db) return 0
    return da ? -1 : 1
  })
}
