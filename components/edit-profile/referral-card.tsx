"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Gift, Copy, Check } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

// +150pts once a referred signup completes their profile - see
// lib/actions.ts (updateProfileAction/updateBusinessProfileAction) for
// where the payout actually fires.
export function ReferralCard({ referralCode }: { referralCode?: string | null }) {
  const [completedCount, setCompletedCount] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!referralCode) return
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { count } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("referred_by", user.id)
        .not("profile_completed_at", "is", null)
      setCompletedCount(count || 0)
    })
  }, [referralCode])

  if (!referralCode) return null

  // /auth/sign-up redirects to /create-profile without forwarding query
  // params, so the referral link points straight at the wizard.
  const link = typeof window !== "undefined" ? `${window.location.origin}/create-profile?ref=${referralCode}` : ""

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  return (
    <Card className="border-0 shadow-sm overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-[#F48221]/10 to-transparent pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Gift className="w-4 h-4 text-[#F48221]" />
          Invita a un amigo
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-3">
        <p className="text-[13px] text-muted-foreground">
          Gana 150 puntos por cada persona que se registre con tu enlace y complete su perfil.
        </p>
        <div className="flex gap-2">
          <Input readOnly value={link} className="text-[13px]" />
          <Button type="button" variant="outline" size="icon" onClick={handleCopy} className="flex-shrink-0">
            {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
        {completedCount !== null && (
          <p className="text-[13px] text-muted-foreground">
            {completedCount} {completedCount === 1 ? "amigo ha completado" : "amigos han completado"} su perfil gracias a ti.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
