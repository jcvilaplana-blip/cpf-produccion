"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

interface AuthUser {
  id: string
  email: string
  displayName: string
  userType: "worker" | "business" | "admin"
  avatarUrl?: string
  companyName?: string
  profileCompleted?: boolean
}

interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  logout: () => void
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T | "timeout"> {
  const timeout = new Promise<"timeout">((resolve) => setTimeout(() => resolve("timeout"), timeoutMs))
  return Promise.race([promise, timeout])
}

// A transient network hiccup fetching the profile row must never be treated
// as "not logged in" - that conflation was causing users to get bounced back
// to /auth/login even with a perfectly valid session, especially on slower
// connections. Retry a couple of times before giving up on the profile.
//
// Each attempt is individually bounded: supabase-js's underlying client can
// occasionally stall a query indefinitely (the same Web Locks contention
// documented in lib/supabase/client.ts's getSessionSafe), so a hung request
// must not block the retry loop - and therefore isLoading - forever.
async function loadProfileWithRetry(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  attempts = 3
): Promise<Record<string, unknown> | null> {
  for (let i = 0; i < attempts; i++) {
    const result = await withTimeout(
      supabase
        .from("profiles")
        .select("display_name, user_type, avatar_url, is_admin, rol, profile_completed, email")
        .eq("id", userId)
        .single(),
      5000
    )

    if (result !== "timeout" && !result.error && result.data) return result.data
    if (i < attempts - 1) await new Promise((r) => setTimeout(r, 400 * (i + 1)))
  }
  return null
}

export function useAuth(): AuthState {
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null)
  const [businessProfile, setBusinessProfile] = useState<Record<string, unknown> | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    let cancelled = false

    const loadProfile = async (userId: string) => {
      const profileData = await loadProfileWithRetry(supabase, userId)
      if (cancelled) return
      setProfile(profileData)

      if (profileData?.user_type === "business" || profileData?.rol === 3) {
        const result = await withTimeout(
          supabase
            .from("business_profiles")
            .select("company_name, company_logo_url, city, verified")
            .eq("id", userId)
            .single(),
          5000
        )
        if (!cancelled && result !== "timeout") setBusinessProfile(result.data)
      }
    }

    // Rely solely on onAuthStateChange - it always fires once immediately
    // with the current session (INITIAL_SESSION/SIGNED_IN/etc.) on subscribe,
    // making a separate manual getSession() call redundant. Running both
    // concurrently on a fresh page load was found to trigger the same
    // supabase-js internal-lock contention documented in getSessionSafe,
    // occasionally hanging the profile fetch forever and leaving `user`
    // stuck null even though isLoading had already resolved to false.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled) return
      setSupabaseUser(session?.user ?? null)

      if (session?.user) {
        try {
          await loadProfile(session.user.id)
        } catch {
          // Ignore - keep whatever profile we already have rather than
          // wiping it out on a transient error
        }
      } else {
        setProfile(null)
        setBusinessProfile(null)
      }

      if (!cancelled) setIsLoading(false)
    })

    // Last-resort safety net: if for any reason no auth event ever fires,
    // never leave the UI spinning forever.
    const fallbackTimer = setTimeout(() => {
      if (!cancelled) setIsLoading(false)
    }, 8000)

    return () => {
      cancelled = true
      clearTimeout(fallbackTimer)
      subscription.unsubscribe()
    }
  }, [])

  // isAuthenticated reflects the Supabase session alone - a slow or
  // momentarily-failed profile fetch must never make an otherwise
  // logged-in user look logged out (that's what caused the login loop).
  const isAuthenticated = !!supabaseUser

  if (supabaseUser && profile) {
    const p = profile as Record<string, unknown>
    const bp = businessProfile as Record<string, unknown> | null
    const isAdmin = p.is_admin || p.rol === 1 || p.user_type === "admin"
    const isBusiness = (p.user_type as string) === "business" || p.rol === 3
    const userType = isAdmin ? "admin" : isBusiness ? "business" : "worker"

    // For business users, use company name and logo if available
    const displayName = isBusiness && bp?.company_name
      ? bp.company_name as string
      : p.display_name as string || ""
    const avatarUrl = isBusiness && bp?.company_logo_url
      ? bp.company_logo_url as string
      : p.avatar_url as string || undefined

    return {
      user: {
        id: supabaseUser.id,
        email: supabaseUser.email || p.email as string || "",
        displayName,
        userType: userType as "worker" | "business" | "admin",
        avatarUrl,
        companyName: bp?.company_name as string || undefined,
        profileCompleted: p.profile_completed as boolean || false,
      },
      isAuthenticated: true,
      isLoading,
      logout: async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        setSupabaseUser(null)
        setProfile(null)
        setBusinessProfile(null)
        window.location.href = "/"
      },
    }
  }

  return {
    user: null,
    isAuthenticated,
    isLoading,
    logout: async () => {
      const supabase = createClient()
      await supabase.auth.signOut()
      window.location.href = "/"
    },
  }
}
