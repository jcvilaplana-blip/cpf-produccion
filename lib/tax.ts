/**
 * IVA español aplicado a suscripciones y micropagos.
 *
 * Los precios configurados en el proyecto (SUBSCRIPTION_PLANS, FEATURE_PRICES)
 * son el **importe final, con el IVA ya incluido**: 19,90 € siguen siendo
 * 19,90 €. Lo que se añade es el desglose, que antes no existía en ninguna
 * pantalla ni en el cobro.
 *
 * Todo el cálculo vive aquí para que el resumen que ve el usuario y el importe
 * que se manda a Stripe salgan del mismo sitio: si cada pantalla lo calculara
 * por su cuenta, bastaría un redondeo distinto para que el total mostrado y el
 * cobrado dejaran de coincidir.
 */

export const VAT_RATE = 0.21
export const VAT_LABEL = "IVA (21%)"

export interface PriceBreakdown {
  /** Base imponible, en céntimos. */
  baseCents: number
  /** Cuota de IVA, en céntimos. */
  vatCents: number
  /** Total a cobrar, en céntimos. Coincide con el precio configurado. */
  totalCents: number
}

/**
 * Desglosa un precio que ya lleva el IVA incluido.
 *
 * Se redondea la base y la cuota se obtiene restando, nunca redondeando las
 * dos por separado: así base + IVA da exactamente el total, sin un céntimo
 * que aparece o desaparece según el importe.
 *
 * Ejemplo: 19,90 € -> base 16,45 € + IVA 3,45 €.
 */
export function breakdownFromTotal(totalCents: number): PriceBreakdown {
  const total = Math.max(0, Math.round(totalCents))
  const base = Math.round(total / (1 + VAT_RATE))
  return { baseCents: base, vatCents: total - base, totalCents: total }
}

/** Formatea céntimos como importe en euros: 1990 -> "19,90 €". */
export function formatEuros(cents: number): string {
  return (cents / 100).toLocaleString("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  })
}
