"use client"

import { Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CheckCircle2, Video } from "lucide-react"
import Image from "next/image"
import { useSearchParams } from "next/navigation"

function SignUpSuccessInner() {
  const searchParams = useSearchParams()
  const videoPending = searchParams.get("video_pending") === "1"

  return (
    <Card className="shadow-lg">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <CheckCircle2 className="h-16 w-16 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold">¡Cuenta Creada!</CardTitle>
        <CardDescription>Revisa tu correo electrónico</CardDescription>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p className="text-sm text-muted-foreground">
          Te hemos enviado un correo de confirmación. Por favor, haz clic en el enlace del correo para verificar
          tu cuenta y poder iniciar sesión.
        </p>
        {videoPending && (
          <div className="flex items-start gap-2 text-left text-sm bg-primary/5 border border-primary/20 rounded-lg p-3">
            <Video className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <p className="text-muted-foreground">
              Tu video reel no se subió durante el registro. En cuanto confirmes tu correo e inicies sesión,
              súbelo desde tu perfil.
            </p>
          </div>
        )}
        <Button asChild className="w-full bg-primary hover:bg-primary/90">
          <Link href="/auth/login">Ir a Iniciar Sesión</Link>
        </Button>
      </CardContent>
    </Card>
  )
}

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-background to-secondary">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-6">
          <div className="flex justify-center mb-4">
            <Image src="/logo-cpf.png" alt="CamareroPorFavor" width={180} height={60} style={{ width: '180px', height: 'auto' }} priority />
          </div>
          <Suspense fallback={null}>
            <SignUpSuccessInner />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
