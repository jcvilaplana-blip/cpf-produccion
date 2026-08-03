"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { ProfileContent } from "@/components/profile-content"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"
import type { Profile, BusinessProfile } from "@/lib/types"

export default function ProfilePage() {
  const router = useRouter()
  const { user: authUser, isAuthenticated, isLoading: authLoading } = useAuth()
  const supabase = useMemo(() => createClient(), [])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null)
  const [applications, setApplications] = useState<any[]>([])
  const [postedJobs, setPostedJobs] = useState<any[]>([])
  const [ratings, setRatings] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (authLoading) return
    // Only redirect when there's definitely no session - `authUser` also
    // needs the profile row to have loaded, which can lag (or rarely fail)
    // even for a genuinely signed-in visitor; treating that the same as
    // "logged out" was bouncing real users back to login after a long wait.
    if (!isAuthenticated) {
      router.push("/auth/login")
      return
    }
    if (!authUser) return

    const loadProfileData = async () => {
      const userId = authUser.id

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single()

      if (profileData) setProfile(profileData as Profile)

      if (profileData?.user_type === "business") {
        const { data: bizData } = await supabase
          .from("business_profiles")
          .select("*")
          .eq("id", userId)
          .single()
        if (bizData) setBusinessProfile(bizData as BusinessProfile)

        const { data: jobsData } = await supabase
          .from("jobs")
          .select("*")
          .eq("business_id", userId)
          .order("created_at", { ascending: false })
        if (jobsData) setPostedJobs(jobsData)
      }

      if (profileData?.user_type === "worker") {
        const { data: appsData } = await supabase
          .from("applications")
          .select("*, job:jobs(*)")
          .eq("worker_id", userId)
          .order("created_at", { ascending: false })
        if (appsData) setApplications(appsData)
      }

      const { data: ratingsData } = await supabase
        .from("ratings")
        .select("*")
        .eq("rated_user_id", userId)
        .order("created_at", { ascending: false })
      if (ratingsData) setRatings(ratingsData)

      setLoadingData(false)
    }
    loadProfileData()
  }, [authLoading, isAuthenticated, authUser, supabase, router])

  if (authLoading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#01A89E] mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando perfil...</p>
        </div>
      </div>
    )
  }

  return (
    <ProfileContent
      user={authUser ? { id: authUser.id, email: authUser.email } : null}
      profile={profile}
      businessProfile={businessProfile}
      applications={applications}
      postedJobs={postedJobs}
      ratings={ratings}
    />
  )
}
