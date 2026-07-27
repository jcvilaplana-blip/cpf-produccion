import { JobsListingContent } from "@/components/jobs-listing-content"
import { createClient } from "@/lib/supabase/server"

export default async function JobsPage() {
  const supabase = await createClient()

  const [{ data: jobs }, { data: flashJobs }] = await Promise.all([
    supabase
      .from("jobs")
      .select("*")
      .eq("is_active", true)
      .eq("is_flash", false)
      .order("created_at", { ascending: false }),
    supabase
      .from("jobs")
      .select("*")
      .eq("is_active", true)
      .eq("is_flash", true)
      .order("created_at", { ascending: false })
      .limit(5),
  ])

  const allBusinessIds = [
    ...new Set([...(jobs || []), ...(flashJobs || [])].map((j: any) => j.business_id).filter(Boolean)),
  ]
  const businessMap = new Map<string, { company_name: string; company_logo_url: string | null; business_type: string | null }>()
  if (allBusinessIds.length > 0) {
    const { data: businesses } = await supabase
      .from("business_profiles")
      .select("id, company_name, company_logo_url, business_type")
      .in("id", allBusinessIds)
    for (const b of businesses || []) {
      businessMap.set(b.id, { company_name: b.company_name, company_logo_url: b.company_logo_url, business_type: b.business_type })
    }
  }

  const mappedJobs = (jobs || []).map((j: any) => {
    const b = businessMap.get(j.business_id)
    return {
      id: j.id,
      title: j.title,
      description: j.description || "",
      location: j.city || j.location || "España",
      salary_min: j.salary_min,
      salary_max: j.salary_max,
      is_active: j.is_active,
      created_at: j.created_at,
      business_id: j.business_id,
      jobType: j.category,
      business: {
        display_name: b?.company_name || "Empresa",
        avatar_url: b?.company_logo_url || "",
        type: b?.business_type || "Varios",
      },
    }
  })

  const mappedFlashOffers = (flashJobs || []).map((j: any) => {
    const b = businessMap.get(j.business_id)
    const created = new Date(j.created_at).getTime()
    const expiry = j.flash_expires_at ? new Date(j.flash_expires_at).getTime() : created + 24 * 60 * 60 * 1000
    const contractDays = Math.max(1, Math.round((expiry - created) / (1000 * 60 * 60 * 24)))
    return {
      id: j.id,
      title: j.title,
      description: j.description || "",
      jobType: j.category,
      contractDays,
      startDate: j.start_date || j.created_at,
      endDate: j.flash_expires_at || new Date(expiry).toISOString(),
      salary: j.salary_min || 0,
      salaryPeriod: "día",
      location: j.city || j.location || "España",
      business: {
        id: j.business_id,
        name: b?.company_name || "Empresa",
        logo: b?.company_logo_url || "",
        rating: 0,
      },
      requirements: (j.requirements || "").split("\n").filter(Boolean),
      postedAt: j.created_at,
      expiresAt: j.flash_expires_at || new Date(expiry).toISOString(),
      isUrgent: true,
      imageUrl: j.image_url || null,
    }
  })

  return <JobsListingContent jobs={mappedJobs} flashOffers={mappedFlashOffers} />
}
