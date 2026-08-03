"use client"

import type React from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Home,
  Search,
  Heart,
  User,
  Plus,
  MessageCircle,
  Bell,
  HelpCircle,
  Moon,
  Sun,
  Globe,
  Share2,
  Star,
  FileText,
  Shield,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { X } from "lucide-react"
import { useLanguage } from "@/lib/i18n/language-context"
import { useAuth } from "@/hooks/use-auth"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LayoutDashboard, MapPin, Settings, Pencil } from "lucide-react"

export function GlobalBottomNavigation(): React.JSX.Element | null {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isAuthenticated, logout } = useAuth()
  // Shim kept in the same shape the rest of this file already reads, so the
  // large JSX below (many `profile?.x` references) needs no other changes.
  // The actual session lives in one shared AuthProvider (see
  // components/providers/auth-provider.tsx) - this component no longer runs
  // its own independent auth subscription.
  const profile = user
    ? { user_type: user.userType, is_admin: user.userType === "admin", display_name: user.displayName, avatar_url: user.avatarUrl }
    : null
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showMenuModal, setShowMenuModal] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const { language, setLanguage, t } = useLanguage()

  // isLoggedIn must reflect "is there a session" (isAuthenticated), NOT "has
  // the full profile row finished loading" (!!user/profile). The session
  // resolves before the profile fetch does, so keying this off the profile
  // meant a real, logged-in user tapping "Perfil" in that brief window saw
  // the login link instead of their account menu - a race, not a permanent
  // bug, which is why it only happened "sometimes". Fields that DO depend on
  // the profile (display name, avatar, business-vs-worker layout) still fall
  // back gracefully below until it arrives a moment later.
  const isLoggedIn = isAuthenticated
  const effectiveUserType = profile?.user_type
  const isAdmin = profile?.is_admin
  const displayName = profile?.display_name || "Usuario"
  const avatarUrl = profile?.avatar_url
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)

  const getProfilePath = () => {
    if (isAdmin) return "/admin"
    if (effectiveUserType === "business") return "/business-dashboard"
    return "/dashboard"
  }

  const handleLogout = logout

  const ringColor = "ring-[#01A89E]"

  // Anonymous visitors on the homepage get the same "any tap goes to
  // login" gate as the rest of the homepage (see landing-content.tsx) -
  // scoped to "/" only, using onClickCapture so it never interferes with
  // this nav's own gestures/clicks anywhere else in the app.
  const handleHomeGateClick = (e: React.MouseEvent) => {
    if (pathname !== "/" || isLoggedIn) return
    e.preventDefault()
    e.stopPropagation()
    router.push("/auth/login")
  }

  useEffect(() => {
    const root = document.documentElement
    if (darkMode) {
      root.classList.add("dark")
      root.style.colorScheme = "dark"
    } else {
      root.classList.remove("dark")
      root.style.colorScheme = "light"
    }
  }, [darkMode])

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    window.scrollTo({ top: 0, behavior: "instant" })
  }

  const isActive = (path: string) => pathname === path

  const handleCenterButtonClick = () => {
    if (!profile) {
      setShowMenuModal(true)
      return
    }

    if (profile.user_type === "business") {
      window.scrollTo({ top: 0, behavior: "instant" })
      router.push("/jobs/create")
    } else {
      setShowMenuModal(true)
    }
  }

  const handleShare = async () => {
    const shareData = {
      title: "CamareroPorFavor",
      text: "Te recomiendo que tengas en tu movil CamareroPorFavor, es util y esta muy bien.",
      url: window.location.origin,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (err) {
        console.log("Error sharing:", err)
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`)
      alert("Enlace copiado al portapapeles")
    }
  }

  const handleRate = () => {
    // Open app store or rating page
    window.open("https://www.google.com/search?q=CamareroPorFavor", "_blank")
  }

  if (pathname?.startsWith("/auth/") || pathname === "/reels" || pathname?.startsWith("/admin") || pathname === "/complete-profile" || pathname === "/create-profile") {
    return null
  }

  // Business navigation
  if (profile?.user_type === "business") {
    return (
      <>
<nav className="global-bottom-nav fixed bottom-0 left-0 right-0 z-50 bg-background dark:bg-gray-900 border-t border-border shadow-lg pb-[env(safe-area-inset-bottom,0px)]" onClickCapture={handleHomeGateClick}>
  <div className="grid grid-cols-5 gap-1 p-2 pb-1 max-w-screen-xl mx-auto">
  <Link
  href="/business-dashboard"
              onClick={handleNavClick}
              className={cn(
                "flex flex-col items-center justify-center py-2 rounded-md transition-colors",
                isActive("/business-dashboard")
                  ? "text-[#01A89E] bg-teal-50 dark:bg-teal-950"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800",
              )}
            >
              <Home className="h-5 w-5" />
              <span className="text-xs mt-1">{t("navigation.home")}</span>
            </Link>

            <Link
              href="/search"
              onClick={handleNavClick}
              className={cn(
                "flex flex-col items-center justify-center py-2 rounded-md transition-colors",
                isActive("/search")
                  ? "text-[#01A89E] bg-teal-50 dark:bg-teal-950"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800",
              )}
            >
              <Search className="h-5 w-5" />
              <span className="text-xs mt-1">{t("navigation.search")}</span>
            </Link>

          <button onClick={handleCenterButtonClick} className="flex flex-col items-center justify-center">
            <div className={cn("bg-[#01A89E] text-white rounded-full p-3 -mt-6 shadow-lg hover:bg-[#018F86] transition-all duration-300", showMenuModal && "rotate-45 bg-[#E73A36] hover:bg-[#c62d2a]")}>
              <Plus className="h-6 w-6" />
            </div>
          </button>

            <Link
              href="/favorites"
              onClick={handleNavClick}
              className={cn(
                "flex flex-col items-center justify-center py-2 rounded-md transition-colors",
                isActive("/favorites")
                  ? "text-[#01A89E] bg-teal-50 dark:bg-teal-950"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800",
              )}
            >
              <Heart className="h-5 w-5" />
              <span className="text-xs mt-1">{t("navigation.saved")}</span>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    "flex flex-col items-center justify-center py-2 rounded-md transition-colors w-full",
                    isActive("/business-dashboard") || isActive("/business-profile") || isActive("/admin")
                      ? "text-[#01A89E] bg-teal-50 dark:bg-teal-950"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800",
                  )}
                >
                  {avatarUrl ? (
                    <Avatar className={`h-6 w-6 ring-1 ${ringColor}`}>
                      <AvatarImage src={avatarUrl} alt={displayName} />
                      <AvatarFallback className="bg-[#01A89E] text-white text-[8px]">{initials}</AvatarFallback>
                    </Avatar>
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                  <span className="text-xs mt-1">{t("navigation.profile")}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="top" className="w-56 mb-2">
                <div className="flex items-center gap-2 p-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={avatarUrl || undefined} alt={displayName} />
                    <AvatarFallback className="bg-[#01A89E] text-white text-xs">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <p className="text-sm font-medium">{displayName}</p>
                    <p className="text-xs text-muted-foreground">{t("topNav.business")}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                {isAdmin && (
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/admin"><Shield className="mr-2 h-4 w-4" /><span>Panel Admin</span></Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/business-dashboard"><LayoutDashboard className="mr-2 h-4 w-4" /><span>{t("topNav.myDashboard")}</span></Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/business-profile"><Pencil className="mr-2 h-4 w-4" /><span>{t("topNav.viewProfile")}</span></Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/search"><MapPin className="mr-2 h-4 w-4" /><span>Buscador</span></Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/settings"><Settings className="mr-2 h-4 w-4" /><span>{t("topNav.settings")}</span></Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                  <LogOut className="mr-2 h-4 w-4" /><span>{t("topNav.logout")}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </nav>

        {/* Emergent Menu Overlay */}
        {showMenuModal && (
          <>
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] animate-in fade-in duration-200" onClick={() => setShowMenuModal(false)} />
            <div className="fixed bottom-0 left-0 right-0 z-[61] animate-in slide-in-from-bottom duration-300">
              <div className="bg-background dark:bg-gray-900 rounded-t-3xl shadow-2xl max-h-[80vh] overflow-y-auto pb-safe">
                {/* Handle bar */}
                <div className="flex justify-center pt-3 pb-1">
                  <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                </div>
                {/* Header */}
                <div className="flex items-center justify-between px-5 pb-3">
                  <h2 className="text-lg font-bold">{t("navigation.menu")}</h2>
                  <button onClick={() => setShowMenuModal(false)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                </div>
                {/* Grid menu items */}
                <div className="grid grid-cols-4 gap-1 px-4 pb-4">
                  <Link href="/messages" onClick={() => setShowMenuModal(false)} className="flex flex-col items-center gap-1.5 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95 transition-all">
                    <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center">
                      <MessageCircle className="h-6 w-6 text-teal-600" />
                    </div>
                    <span className="text-xs font-medium text-center leading-tight">Chat</span>
                  </Link>
                  <Link href="/notifications" onClick={() => setShowMenuModal(false)} className="flex flex-col items-center gap-1.5 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95 transition-all">
                    <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center">
                      <Bell className="h-6 w-6 text-teal-600" />
                    </div>
                    <span className="text-xs font-medium text-center leading-tight">{t("navigation.notifications")}</span>
                  </Link>
                  <Link href="/help" onClick={() => setShowMenuModal(false)} className="flex flex-col items-center gap-1.5 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95 transition-all">
                    <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center">
                      <HelpCircle className="h-6 w-6 text-teal-600" />
                    </div>
                    <span className="text-xs font-medium text-center leading-tight">{t("navigation.help")}</span>
                  </Link>
                  <button onClick={() => { setDarkMode(!darkMode) }} className="flex flex-col items-center gap-1.5 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95 transition-all">
                    <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center">
                      {darkMode ? <Moon className="h-6 w-6 text-teal-600" /> : <Sun className="h-6 w-6 text-teal-600" />}
                    </div>
                    <span className="text-xs font-medium text-center leading-tight">{darkMode ? "Oscuro" : "Claro"}</span>
                  </button>
                  <button onClick={() => { handleShare(); setShowMenuModal(false) }} className="flex flex-col items-center gap-1.5 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95 transition-all">
                    <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center">
                      <Share2 className="h-6 w-6 text-teal-600" />
                    </div>
                    <span className="text-xs font-medium text-center leading-tight">Compartir</span>
                  </button>
                  <button onClick={() => { handleRate(); setShowMenuModal(false) }} className="flex flex-col items-center gap-1.5 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95 transition-all">
                    <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center">
                      <Star className="h-6 w-6 text-teal-600" />
                    </div>
                    <span className="text-xs font-medium text-center leading-tight">Valorar</span>
                  </button>
                  <Link href="/terms" onClick={() => setShowMenuModal(false)} className="flex flex-col items-center gap-1.5 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95 transition-all">
                    <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center">
                      <FileText className="h-6 w-6 text-teal-600" />
                    </div>
                    <span className="text-xs font-medium text-center leading-tight">Terminos</span>
                  </Link>
                  <Link href="/privacy" onClick={() => setShowMenuModal(false)} className="flex flex-col items-center gap-1.5 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95 transition-all">
                    <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center">
                      <Shield className="h-6 w-6 text-teal-600" />
                    </div>
                    <span className="text-xs font-medium text-center leading-tight">Privacidad</span>
                  </Link>
                </div>
                {/* Language selector */}
                <div className="px-5 pb-5 pt-1 border-t border-gray-100 dark:border-gray-800">
                  <Label className="flex items-center gap-2 mb-2.5 text-sm font-semibold text-muted-foreground">
                    <Globe className="h-4 w-4" />
                    {t("menu.language")}
                  </Label>
                  <div className="flex gap-2">
                    <Button variant={language === "es" ? "default" : "outline"} size="sm" className="flex-1 h-10 rounded-xl" onClick={() => setLanguage("es")}>
                      {t("common.spanish")}
                    </Button>
                    <Button variant={language === "en" ? "default" : "outline"} size="sm" className="flex-1 h-10 rounded-xl" onClick={() => setLanguage("en")}>
                      {t("common.english")}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </>
    )
  }

  // Worker or guest navigation
  return (
    <>
<nav className="global-bottom-nav fixed bottom-0 left-0 right-0 z-50 bg-background dark:bg-gray-900 border-t border-border shadow-lg pb-[env(safe-area-inset-bottom,0px)]" onClickCapture={handleHomeGateClick}>
  <div className="grid grid-cols-5 gap-1 p-2 pb-1 max-w-screen-xl mx-auto">
  <Link
  href="/"
            onClick={handleNavClick}
            className={cn(
              "flex flex-col items-center justify-center py-2 rounded-md transition-colors",
              isActive("/")
                ? "text-[#01A89E] bg-teal-50 dark:bg-teal-950"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800",
            )}
          >
            <Home className="h-5 w-5" />
            <span className="text-xs mt-1">{t("navigation.home")}</span>
          </Link>

          <Link
            href="/search"
            onClick={handleNavClick}
            className={cn(
              "flex flex-col items-center justify-center py-2 rounded-md transition-colors",
              isActive("/search")
                ? "text-[#01A89E] bg-teal-50 dark:bg-teal-950"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800",
            )}
          >
            <Search className="h-5 w-5" />
            <span className="text-xs mt-1">{t("navigation.search")}</span>
          </Link>

          <button onClick={handleCenterButtonClick} className="flex flex-col items-center justify-center">
            <div className={cn("bg-[#01A89E] text-white rounded-full p-3 -mt-6 shadow-lg hover:bg-[#018F86] transition-all duration-300", showMenuModal && "rotate-45 bg-[#E73A36] hover:bg-[#c62d2a]")}>
              <Plus className="h-6 w-6" />
            </div>
          </button>

          <Link
            href="/saved"
            onClick={handleNavClick}
            className={cn(
              "flex flex-col items-center justify-center py-2 rounded-md transition-colors",
              isActive("/saved")
                ? "text-[#01A89E] bg-teal-50 dark:bg-teal-950"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800",
            )}
          >
            <Heart className="h-5 w-5" />
            <span className="text-xs mt-1">{t("navigation.saved")}</span>
          </Link>

          {isLoggedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    "flex flex-col items-center justify-center py-2 rounded-md transition-colors w-full",
                    isActive("/dashboard") || isActive("/profile") || isActive("/admin")
                      ? "text-[#01A89E] bg-teal-50 dark:bg-teal-950"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800",
                  )}
                >
                  {avatarUrl ? (
                    <Avatar className={`h-6 w-6 ring-1 ${ringColor}`}>
                      <AvatarImage src={avatarUrl} alt={displayName} />
                      <AvatarFallback className="bg-[#01A89E] text-white text-[8px]">{initials}</AvatarFallback>
                    </Avatar>
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                  <span className="text-xs mt-1">{t("navigation.profile")}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="top" className="w-56 mb-2">
                <div className="flex items-center gap-2 p-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={avatarUrl || undefined} alt={displayName} />
                    <AvatarFallback className="bg-[#01A89E] text-white text-xs">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <p className="text-sm font-medium">{displayName}</p>
                    <p className="text-xs text-muted-foreground">{t("topNav.worker")}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                {isAdmin && (
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/admin"><Shield className="mr-2 h-4 w-4" /><span>Panel Admin</span></Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href={getProfilePath()}><LayoutDashboard className="mr-2 h-4 w-4" /><span>{t("topNav.myDashboard")}</span></Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/edit-profile"><Pencil className="mr-2 h-4 w-4" /><span>{t("topNav.viewProfile")}</span></Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/search"><MapPin className="mr-2 h-4 w-4" /><span>Buscador</span></Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/settings"><Settings className="mr-2 h-4 w-4" /><span>{t("topNav.settings")}</span></Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                  <LogOut className="mr-2 h-4 w-4" /><span>{t("topNav.logout")}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              href="/auth/login"
              onClick={handleNavClick}
              className={cn(
                "flex flex-col items-center justify-center py-2 rounded-md transition-colors",
                isActive("/auth/login")
                  ? "text-[#01A89E] bg-teal-50 dark:bg-teal-950"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800",
              )}
            >
              <User className="h-5 w-5" />
              <span className="text-xs mt-1">{t("navigation.profile")}</span>
            </Link>
          )}
        </div>
      </nav>

      {/* Emergent Menu Overlay */}
      {showMenuModal && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] animate-in fade-in duration-200" onClick={() => setShowMenuModal(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-[61] animate-in slide-in-from-bottom duration-300">
            <div className="bg-background dark:bg-gray-900 rounded-t-3xl shadow-2xl max-h-[80vh] overflow-y-auto pb-safe">
              {/* Handle bar */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
              </div>
              {/* Header */}
              <div className="flex items-center justify-between px-5 pb-3">
                <h2 className="text-lg font-bold">{t("navigation.menu")}</h2>
                <button onClick={() => setShowMenuModal(false)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              {/* Grid menu items */}
              <div className="grid grid-cols-4 gap-1 px-4 pb-4">
                <Link href="/messages" onClick={() => setShowMenuModal(false)} className="flex flex-col items-center gap-1.5 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95 transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center">
                    <MessageCircle className="h-6 w-6 text-teal-600" />
                  </div>
                  <span className="text-xs font-medium text-center leading-tight">Chat</span>
                </Link>
                <Link href="/notifications" onClick={() => setShowMenuModal(false)} className="flex flex-col items-center gap-1.5 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95 transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center">
                    <Bell className="h-6 w-6 text-teal-600" />
                  </div>
                  <span className="text-xs font-medium text-center leading-tight">{t("navigation.notifications")}</span>
                </Link>
                <Link href="/help" onClick={() => setShowMenuModal(false)} className="flex flex-col items-center gap-1.5 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95 transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center">
                    <HelpCircle className="h-6 w-6 text-teal-600" />
                  </div>
                  <span className="text-xs font-medium text-center leading-tight">{t("navigation.help")}</span>
                </Link>
                <button onClick={() => { setDarkMode(!darkMode) }} className="flex flex-col items-center gap-1.5 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95 transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center">
                    {darkMode ? <Moon className="h-6 w-6 text-teal-600" /> : <Sun className="h-6 w-6 text-teal-600" />}
                  </div>
                  <span className="text-xs font-medium text-center leading-tight">{darkMode ? "Oscuro" : "Claro"}</span>
                </button>
                <button onClick={() => { handleShare(); setShowMenuModal(false) }} className="flex flex-col items-center gap-1.5 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95 transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center">
                    <Share2 className="h-6 w-6 text-teal-600" />
                  </div>
                  <span className="text-xs font-medium text-center leading-tight">Compartir</span>
                </button>
                <button onClick={() => { handleRate(); setShowMenuModal(false) }} className="flex flex-col items-center gap-1.5 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95 transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center">
                    <Star className="h-6 w-6 text-teal-600" />
                  </div>
                  <span className="text-xs font-medium text-center leading-tight">Valorar</span>
                </button>
                <Link href="/terms" onClick={() => setShowMenuModal(false)} className="flex flex-col items-center gap-1.5 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95 transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-teal-600" />
                  </div>
                  <span className="text-xs font-medium text-center leading-tight">Terminos</span>
                </Link>
                <Link href="/privacy" onClick={() => setShowMenuModal(false)} className="flex flex-col items-center gap-1.5 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95 transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center">
                    <Shield className="h-6 w-6 text-teal-600" />
                  </div>
                  <span className="text-xs font-medium text-center leading-tight">Privacidad</span>
                </Link>
              </div>
              {/* Language selector */}
              <div className="px-5 pb-5 pt-1 border-t border-gray-100 dark:border-gray-800">
                <Label className="flex items-center gap-2 mb-2.5 text-sm font-semibold text-muted-foreground">
                  <Globe className="h-4 w-4" />
                  {t("menu.language")}
                </Label>
                <div className="flex gap-2">
                  <Button variant={language === "es" ? "default" : "outline"} size="sm" className="flex-1 h-10 rounded-xl" onClick={() => setLanguage("es")}>
                    {t("common.spanish")}
                  </Button>
                  <Button variant={language === "en" ? "default" : "outline"} size="sm" className="flex-1 h-10 rounded-xl" onClick={() => setLanguage("en")}>
                    {t("common.english")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
