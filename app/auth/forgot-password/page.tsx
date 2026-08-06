"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import Image from "next/image"
import { X, CheckCircle2 } from "lucide-react"
import { useLanguage } from "@/lib/i18n/language-context"

export default function ForgotPasswordPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const [identifier, setIdentifier] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading) return

    setIsLoading(true)
    setError(null)

    try {
      const value = identifier.trim()
      const body = value.includes("@") ? { email: value } : { phone: value }

      const res = await fetch("/api/email/recuperar-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        setError("Error al procesar la solicitud. Inténtalo de nuevo.")
        setIsLoading(false)
        return
      }

      // Always show the same success state regardless of whether the
      // account was found - avoids revealing which emails/phones are
      // registered.
      setSent(true)
    } catch {
      setError("Error inesperado. Inténtalo de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-background to-secondary">
      <button
        onClick={() => router.push("/auth/login")}
        className="fixed right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors z-50 bg-white dark:bg-gray-900 shadow-md"
        style={{ top: "calc(1rem + env(safe-area-inset-top, 0px))" }}
        aria-label={t("common.close")}
      >
        <X className="h-6 w-6" />
      </button>

      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          {/* Mismo bloque que el login: lazo y marca completa debajo. */}
          {/* Medidas calculadas desde la imagen de referencia, no a ojo.
              Ambos PNG llevan margen transparente propio (el lazo, 122px por
              debajo sobre 512), así que el hueco visible no es el declarado:
              de ahí el margen negativo. Sobre el ancho de la tarjeta, el lazo
              ocupa el 26%, el texto el 64% y la separación entre ellos el 3%. */}
          <div className="mb-7 flex flex-col items-center">
            <Image
              src="/lazo-512-transp.png"
              alt=""
              aria-hidden="true"
              width={134}
              height={134}
              className="h-auto w-[134px]"
              priority
            />
            <Image
              src="/logo-completo-texto-APP.png"
              alt="CamareroPorFavor"
              width={255}
              height={53}
              className="-mt-[28px] h-auto w-[255px] max-w-full"
              priority
            />
          </div>
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">{t("auth.forgotPassword")}</CardTitle>
              <CardDescription>
                Introduce tu correo electrónico o número de teléfono y te enviaremos un enlace para restablecer tu contraseña.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sent ? (
                <div className="flex flex-col items-center gap-4 text-center py-4">
                  <CheckCircle2 className="h-12 w-12 text-primary" />
                  <p className="text-sm text-muted-foreground">
                    Si la cuenta existe, recibirás un enlace para restablecer tu contraseña en su email.
                  </p>
                  <Link href="/auth/login" className="text-primary font-semibold underline underline-offset-4 text-sm">
                    Volver a Iniciar Sesión
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="flex flex-col gap-6">
                    <div className="grid gap-2">
                      <Label htmlFor="identifier">{t("auth.emailOrPhone")}</Label>
                      <Input
                        id="identifier"
                        type="text"
                        placeholder={t("auth.emailOrPhonePlaceholder")}
                        required
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                      />
                    </div>
                    {error && <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">{error}</div>}
                    <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
                      {isLoading ? "Enviando..." : "Enviar enlace de recuperación"}
                    </Button>
                  </div>
                  <div className="mt-4 text-center text-sm">
                    <Link href="/auth/login" className="text-muted-foreground underline underline-offset-4 hover:text-foreground">
                      Volver a Iniciar Sesión
                    </Link>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
