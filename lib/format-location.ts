/**
 * Ubicaciones legibles.
 *
 * Las direcciones vienen del autocompletado de Mapbox, que devuelve la cadena
 * administrativa completa: "Sevilla, provincia de Sevilla, España". En pantalla
 * eso es ruido —repite la ciudad como provincia y añade un país que sobra,
 * porque CPF sólo opera en España—.
 *
 * Se conserva la calle y el número cuando el usuario ha escrito una dirección
 * concreta; si sólo indicó la ciudad, se muestra la ciudad y nada más.
 */

const PAISES_A_QUITAR = ["españa", "espana", "spain"]

/** "Sevilla, provincia de Sevilla, España" -> "Sevilla" */
export function formatLocation(raw?: string | null): string {
  if (!raw) return ""

  const partes = raw
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean)
    // Fuera el país: aquí todo es España.
    .filter((p) => !PAISES_A_QUITAR.includes(p.toLowerCase()))
    // Fuera "provincia de X", que casi siempre repite la ciudad.
    .filter((p) => !/^provincia de\s+/i.test(p))

  // Fuera los duplicados, ignorando mayúsculas y acentos.
  const norm = (v: string) =>
    v.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
  const vistas = new Set<string>()
  const unicas = partes.filter((p) => {
    const k = norm(p)
    if (vistas.has(k)) return false
    vistas.add(k)
    return true
  })

  if (unicas.length === 0) return ""

  // Con dirección concreta -la primera parte lleva número- se enseñan calle y
  // ciudad. Sin ella, basta la ciudad: lo que siga es comunidad o región, que
  // no aporta nada a quien busca trabajo cerca.
  const tieneNumero = /\d/.test(unicas[0])
  return (tieneNumero ? unicas.slice(0, 2) : unicas.slice(0, 1)).join(", ")
}

/** Sólo la ciudad, para chips y tarjetas estrechas. */
export function cityOnly(raw?: string | null): string {
  const corta = formatLocation(raw)
  if (!corta) return ""
  const partes = corta.split(",").map((p) => p.trim())
  return partes[partes.length - 1] || corta
}
