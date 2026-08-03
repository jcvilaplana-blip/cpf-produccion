"use client"

import { useAuthContext } from "@/components/providers/auth-provider"

// Thin re-export so every existing consumer (~15 components) keeps working
// unchanged. The actual session state lives in a single AuthProvider mounted
// once in app/layout.tsx - this hook just reads it. Previously this hook ran
// its own independent onAuthStateChange subscription, and several other
// components (top-navigation.tsx, global-bottom-navigation.tsx, etc.) each
// rolled their own separate copy too, which is what let different parts of
// the UI disagree about who was logged in (or show a stale user after
// logout). There is now exactly one subscription, one source of truth.
export function useAuth() {
  return useAuthContext()
}
