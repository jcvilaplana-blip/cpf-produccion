"use client"

import { useEffect, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Coins, Loader2, Gift, Zap, Star, Palette, Crown } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { redeemRewardAction } from "@/lib/actions"
import { toast } from "sonner"

interface CatalogItem {
  key: string
  cost: number
  label: string
  icon: ReactNode
}

const WORKER_CATALOG: CatalogItem[] = [
  { key: "premium_profile", cost: 500, label: "Perfil Premium (7 días)", icon: <Crown className="h-5 w-5 text-[#F5A623]" /> },
  { key: "cosmetic_theme_bronze", cost: 100, label: "Personalización — Bronce", icon: <Palette className="h-5 w-5 text-amber-700" /> },
  { key: "cosmetic_theme_silver", cost: 150, label: "Personalización — Plata", icon: <Palette className="h-5 w-5 text-slate-400" /> },
  { key: "cosmetic_theme_gold", cost: 200, label: "Personalización — Oro", icon: <Palette className="h-5 w-5 text-yellow-500" /> },
]

const BUSINESS_CATALOG: CatalogItem[] = [
  { key: "premium_profile", cost: 500, label: "Perfil Premium (7 días)", icon: <Crown className="h-5 w-5 text-[#F5A623]" /> },
  { key: "free_flash_offer", cost: 300, label: "Oferta Flash gratuita", icon: <Zap className="h-5 w-5 text-[#F97316]" /> },
  { key: "highlight_credit", cost: 200, label: "Destacar oferta gratis", icon: <Star className="h-5 w-5 text-[#F48221]" /> },
  { key: "cosmetic_theme_bronze", cost: 100, label: "Personalización — Bronce", icon: <Palette className="h-5 w-5 text-amber-700" /> },
  { key: "cosmetic_theme_silver", cost: 150, label: "Personalización — Plata", icon: <Palette className="h-5 w-5 text-slate-400" /> },
  { key: "cosmetic_theme_gold", cost: 200, label: "Personalización — Oro", icon: <Palette className="h-5 w-5 text-yellow-500" /> },
]

export default function RewardsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userType, setUserType] = useState<"worker" | "business" | null>(null)
  const [points, setPoints] = useState(0)
  const [level, setLevel] = useState(1)
  const [redeeming, setRedeeming] = useState<string | null>(null)

  const load = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push("/auth/login"); return }

    const { data: profile } = await supabase.from("profiles").select("user_type, points, level").eq("id", user.id).single()
    const role = profile?.user_type === "business" ? "business" : "worker"
    setUserType(role)

    if (role === "business") {
      const { data: biz } = await supabase.from("business_profiles").select("points, level").eq("id", user.id).single()
      setPoints(biz?.points || 0)
      setLevel(biz?.level || 1)
    } else {
      setPoints(profile?.points || 0)
      setLevel(profile?.level || 1)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleRedeem = async (key: string) => {
    setRedeeming(key)
    const result = await redeemRewardAction(key)
    if (result.error) {
      toast.error(result.error === "No tienes puntos suficientes" ? result.error : "Error al canjear")
    } else {
      toast.success("¡Canjeado!")
      await load()
    }
    setRedeeming(null)
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#01A89E]" /></div>
  }

  const catalog = userType === "business" ? BUSINESS_CATALOG : WORKER_CATALOG

  return (
    <div className="min-h-screen bg-background pb-20 md:pt-14">
      <header className="sticky top-0 z-50 w-full bg-card/95 backdrop-blur border-b pt-[env(safe-area-inset-top,0px)]">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold flex items-center gap-2"><Gift className="h-5 w-5 text-[#F48221]" /> Recompensas</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
        <Card className="bg-gradient-to-r from-[#01A89E]/10 to-[#F48221]/10 border-0">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[13px] text-muted-foreground">Tu saldo</p>
              <p className="text-3xl font-bold flex items-center gap-2"><Coins className="h-6 w-6 text-[#F5A623]" /> {points} pts</p>
            </div>
            <Badge className="bg-[#01A89E]/10 text-[#01A89E] border-0 text-sm px-3 py-1.5">Nivel {level}</Badge>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {catalog.map((item) => (
            <Card key={item.key}>
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {item.icon}
                  <div>
                    <p className="text-sm font-semibold">{item.label}</p>
                    <p className="text-[13px] text-muted-foreground">{item.cost} pts</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  disabled={points < item.cost || redeeming === item.key}
                  onClick={() => handleRedeem(item.key)}
                  className="bg-[#01A89E] hover:bg-[#018F86]"
                >
                  {redeeming === item.key ? "Canjeando..." : "Canjear"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="text-[13px] text-muted-foreground text-center">
          Gana puntos completando tu perfil, siendo contratado, dejando valoraciones, invitando amigos y más.
          {" "}<Link href="/edit-profile" className="text-[#01A89E] underline">Ver cómo ganar puntos</Link>
        </p>
      </div>
    </div>
  )
}
