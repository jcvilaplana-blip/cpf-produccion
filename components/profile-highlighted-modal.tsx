"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"

/**
 * Confirmación de "Destacar mi perfil", al volver del pago.
 *
 * Stripe devuelve al usuario a /edit-profile?destacado=1. La activación real
 * la hace el webhook, que puede tardar unos segundos en llegar: de ahí el
 * "en unos minutos" del texto, en lugar de prometer un efecto inmediato que
 * quizá aún no se haya aplicado.
 */
export function ProfileHighlightedModal() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (searchParams.get("destacado") === "1") setOpen(true)
  }, [searchParams])

  const close = () => {
    setOpen(false)
    // Se limpia el parámetro para que recargar no vuelva a abrir el modal.
    router.replace("/edit-profile")
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) close() }}>
      <DialogContent showCloseButton={false} className="max-w-sm rounded-[28px] p-0 text-center">
        <div className="px-6 pb-6 pt-8">
          <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#01A89E]/10">
            <Sparkles className="h-8 w-8 text-[#01A89E]" />
          </span>

          <DialogTitle className="text-[20px] font-bold leading-tight text-slate-900">
            Tu perfil ha pasado a destacado
          </DialogTitle>

          <p className="mt-2 text-[14px] leading-relaxed text-slate-600">
            Pasará a los primeros puestos en unos minutos, y se mantendrá ahí
            durante <strong>7 días</strong>.
          </p>

          <Button
            onClick={close}
            className="mt-6 h-12 w-full rounded-xl bg-[#01A89E] text-[15px] font-semibold text-white hover:bg-[#018F86]"
          >
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
