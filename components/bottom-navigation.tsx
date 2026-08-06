"use client"

import Link from "next/link"
import { usePathname } from "next/navigation" 
import { Briefcase, Bookmark, Plus, MessageCircle, User, Heart, Search, BarChart3, Calendar } from "lucide-react"
import type { Profile } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/i18n/language-context"

interface BottomNavigationProps {
  profile: Profile | null
}

export function BottomNavigation({ profile }: BottomNavigationProps) {
  const pathname = usePathname()
  const { t } = useLanguage()

  const isActive = (path: string) => pathname === path

  if (profile?.user_type === "business") {
    return (
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-lg md:hidden">
        <div className="grid grid-cols-5 gap-1 p-2">
          {/* Metrics/Home */}
          <Link
            href="/dashboard"
            className={cn(
              "flex flex-col items-center justify-center py-2 rounded-md transition-colors",
              isActive("/dashboard") ? "text-[#01A89E] bg-teal-50" : "text-gray-600 hover:bg-gray-50",
            )}
          >
            <BarChart3 className="h-5 w-5" />
            <span className="text-[13px] mt-1">{t("navigation.metrics")}</span>
          </Link>

          {/* Search - business users only ever see Candidatos here */}
          <Link
            href="/search"
            className={cn(
              "flex flex-col items-center justify-center py-2 rounded-md transition-colors",
              isActive("/search") ? "text-[#01A89E] bg-teal-50" : "text-gray-600 hover:bg-gray-50",
            )}
          >
            <Search className="h-5 w-5" />
            <span className="text-[13px] mt-1">{t("navigation.search")}</span>
          </Link>

          {/* Create Job (Center button with +) */}
          <Link href="/jobs/create" className="flex flex-col items-center justify-center py-2">
            <div className="bg-[#01A89E] text-white rounded-full p-3 -mt-6 shadow-lg hover:bg-[#018F86] transition-colors">
              <Plus className="h-6 w-6" />
            </div>
            <span className="text-[13px] mt-1 text-gray-600">{t("navigation.create")}</span>
          </Link>

          {/* Favorites (Saved candidates) */}
          <Link
            href="/favorites"
            className={cn(
              "flex flex-col items-center justify-center py-2 rounded-md transition-colors",
              isActive("/favorites") ? "text-[#01A89E] bg-teal-50" : "text-gray-600 hover:bg-gray-50",
            )}
          >
            <Heart className="h-5 w-5" />
            <span className="text-[13px] mt-1">{t("navigation.favorites")}</span>
          </Link>

          {/* Profile */}
          <Link
            href="/profile"
            className={cn(
              "flex flex-col items-center justify-center py-2 rounded-md transition-colors",
              isActive("/profile") ? "text-[#01A89E] bg-teal-50" : "text-gray-600 hover:bg-gray-50",
            )}
          >
            <User className="h-5 w-5" />
            <span className="text-[13px] mt-1">{t("navigation.profile")}</span>
          </Link>
        </div>
      </nav>
    )
  }

  // Worker navigation
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-lg md:hidden">
      <div className="grid grid-cols-5 gap-1 p-2">
        {/* Home */}
        <Link
          href="/dashboard"
          className={cn(
            "flex flex-col items-center justify-center py-2 rounded-md transition-colors",
            isActive("/dashboard") ? "text-[#01A89E] bg-teal-50" : "text-gray-600 hover:bg-gray-50",
          )}
        >
          <Briefcase className="h-5 w-5" />
          <span className="text-[13px] mt-1">{t("navigation.home")}</span>
        </Link>

        {/* Saved Jobs */}
        <Link
          href="/saved"
          className={cn(
            "flex flex-col items-center justify-center py-2 rounded-md transition-colors",
            isActive("/saved") ? "text-[#01A89E] bg-teal-50" : "text-gray-600 hover:bg-gray-50",
          )}
        >
          <Bookmark className="h-5 w-5" />
          <span className="text-[13px] mt-1">{t("navigation.saved")}</span>
        </Link>

        {/* Messages */}
        <Link
          href="/messages"
          className={cn(
            "flex flex-col items-center justify-center py-2 rounded-md transition-colors",
            isActive("/messages") ? "text-[#01A89E] bg-teal-50" : "text-gray-600 hover:bg-gray-50",
          )}
        >
          <MessageCircle className="h-5 w-5" />
          <span className="text-[13px] mt-1">{t("navigation.messages")}</span>
        </Link>

        {/* Interviews */}
        <Link
          href="/interviews"
          className={cn(
            "flex flex-col items-center justify-center py-2 rounded-md transition-colors",
            isActive("/interviews") ? "text-[#01A89E] bg-teal-50" : "text-gray-600 hover:bg-gray-50",
          )}
        >
          <Calendar className="h-5 w-5" />
          <span className="text-[13px] mt-1">{t("navigation.interviews")}</span>
        </Link>

        {/* Profile */}
        <Link
          href="/profile"
          className={cn(
            "flex flex-col items-center justify-center py-2 rounded-md transition-colors",
            isActive("/profile") ? "text-[#01A89E] bg-teal-50" : "text-gray-600 hover:bg-gray-50",
          )}
        >
          <User className="h-5 w-5" />
          <span className="text-[13px] mt-1">{t("navigation.profile")}</span>
        </Link>
      </div>
    </nav>
  )
}
