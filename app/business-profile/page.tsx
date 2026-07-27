"use client"
import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { BusinessProfileContent } from "@/components/business-profile-content"
import { createClient } from "@/lib/supabase/client"
import type { Profile, BusinessProfile } from "@/lib/types"

export default function BusinessProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const loaded = useRef(false)

  useEffect(() => {
    if (loaded.current) return
    loaded.current = true

    const supabase = createClient()

    const loadUserData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const authUser = session?.user
        if (!authUser) {
          router.push("/auth/login")
          return
        }
        setUser(authUser)

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

        if (businessData) {
          setBusinessProfile(businessData as BusinessProfile)
        }
      } catch (e) {
        console.error("Error loading business profile:", e)
      } finally {
        setLoading(false)
      }
    }

    loadUserData()
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return <BusinessProfileContent user={user} profile={profile} businessProfile={businessProfile} />
}
