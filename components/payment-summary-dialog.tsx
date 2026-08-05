"use client"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X, Loader2, ShieldCheck } from "lucide-react"
import { breakdownFromTotal, formatEuros, VAT_LABEL } from "@/lib/tax"

interface PaymentSummaryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Qué se está comprando, tal como se le muestra al usuario. */
  concept: string
  /** Precio del servicio en céntimos, con el IVA ya incluido. */
  totalCents: number
  /** Texto bajo el concepto (duración, periodicidad…). */
  detail?: string
  /** Si es una suscripción, para decir que el importe se repite cada mes. */
  recurring?: boolean
  loading?: boolean
  onConfirm: () => void
}

/**
 * Resumen del importe antes de ir a la pasarela.
 *
 * El desglose sale de lib/tax.ts, el mismo cálculo que usa el servidor para
 * construir el cobro: si cada lado lo calculara por su cuenta, un redondeo
 * distinto bastaría para que el total mostrado aquí no fuera el que se cobra.
 */
export function PaymentSummaryDialog({
  open, onOpenChange, concept, totalCents: priceCents, detail, recurring, loading, onConfirm,
}: PaymentSummaryDialogProps) {
  const { baseCents: base, vatCents, totalCents } = breakdownFromTotal(priceCents)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="top-auto bottom-0 left-0 max-w-full translate-x-0 translate-y-0 gap-0 overflow-hidden rounded-b-none rounded-t-[28px] border-0 p-0 shadow-2xl sm:bottom-auto sm:left-[50%] sm:top-[50%] sm:max-w-[420px] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-[28px]"
      >
        <div className="relative px-5 pb-4 pt-5">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-200 sm:hidden" />
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Cerrar"
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 sm:top-5"
          >
            <X className="h-4 w-4" />
          </button>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#01A89E]">
            Resumen del pago
          </p>
          <DialogTitle className="mt-1 pr-10 text-[20px] font-bold leading-tight text-slate-900">
            {concept}
          </DialogTitle>
          {detail && <p className="mt-1 text-[13px] text-slate-500">{detail}</p>}
        </div>

        <div className="px-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            <div className="flex items-center justify-between py-1.5">
              <span className="text-[14px] text-slate-600">Importe del servicio (sin IVA)</span>
              <span className="text-[14px] font-medium tabular-nums text-slate-900">
                {formatEuros(base)}
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-[14px] text-slate-600">{VAT_LABEL}</span>
              <span className="text-[14px] font-medium tabular-nums text-slate-900">
                {formatEuros(vatCents)}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-3">
              <span className="text-[15px] font-semibold text-slate-900">Total a pagar</span>
              <span className="text-[20px] font-bold tabular-nums text-[#01A89E]">
                {formatEuros(totalCents)}
              </span>
            </div>
            {recurring && (
              <p className="mt-2 text-[12px] leading-snug text-slate-500">
                Se cobrará cada mes hasta que canceles la suscripción.
              </p>
            )}
          </div>

          <p className="mt-3 flex items-start gap-1.5 text-[12px] leading-snug text-slate-500">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
            El pago se procesa en Stripe. CamareroPorFavor no guarda los datos de tu tarjeta.
          </p>
        </div>

        <div className="flex gap-2 px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:pb-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="h-12 rounded-xl px-4"
          >
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className="h-12 flex-1 rounded-xl bg-[#01A89E] text-[15px] font-semibold text-white hover:bg-[#018F86]"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "Abriendo pago…" : `Pagar ${formatEuros(totalCents)}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
