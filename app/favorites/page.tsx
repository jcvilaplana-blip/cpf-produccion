"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { FavoritesContent } from "@/components/favorites-content"
import { createClient } from "@/lib/supabase/client"
import type { UserType } from "@/lib/types"

export default function FavoritesPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [savedItems, setSavedItems] = useState<any[]>([])
  const [userType, setUserType] = useState<UserType>("worker")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadFavorites = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) {
        router.push("/auth/login")
        return
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("user_type")
        .eq("id", user.id)
        .single()

      const type = (profile?.user_type as UserType) || "worker"
      setUserType(type)

      if (type === "business") {
        const { data } = await supabase
          .from("saved_profiles")
          .select("*, profile:profiles(*)")
          .eq("business_id", user.id)
          .order("created_at", { ascending: false })
        setSavedItems(data || [])
      } else {
        const [{ data: savedJobs }, { data: savedBusinesses }] = await Promise.all([
          supabase.from("saved_jobs").select("*, job:jobs(*)").eq("user_id", user.id).order("created_at", { ascending: false }),
          supabase.from("saved_businesses").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        ])

        let businessItems: any[] = []
        if (savedBusinesses && savedBusinesses.length > 0) {
          const businessIds = savedBusinesses.map((sb) => sb.business_id)
          const { data: businessProfiles } = await supabase
            .from("business_profiles")
            .select("*")
            .in("id", businessIds)
          const businessMap = new Map((businessProfiles || []).map((bp) => [bp.id, bp]))
          businessItems = savedBusinesses.map((sb) => ({ ...sb, business: businessMap.get(sb.business_id) }))
        }

        setSavedItems([...(savedJobs || []), ...businessItems])
      }

      setLoading(false)
    }
    loadFavorites()
  }, [supabase, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return <FavoritesContent savedItems={savedItems} userType={userType} />
}
