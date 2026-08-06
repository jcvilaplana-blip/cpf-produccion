"use client"

import Image from "next/image"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Briefcase, Building2 } from "lucide-react"
import type { HomeMode } from "@/lib/use-home-mode"

/**
 * Pregunta de entrada: ¿vienes a buscar empleo o a buscar personal?
 *
 * La respuesta decide qué contenido muestra la portada. Es lo primero que ve
 * quien abre la aplicación sin haber elegido todavía, porque los dos públicos
 * quieren cosas opuestas y una portada única no sirve a ninguno.
 *
 * No lleva botón de cerrar a propósito: sin respuesta no hay portada que
 * mostrar. Se elige una y se puede cambiar después.
 */
export function HomeModeDialog({
  abierto,
  onElegir,
}: {
  abierto: boolean
  onElegir: (modo: HomeMode) => void
}) {
  return (
    <Dialog open={abierto}>
      <DialogContent
        className="max-w-[360px] rounded-3xl [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="flex flex-col items-center text-center">
          <Image
            src="/logo-completo-texto-APP.png"
            alt="CamareroPorFavor"
            width={200}
            height={42}
            className="h-auto w-[200px]"
            priority
          />

          <DialogTitle className="mt-5 text-[18px] font-bold leading-snug text-slate-900">
            ¿Cómo quieres utilizar CPF?
          </DialogTitle>

          <p className="mt-2 text-[14px] leading-relaxed text-slate-500">
            ¿Como candidato que busca empleo, o como empresa o establecimiento que
            busca un trabajador para cubrir un puesto?
          </p>

          <div className="mt-6 w-full space-y-3">
            <Button
              onClick={() => onElegir("candidato")}
              className="h-14 w-full rounded-2xl bg-[#01A89E] text-[15px] font-bold text-white hover:bg-[#018F86]"
            >
              <Briefcase className="mr-2 h-5 w-5" />
              Como Candidato Trabajador
            </Button>

            <Button
              onClick={() => onElegir("empresa")}
              variant="outline"
              className="h-14 w-full rounded-2xl border-2 border-[#F48221] text-[15px] font-bold text-[#F48221] hover:bg-[#F48221]/5"
            >
              <Building2 className="mr-2 h-5 w-5" />
              Como Empresa
            </Button>
          </div>

          <p className="mt-4 text-[12px] leading-snug text-slate-400">
            Podrás cambiarlo cuando quieras.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
