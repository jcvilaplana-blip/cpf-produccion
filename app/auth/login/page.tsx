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
import { X, Eye, EyeOff } from "lucide-react"
import { useLanguage } from "@/lib/i18n/language-context"
import { createClient } from "@/lib/supabase/client"

export default function LoginPage() {
  const { t } = useLanguage()
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading) return

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // The identifier field accepts either an email or a phone number.
      // Phone numbers aren't a real Supabase auth identity, so resolve to
      // the account's email server-side first, then sign in normally.
      let loginEmail = identifier.trim()
      if (!loginEmail.includes("@")) {
        const res = await fetch("/api/auth/resolve-phone", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: loginEmail }),
        })
        const { email: resolvedEmail } = await res.json()
        if (!resolvedEmail) {
          // Same generic error as a wrong password - don't reveal whether
          // the phone number is registered.
          setError(t("auth.incorrectPassword"))
          setIsLoading(false)
          return
        }
        loginEmail = resolvedEmail
      }

      // Sign in with password
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      })

      if (authError) {
        if (authError.message.includes("Invalid login credentials")) {
          setError(t("auth.incorrectPassword"))
        } else if (authError.message.includes("Email not confirmed")) {
          setError("Debes confirmar tu email antes de iniciar sesión.")
        } else {
          setError(authError.message)
        }
        setIsLoading(false)
        return
      }

      if (!data.user) {
        setError("No se pudo iniciar sesión")
        setIsLoading(false)
        return
      }

      // Get profile to determine redirect. Bounded with a timeout - this
      // query can occasionally stall (the same supabase-js session-lock
      // contention documented elsewhere in this app), and a hung request
      // here must never leave the user stuck on a spinner forever with no
      // way forward.
      const profileQuery = supabase
        .from("profiles")
        .select("is_admin, user_type, rol, profile_completed")
        .eq("id", data.user.id)
        .single()
      const timeout = new Promise<"timeout">((resolve) => setTimeout(() => resolve("timeout"), 8000))
      const result = await Promise.race([profileQuery, timeout])

      if (result === "timeout") {
        setError("La conexión está tardando más de lo normal. Vuelve a intentarlo.")
        setIsLoading(false)
        return
      }

      const { data: profile, error: profileError } = result

      // If no profile exists, redirect to create profile
      if (profileError || !profile) {
        window.location.href = "/create-profile"
        return
      }

      // Determine redirect URL based on user type
      let redirectUrl = "/dashboard"

      const isBusiness = profile.user_type === "business" || profile.rol === 3
      const isAdmin = profile.is_admin === true || profile.rol === 1 || profile.user_type === "admin"

      if (isAdmin) {
        redirectUrl = "/admin"
      } else if (!profile.profile_completed) {
        redirectUrl = "/create-profile"
      } else if (isBusiness) {
        redirectUrl = "/business-dashboard"
      }

      // If middleware redirected here from a protected page (?next=...),
      // send the user back there instead of their default dashboard -
      // but only once we know they have a real, completed profile.
      const next = new URLSearchParams(window.location.search).get("next")
      if (next && next.startsWith("/") && profile.profile_completed) {
        redirectUrl = next
      }

      // Use window.location for full page reload to ensure cookies are set
      setTimeout(() => { window.location.href = redirectUrl }, 500)
      
    } catch {
      setError("Error inesperado. Intentalo de nuevo.")
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (authError) {
        setError("Error al iniciar sesión con Google")
        setIsLoading(false)
      }
    } catch {
      setError("Error al iniciar sesión con Google")
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-background to-secondary">
      <button
        onClick={() => router.push("/")}
        className="fixed right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors z-50 bg-white dark:bg-gray-900 shadow-md"
        style={{ top: "calc(1rem + env(safe-area-inset-top, 0px))" }}
        aria-label={t("common.close")}
      >
        <X className="h-6 w-6" />
      </button>

      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          {/* Lazo + marca completa debajo. Las medidas mantienen la proporción
              de la referencia: el texto ocupa unas 2,4 veces el ancho del lazo,
              con una separación corta entre ambos. */}
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
              <CardTitle className="text-2xl font-bold">{t("auth.loginTitle")}</CardTitle>
              <CardDescription>{t("auth.loginSubtitle")}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin}>
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
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">{t("auth.password")}</Label>
                      <Link
                        href="/auth/forgot-password"
                        className="text-[13px] text-primary underline underline-offset-4"
                      >
                        {t("auth.forgotPassword")}
                      </Link>
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  {error && <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">{error}</div>}
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
                    {isLoading ? t("auth.loggingIn") : t("auth.loginTitle")}
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-[13px] uppercase">
                      <span className="bg-card px-2 text-muted-foreground">{t("auth.orContinueWith")}</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full bg-transparent"
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                  >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    {t("auth.continueWithGoogle")}
                  </Button>
                </div>
                <div className="mt-4 text-center text-sm">
                  {t("auth.noAccount")}{" "}
                  <Link href="/auth/sign-up" className="text-primary font-semibold underline underline-offset-4">
                    {t("auth.signUp")}
                  </Link>
                </div>
                <div className="mt-3 text-center text-sm">
                  <Link href="/" className="text-muted-foreground underline underline-offset-4 hover:text-foreground">
                    Volver al Inicio
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
