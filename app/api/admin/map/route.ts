export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { verifyAdmin } from "@/lib/admin-auth"
import { getCoordsForCity, CITY_COORDS } from "@/lib/city-coords"

// Default coords for Spain center if nothing else matches
const SPAIN_CENTER: [number, number] = [-3.7038, 40.4168]

export async function GET(req: NextRequest) {
  const { supabase, error } = await verifyAdmin()
  if (error) return NextResponse.json({ error }, { status: 401 })

  const filter = req.nextUrl.searchParams.get("filter") || "all"

  const results: any = { candidates: [], businesses: [], flash_jobs: [] }

  // Load city coords from DB for additional lookups
  const { data: dbCities } = await supabase
    .from("cities")
    .select("name, latitude, longitude")
    .not("latitude", "is", null)
  
  const dbCityCoords: Record<string, [number, number]> = {}
  if (dbCities) {
    for (const city of dbCities) {
      if (city.name && city.latitude && city.longitude) {
        dbCityCoords[city.name.toLowerCase().trim()] = [Number(city.longitude), Number(city.latitude)]
      }
    }
  }

  // Helper to get coords with multiple fallbacks
  const getCoords = (location?: string | null): [number, number] | null => {
    if (!location) return null
    // Try static lookup
    const staticCoords = getCoordsForCity(location)
    if (staticCoords) return staticCoords
    // Try DB lookup
    const normalized = location.toLowerCase().trim()
    if (dbCityCoords[normalized]) return dbCityCoords[normalized]
    // Try partial match in DB
    for (const [key, coords] of Object.entries(dbCityCoords)) {
      if (normalized.includes(key) || key.includes(normalized)) return coords
    }
    // Try partial match in static coords
    for (const [key, coords] of Object.entries(CITY_COORDS)) {
      if (normalized.includes(key) || key.includes(normalized)) return coords
    }
    return null
  }

  // Candidates - get all workers
  if (filter === "all" || filter === "candidates") {
    const { data, error: queryError } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url, location, job_category, rating, latitude, longitude")
      .eq("user_type", "worker")
      .limit(500)
    
    
    
    if (data) {
      for (const c of data) {
        // First try stored coordinates
        let lat = c.latitude ? Number(c.latitude) : null
        let lng = c.longitude ? Number(c.longitude) : null
        
        // Fallback: geocode by location field
        if (!lat || !lng) {
          const coords = getCoords(c.location)
          if (coords) {
            lng = coords[0]
            lat = coords[1]
          }
        }
        
        // Include all candidates, even without coords (for listing)
        results.candidates.push({ 
          ...c, 
          latitude: lat, 
          longitude: lng 
        })
      }
    }
  }

  // Businesses - get all
  if (filter === "all" || filter === "businesses") {
    const { data, error: queryError } = await supabase
      .from("business_profiles")
      .select("id, company_name, company_logo_url, city, address, business_type, verified, latitude, longitude")
      .limit(500)
    
    
    
    if (data) {
      for (const b of data) {
        let lat = b.latitude ? Number(b.latitude) : null
        let lng = b.longitude ? Number(b.longitude) : null
        
        // Fallback: geocode by city or address
        if (!lat || !lng) {
          const coords = getCoords(b.city) || getCoords(b.address)
          if (coords) {
            lng = coords[0]
            lat = coords[1]
          }
        }
        
        results.businesses.push({ 
          ...b, 
          latitude: lat, 
          longitude: lng,
          logo_url: b.company_logo_url,
          location: b.city || b.address
        })
      }
    }
  }

  // Flash jobs
  if (filter === "all" || filter === "flash") {
    const { data, error: queryError } = await supabase
      .from("jobs")
      .select("id, title, city, location, latitude, longitude, salary_display, business_id")
      .eq("is_flash", true)
      .eq("is_active", true)
      .limit(200)
    
    
    
    if (data) {
      for (const j of data) {
        let lat = j.latitude ? Number(j.latitude) : null
        let lng = j.longitude ? Number(j.longitude) : null
        
        if (!lat || !lng) {
          const coords = getCoords(j.city || j.location)
          if (coords) {
            lng = coords[0]
            lat = coords[1]
          }
        }
        
        results.flash_jobs.push({ 
          ...j, 
          latitude: lat, 
          longitude: lng,
          location: j.city || j.location 
        })
      }
    }
  }

  const total = results.candidates.length + results.businesses.length + results.flash_jobs.length
  return NextResponse.json({ data: results, total })
}
