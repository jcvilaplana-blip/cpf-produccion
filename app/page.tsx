import { LandingContent } from "@/components/landing-content"
import { createClient } from "@/lib/supabase/server"
import { createShowcaseClient, CAMPOS_PUBLICOS_CANDIDATO } from "@/lib/supabase/public-showcase"


export default async function HomePage() {
  let isLoggedIn = false
  try {
    const authClient = await createClient()
    const { data: { user } } = await authClient.auth.getUser()
    isLoggedIn = !!user
  } catch {
    // If auth check fails, treat as logged out (safer default for the gate)
  }

  let jobs: any[] = []
  let flashJobs: any[] = []
  let businessesData: any[] | null = null
  let workersData: any[] | null = null
  let totalJobs = 0
  let totalProfiles = 0
  let totalBusinesses = 0

  try {
    // El escaparate va por el servidor: a `anon` se le retiraron las columnas
    // personales de `profiles`, así que un `select("*")` o un filtro por
    // `is_admin` con esa clave fallan. Si no hubiera clave de servicio se
    // sigue con la anónima, que basta para las tablas sin datos sensibles.
    const supabase = createShowcaseClient() ?? (await createClient())

    // Run ALL queries in parallel for faster page load
    const results = await Promise.all([
      supabase
        .from("jobs")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("jobs")
        .select("*")
        .eq("is_active", true)
        .eq("is_flash", true)
        .order("created_at", { ascending: false })
        .limit(6),
      supabase
        .from("business_profiles")
        .select("id, company_name, company_logo_url, business_type, city, address, verified")
        .order("created_at", { ascending: false })
        .limit(6),
      supabase
        .from("jobs")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("user_type", "worker"),
      supabase
        .from("business_profiles")
        .select("*", { count: "exact", head: true }),
      // Get real workers/candidates
      supabase
        .from("profiles")
        .select("id, display_name, avatar_url, job_category, location, experience_years")
        .eq("user_type", "worker")
        .eq("is_admin", false)
        .order("created_at", { ascending: false })
        .limit(40),
    ])

    jobs = results[0].data || []
    flashJobs = results[1].data || []
    businessesData = results[2].data
    totalJobs = results[3].count || 0
    totalProfiles = results[4].count || 0
    totalBusinesses = results[5].count || 0
    workersData = results[6].data

    const flashBusinessIds = [...new Set(flashJobs.map((j: any) => j.business_id).filter(Boolean))]
    if (flashBusinessIds.length > 0) {
      const { data: flashBusinesses } = await supabase
        .from("business_profiles")
        .select("id, company_name")
        .in("id", flashBusinessIds)
      const nameById = new Map((flashBusinesses || []).map((b: any) => [b.id, b.company_name]))
      flashJobs = flashJobs.map((j: any) => ({ ...j, business_name: nameById.get(j.business_id) || "Empresa" }))
    }
  } catch {
    // If Supabase is not available, continue with defaults
  }

  // Map flash jobs to the shape FlashOffersCarousel expects
  const flashOffers = flashJobs.map((j: any) => {
    const created = new Date(j.created_at).getTime()
    const expires = j.flash_expires_at ? new Date(j.flash_expires_at).getTime() : created + 24 * 60 * 60 * 1000
    const contractDays = Math.max(1, Math.round((expires - created) / (1000 * 60 * 60 * 24)))
    return {
      id: j.id,
      title: j.title,
      jobType: j.category || "Camarero",
      contractDays,
      salary: j.salary_min || 0,
      salaryPeriod: "día",
      location: j.city || j.location || "España",
      expiresAt: j.flash_expires_at || new Date(expires).toISOString(),
      imageUrl: j.image_url || null,
    }
  })

  // Map Supabase business_profiles to the format CompaniesCarousel expects
  const businesses = (businessesData || [])
    .filter((b: any) => b.company_name)
    .map((b: any) => ({
      id: b.id,
      name: b.company_name,
      type: b.business_type || "General",
      location: b.city || b.address || "Espana",
      rating: 4.5,
      activeJobs: 0,
      logo: b.company_logo_url || "/placeholder.svg",
      verified: b.verified || false,
      source: "supabase" as const,
    }))

  const stats = {
    totalJobs: totalJobs || 0,
    totalWorkers: totalProfiles || 0,
    totalBusinesses: totalBusinesses || 0,
    successRate: 95,
  }

  return (
    <LandingContent
      featuredJobs={jobs || []}
      stats={stats}
      businesses={businesses || []}
      workers={workersData || []}
      flashOffers={flashOffers}
      isLoggedIn={isLoggedIn}
    />
  )
}
