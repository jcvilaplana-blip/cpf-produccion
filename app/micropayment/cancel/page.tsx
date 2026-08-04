"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { XCircle } from "lucide-react"
import Link from "next/link"

function MicropaymentCancelContent() {
  const searchParams = useSearchParams()
  const mpId = searchParams.get("mp_id")

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-50 p-4">
      <Card className="max-w-md w-full shadow-xl">
        <CardContent className="pt-8 pb-6 px-6 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Pago cancelado</h1>
          <p className="text-muted-foreground mb-6">
            No se ha realizado ningún cargo. Puedes volver a intentarlo cuando quieras.
          </p>
          <Button asChild className="w-full bg-[#01A89E] hover:bg-[#01A89E]/90">
            <Link href="/my-jobs">Volver a Mis Ofertas</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default function MicropaymentCancelPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <MicropaymentCancelContent />
    </Suspense>
  )
}
