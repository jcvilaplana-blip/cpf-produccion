import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { AlertCircle } from "lucide-react"
import Image from "next/image"

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-background to-secondary">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-6">
          <div className="flex justify-center mb-4">
            <Image src="/logo-cpf.png" alt="CamareroPorFavor" width={180} height={60} style={{ width: '180px', height: 'auto' }} priority />
          </div>
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <AlertCircle className="h-16 w-16 text-destructive" />
              </div>
              <CardTitle className="text-2xl font-bold">Error de Autenticación</CardTitle>
              <CardDescription>Hubo un problema al verificar tu cuenta</CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                El enlace de verificación puede haber expirado o ser inválido. Por favor, intenta registrarte nuevamente
                o contacta con soporte.
              </p>
              <div className="flex flex-col gap-2">
                <Button asChild className="w-full bg-primary hover:bg-primary/90">
                  <Link href="/create-profile">Volver a Registrarse</Link>
                </Button>
                <Button asChild variant="outline" className="w-full bg-transparent">
                  <Link href="/auth/login">Iniciar Sesión</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
