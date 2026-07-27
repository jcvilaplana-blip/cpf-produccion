"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { BusinessProfileViewContent } from "@/components/business-profile-view-content"
import { createClient } from "@/lib/supabase/client"
import type { Profile, BusinessProfile } from "@/lib/types"

export default function BusinessProfileViewPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const loadUserData = async () => {
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
      }

      const { data: businessData } = await supabase
        .from("business_profiles")
        .select("*")
        .eq("id", authUser.id)
        .single()

      if (businessData) {
        setBusinessProfile(businessData as BusinessProfile)
      }

      setLoading(false)
    }

    loadUserData()
  }, [supabase, router])

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return <BusinessProfileViewContent user={user} profile={profile} businessProfile={businessProfile} />
}
