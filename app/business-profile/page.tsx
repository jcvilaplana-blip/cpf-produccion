"use client"
import { useEffect, useState, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { BusinessProfileContent } from "@/components/business-profile-content"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"
import type { Profile, BusinessProfile } from "@/lib/types"

export default function BusinessProfilePage() {
  const router = useRouter()
  const { user: authUser, isAuthenticated, isLoading: authLoading } = useAuth()
  const supabase = useMemo(() => createClient(), [])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null)
  const [loadingData, setLoadingData] = useState(true)
  const loaded = useRef(false)

  useEffect(() => {
    if (authLoading) return
    // Only redirect when there's definitely no session - see app/profile/page.tsx
    // for why `!authUser` alone (profile still loading) must not count as logged out.
    if (!isAuthenticated) {
      router.push("/auth/login")
      return
    }
    if (!authUser) return
    if (loaded.current) return
    loaded.current = true

    const loadUserData = async () => {
      try {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authUser.id)
          .single()

        if (profileData) {
          setProfile(profileData as Profile)
          if (profileData.user_type === "worker") {
            router.push("/dashboard")
            return
          }
        }

        const { data: businessData } = await supabase
          .from("business_profiles")
          .select("*")
          .eq("id", authUser.id)
          .single()

        if (businessData) setBusinessProfile(businessData as BusinessProfile)
      } catch (e) {
        console.error("Error loading business profile:", e)
      } finally {
        setLoadingData(false)
      }
    }

    loadUserData()
  }, [authLoading, isAuthenticated, authUser, supabase, router])

  if (authLoading || loadingData) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <BusinessProfileContent
      user={authUser ? { id: authUser.id, email: authUser.email } : null}
      profile={profile}
      businessProfile={businessProfile}
    />
  )
}
