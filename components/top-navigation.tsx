"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { LogOut, LayoutDashboard, MapPin, Shield, Pencil } from "lucide-react"
import type { Profile } from "@/lib/types"
import { useLanguage } from "@/lib/i18n/language-context"
import { createClient } from "@/lib/supabase/client"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function TopNavigation() {
  const { t } = useLanguage()
  const router = useRouter()
  const pathname = usePathname()
  const [profile, setProfile] = useState<Profile | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()
        if (data) setProfile(data as Profile)
      }
    }
    loadProfile()
  }, [supabase])

  if (pathname?.startsWith("/auth/") || pathname === "/reels" || pathname?.startsWith("/admin")) {
    return null
  }

  if (!profile) return null

  const displayName = profile.display_name || "Usuario"
  const avatarUrl = profile.avatar_url
  const userType = profile.user_type
  const isAdmin = profile.is_admin
  const roleLabel = userType === "business" ? t("topNav.business") : t("topNav.worker")
  const initials = displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-transparent pointer-events-none hidden md:block">
      <div className="container flex h-14 items-center justify-between px-4">
        {isAdmin ? (
          <Link href="/admin" className="flex items-center gap-2 pointer-events-auto">
            <img src="/logo-cpf.png" alt="CamareroPorFavor" className="h-8 w-auto rounded-full drop-shadow-md" />
          </Link>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-2 pr-1 pointer-events-auto">
          <DropdownMenu>
            <DropdownMenuTrigger className="focus:outline-none">
              <Avatar className="h-9 w-9 cursor-pointer ring-2 ring-[#01A89E] ring-offset-2 shadow-lg">
                <AvatarImage src={avatarUrl || undefined} alt={displayName} />
                <AvatarFallback className="bg-[#01A89E] text-white">{initials}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="flex items-center gap-2 p-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={avatarUrl || undefined} alt={displayName} />
                  <AvatarFallback className="bg-[#01A89E] text-white text-xs">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <p className="text-sm font-medium">{displayName}</p>
                  <p className="text-xs text-muted-foreground">{roleLabel}</p>
                </div>
              </div>
              <DropdownMenuSeparator />
              {isAdmin && (
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/admin">
                    <Shield className="mr-2 h-4 w-4" />
                    <span>Panel Admin</span>
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href={userType === "business" ? "/business-profile" : "/edit-profile"}>
                  <Pencil className="mr-2 h-4 w-4" />
                  <span>{t("topNav.viewProfile")}</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href={userType === "business" ? "/business-dashboard" : "/dashboard"}>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  <span>{t("topNav.myDashboard")}</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/search">
                  <MapPin className="mr-2 h-4 w-4" />
                  <span>Buscador</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>{t("topNav.logout")}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
