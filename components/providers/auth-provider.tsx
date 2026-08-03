"use client"

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import { toast } from "sonner"

interface AuthUser {
  id: string
  email: string
  displayName: string
  userType: "worker" | "business" | "admin"
  avatarUrl?: string
  companyName?: string
  profileCompleted?: boolean
}

interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T | "timeout"> {
  const timeout = new Promise<"timeout">((resolve) => setTimeout(() => resolve("timeout"), timeoutMs))
  return Promise.race([promise, timeout])
}

// A transient network hiccup fetching the profile row must never be treated
// as "not logged in". Each attempt is individually bounded since supabase-js's
// underlying client can occasionally stall a query indefinitely (Web Locks
// session-mutex contention - see the comment on the single onAuthStateChange
// subscription below for why concurrent auth calls must never happen).
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null)
  const [businessProfile, setBusinessProfile] = useState<Record<string, unknown> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  // Distinguishes a user-initiated logout() call from an unexpected sign-out
  // (expired/invalid session detected by onAuthStateChange), so we only show
  // the "your session expired" toast for the latter.
  const loggedOutByUserRef = useRef(false)

  useEffect(() => {
    const supabase = createClient()
    let cancelled = false
    let hadSession = false

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
    // making a separate manual getSession() call redundant. This is the ONLY
    // auth subscription in the entire app - every component reads from this
    // single source via useAuth() instead of running its own copy, which is
    // what previously let different parts of the UI disagree about who (or
    // whether anyone) was logged in.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled) return
      setSupabaseUser(session?.user ?? null)

      if (session?.user) {
        hadSession = true
        try {
          await loadProfile(session.user.id)
        } catch {
          // Ignore - keep whatever profile we already have rather than
          // wiping it out on a transient error
        }
      } else {
        setProfile(null)
        setBusinessProfile(null)
        if (hadSession && !loggedOutByUserRef.current && event !== "INITIAL_SESSION") {
          toast.error("Tu sesión ha expirado. Vuelve a iniciar sesión.")
        }
        loggedOutByUserRef.current = false
        hadSession = false
      }

      if (!cancelled) setIsLoading(false)
    })

    // Last-resort safety net: if for any reason no auth event ever fires,
    // never leave the UI spinning forever.
    const fallbackTimer = setTimeout(() => {
      if (!cancelled) setIsLoading(false)
    }, 8000)

    // Browsers can restore a whole page (including this component's frozen
    // in-memory state) from the back-forward cache on a physical back/forward
    // gesture, with no remount and no effect re-run. Force a fresh check when
    // that happens so a stale "logged in" snapshot from before a sign-out
    // elsewhere can never be shown.
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (!cancelled) setSupabaseUser(session?.user ?? null)
        })
      }
    }
    window.addEventListener("pageshow", handlePageShow)

    return () => {
      cancelled = true
      clearTimeout(fallbackTimer)
      window.removeEventListener("pageshow", handlePageShow)
      subscription.unsubscribe()
    }
  }, [])

  const logout = async () => {
    loggedOutByUserRef.current = true
    const supabase = createClient()
    await supabase.auth.signOut()
    setSupabaseUser(null)
    setProfile(null)
    setBusinessProfile(null)
    router.push("/")
    router.refresh()
  }

  // isAuthenticated reflects the Supabase session alone - a slow or
  // momentarily-failed profile fetch must never make an otherwise
  // logged-in user look logged out.
  const isAuthenticated = !!supabaseUser

  const user = useMemo<AuthUser | null>(() => {
    if (!supabaseUser || !profile) return null
    const p = profile
    const bp = businessProfile
    const isAdmin = !!(p.is_admin || p.rol === 1 || p.user_type === "admin")
    const isBusiness = (p.user_type as string) === "business" || p.rol === 3
    const userType = isAdmin ? "admin" : isBusiness ? "business" : "worker"

    const displayName = isBusiness && bp?.company_name
      ? (bp.company_name as string)
      : (p.display_name as string) || ""
    const avatarUrl = isBusiness && bp?.company_logo_url
      ? (bp.company_logo_url as string)
      : (p.avatar_url as string) || undefined

    return {
      id: supabaseUser.id,
      email: supabaseUser.email || (p.email as string) || "",
      displayName,
      userType: userType as "worker" | "business" | "admin",
      avatarUrl,
      companyName: (bp?.company_name as string) || undefined,
      profileCompleted: (p.profile_completed as boolean) || false,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabaseUser, profile, businessProfile])

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated, isLoading, logout }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, isAuthenticated, isLoading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuthContext must be used within an AuthProvider")
  return ctx
}
