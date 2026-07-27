export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { verifyAdmin } from "@/lib/admin-auth"

export async function GET() {
  const { error, supabase } = await verifyAdmin()
  if (error || !supabase) return NextResponse.json({ error }, { status: 401 })

  // Get all cities
  const { data: cities } = await supabase
    .from("cities")
    .select("id, name, region, is_active, sort_order")
    .order("name")

  if (!cities) return NextResponse.json({ data: [] })

  // Get all profiles with location field
  const { data: profiles } = await supabase
    .from("profiles")
    .select("location, user_type, is_premium")
  
  // Get all business profiles with city
  const { data: businesses } = await supabase
    .from("business_profiles")
    .select("city, subscription_plan, is_premium")

  // Get all flash jobs with city
  const { data: flashJobs } = await supabase
    .from("jobs")
    .select("city, location")
    .eq("is_flash", true)

  // Count per city
  const cityStats = cities.map((city) => {
    const cityName = city.name.toLowerCase()

    const candidateCount = (profiles || []).filter(
      (p) => p.user_type === "worker" && p.location && p.location.toLowerCase().includes(cityName)
    ).length

    const businessCount = (businesses || []).filter(
      (b) => b.city && b.city.toLowerCase().includes(cityName)
    ).length

    const flashCount = (flashJobs || []).filter(
      (j) => (j.city && j.city.toLowerCase().includes(cityName)) || (j.location && j.location.toLowerCase().includes(cityName))
    ).length

    const subscriberCount = (businesses || []).filter(
      (b) => b.city && b.city.toLowerCase().includes(cityName) && b.subscription_plan && b.subscription_plan !== "free"
    ).length

    return {
      ...city,
      candidates: candidateCount,
      businesses: businessCount,
      flash_jobs: flashCount,
      subscribers: subscriberCount,
      total: candidateCount + businessCount + flashCount,
    }
  })

  // Sort by total desc, then by name
  cityStats.sort((a, b) => b.total - a.total || a.name.localeCompare(b.name))

  return NextResponse.json({ data: cityStats })
}
