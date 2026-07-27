"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ProfileContent } from "@/components/profile-content"
import { createClient } from "@/lib/supabase/client"
import type { Profile, BusinessProfile } from "@/lib/types"

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null)
  const [applications, setApplications] = useState<any[]>([])
  const [postedJobs, setPostedJobs] = useState<any[]>([])
  const [ratings, setRatings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProfileData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const authUser = session?.user
      if (!authUser) {
        router.push("/auth/login")
        return
      }
      setUser(authUser)

      // Load profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single()

      if (profileData) {
        setProfile(profileData as Profile)
      }

      // Load business profile if business user
      if (profileData?.user_type === "business") {
        const { data: bizData } = await supabase
          .from("business_profiles")
          .select("*")
          .eq("id", authUser.id)
          .single()
        if (bizData) setBusinessProfile(bizData as BusinessProfile)

        // Load posted jobs
        const { data: jobsData } = await supabase
          .from("jobs")
          .select("*")
          .eq("business_id", authUser.id)
          .order("created_at", { ascending: false })
        if (jobsData) setPostedJobs(jobsData)
      }

      // Load applications (for workers)
      if (profileData?.user_type === "worker") {
        const { data: appsData } = await supabase
          .from("applications")
          .select("*, job:jobs(*)")
          .eq("worker_id", authUser.id)
          .order("created_at", { ascending: false })
        if (appsData) setApplications(appsData)
      }

      // Load ratings
      const { data: ratingsData } = await supabase
        .from("ratings")
        .select("*")
        .eq("rated_user_id", authUser.id)
        .order("created_at", { ascending: false })
      if (ratingsData) setRatings(ratingsData)

      setLoading(false)
    }
    loadProfileData()
  }, [supabase, router])

  if (loading) {
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
      user={user}
      profile={profile}
      businessProfile={businessProfile}
      applications={applications}
      postedJobs={postedJobs}
      ratings={ratings}
    />
  )
}
