import { updateSession } from '@/lib/supabase/middleware'
import { NextResponse, type NextRequest } from 'next/server'

// Coarse "is there a session at all" gate, centralized here instead of each
// page independently redirecting client-side. Deliberately exact/regex
// matches, never a bare prefix - e.g. `/profile` (the current user's own
// profile) requires auth, but `/profile/[id]` (any candidate's public
// profile page) must stay public, so a naive `startsWith('/profile')` would
// wrongly gate it. Role-based checks (admin/business/worker) are NOT done
// here - those stay where they already are (app/admin/layout.tsx, etc.).
const PROTECTED_PATTERNS: RegExp[] = [
  /^\/dashboard$/,
  /^\/business-dashboard$/,
  /^\/messages$/,
  /^\/edit-profile$/,
  /^\/business-profile(\/|$)/,
  /^\/profile$/,
  /^\/admin(\/|$)/,
  /^\/jobs\/create$/,
  /^\/jobs\/[^/]+\/edit$/,
  /^\/jobs\/[^/]+\/applications$/,
  /^\/interviews$/,
]

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request)

  const { pathname } = request.nextUrl
  const isProtected = PROTECTED_PATTERNS.some((pattern) => pattern.test(pathname))

  if (isProtected && !user) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: [
    // Excludes /api/* (a redirect there would break fetch() callers expecting
    // JSON) as well as static assets - matches the previous matcher's intent.
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4)$).*)',
  ],
}
