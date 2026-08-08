"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { LogIn, LogOut, Trash2 } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"

/**
 * Enlaces legales y acciones de cuenta para el pie de los paneles.
 *
 * Está en un componente aparte porque candidato y establecimiento necesitan
 * exactamente lo mismo, y el borrado de cuenta no distingue entre roles: el
 * endpoint elimina el usuario de autenticación y el esquema arrastra en
 * cascada todo lo que cuelga de él, sea del tipo que sea.
 */
export function AccountFooterLinks() {
  const router = useRouter()
  const { logout } = useAuth()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  /**
   * Cierra la sesión y deja al usuario en la portada como anónimo.
   *
   * No cierra la aplicación: es la salida para quien quiere dejar de estar
   * identificado -o cambiar de cuenta- sin abandonar CPF.
   */
  const handleSignOut = async () => {
    await logout()
    toast.success("Sesión cerrada")
    router.push("/")
  }

  const handleExit = async () => {
    await logout()
    // En el móvil, "Salir de CPF" además cierra la aplicación. En el
    // navegador no se puede cerrar una pestaña que no abrimos nosotros, así
    // que allí la sesión cerrada y la vuelta al inicio es todo lo que cabe.
    try {
      const { Capacitor } = await import("@capacitor/core")
      if (Capacitor.isNativePlatform() && Capacitor.isPluginAvailable("App")) {
        const { App } = await import("@capacitor/app")
        await App.exitApp()
      }
    } catch {
      // Sin Capacitor disponible no hay nada que cerrar.
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      // El cuerpo JSON no lo lee el servidor, pero tiene que ir: el WAF del
      // hosting (ModSecurity) responde 403 a los POST sin cuerpo y la petición
      // ni siquiera llega a la aplicación. Comprobado contra el servidor: el
      // mismo POST sin cuerpo da 403, y con cuerpo llega y responde.
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: true }),
      })
      const json = await res.json().catch(() => ({}))

      if (!res.ok) {
        toast.error(json?.error || "No se ha podido eliminar la cuenta.")
        setDeleting(false)
        return
      }

      toast.success("Tu cuenta ha sido eliminada.")
      // La cuenta ya no existe, así que la sesión que quede en el navegador
      // es papel mojado: se cierra y se vuelve al inicio.
      await logout()
      router.push("/")
    } catch {
      toast.error("No se ha podido conectar con el servidor.")
      setDeleting(false)
    }
  }

  return (
    <>
      <div className="mt-8 border-t pt-5 pb-2">
        <nav className="flex flex-col items-center gap-3 text-center">
          <Link href="/terms" className="text-[14px] text-muted-foreground hover:text-foreground transition-colors">
            Términos y Condiciones
          </Link>
          <Link href="/privacy" className="text-[14px] text-muted-foreground hover:text-foreground transition-colors">
            Política de Privacidad
          </Link>
          <Link href="/legal/cookies" className="text-[14px] text-muted-foreground hover:text-foreground transition-colors">
            Política de Cookies
          </Link>

          {/* Dos salidas distintas, y la diferencia importa: cerrar sesión te
              devuelve a la portada como visitante anónimo, con la aplicación
              abierta; "Salir de CPF" además cierra la app en el móvil. */}
          <button
            onClick={handleSignOut}
            className="mt-1 inline-flex items-center gap-2 text-[14px] font-medium text-foreground hover:text-[#01A89E] transition-colors"
          >
            <LogIn className="h-4 w-4" />
            Cerrar Sesión
          </button>

          <button
            onClick={handleExit}
            className="inline-flex items-center gap-2 text-[14px] font-medium text-foreground hover:text-[#01A89E] transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Salir de CPF
          </button>

          <button
            onClick={() => setConfirmOpen(true)}
            className="inline-flex items-center gap-2 text-[14px] font-medium text-destructive hover:underline"
          >
            <Trash2 className="h-4 w-4" />
            Eliminar Cuenta
          </button>
        </nav>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={(open) => { if (!deleting) setConfirmOpen(open) }}>
        <AlertDialogContent className="max-w-[340px] rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[18px]">¿Eliminar tu cuenta?</AlertDialogTitle>
            <AlertDialogDescription className="text-[14px] leading-relaxed">
              Una vez que se elimine la cuenta no se podrán recuperar los datos ni la cuenta
              del usuario. Se eliminarán de la plataforma y de la base de datos de la
              aplicación.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDelete() }}
              disabled={deleting}
              className="w-full bg-destructive text-white hover:bg-destructive/90"
            >
              {deleting ? "Eliminando..." : "Sí, eliminar mi cuenta"}
            </AlertDialogAction>
            <AlertDialogCancel disabled={deleting} className="w-full mt-0">
              Cancelar
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
