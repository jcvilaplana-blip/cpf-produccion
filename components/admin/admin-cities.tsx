"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Users, Building2, Zap, Crown, MapPin, Search, ChevronDown, ChevronRight,
  Loader2,
} from "lucide-react"

interface CityStats {
  id: string
  name: string
  region: string
  is_active: boolean
  candidates: number
  businesses: number
  flash_jobs: number
  subscribers: number
  total: number
}

export function AdminCities() {
  const [cities, setCities] = useState<CityStats[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [expandedRegions, setExpandedRegions] = useState<string[]>([])

  useEffect(() => {
    fetch("/api/admin/cities-stats")
      .then(r => r.json())
      .then(d => { setCities(d.data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  // Filter only Spanish provinces (exclude foreign cities)
  const spanishCities = cities.filter(c =>
    c.region && !["England", "Ile-de-France", "Auvergne-Rhone-Alpes"].includes(c.region)
  )

  const filtered = spanishCities.filter(c => {
    if (!search) return true
    const q = search.toLowerCase()
    return c.name.toLowerCase().includes(q) || (c.region && c.region.toLowerCase().includes(q))
  })

  // Group by region
  const regionMap: Record<string, CityStats[]> = {}
  filtered.forEach(c => {
    const r = c.region || "Sin region"
    if (!regionMap[r]) regionMap[r] = []
    regionMap[r].push(c)
  })
  const sortedRegions = Object.keys(regionMap).sort()

  const toggleRegion = (r: string) =>
    setExpandedRegions(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r])

  // Totals
  const totals = {
    candidates: spanishCities.reduce((a, c) => a + c.candidates, 0),
    businesses: spanishCities.reduce((a, c) => a + c.businesses, 0),
    flash: spanishCities.reduce((a, c) => a + c.flash_jobs, 0),
    subscribers: spanishCities.reduce((a, c) => a + c.subscribers, 0),
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#01A89E]" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-white border-l-4 border-l-[#01A89E]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-[#01A89E]" />
              <span className="text-xs text-slate-500">Candidatos</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{totals.candidates}</p>
            <p className="text-[10px] text-slate-400">En {spanishCities.filter(c => c.candidates > 0).length} provincias</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-l-4 border-l-[#F48221]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="h-4 w-4 text-[#F48221]" />
              <span className="text-xs text-slate-500">Empresas</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{totals.businesses}</p>
            <p className="text-[10px] text-slate-400">En {spanishCities.filter(c => c.businesses > 0).length} provincias</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-4 w-4 text-orange-500" />
              <span className="text-xs text-slate-500">Ofertas Flash</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{totals.flash}</p>
            <p className="text-[10px] text-slate-400">En {spanishCities.filter(c => c.flash_jobs > 0).length} provincias</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Crown className="h-4 w-4 text-amber-500" />
              <span className="text-xs text-slate-500">Suscriptores</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{totals.subscribers}</p>
            <p className="text-[10px] text-slate-400">En {spanishCities.filter(c => c.subscribers > 0).length} provincias</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar provincia o comunidad autonoma..."
          className="pl-9"
        />
      </div>

      <p className="text-xs text-slate-500">{spanishCities.length} provincias de Espana</p>

      {/* Province table grouped by region */}
      <div className="space-y-2">
        {sortedRegions.map(region => {
          const regionCities = regionMap[region]
          const isOpen = expandedRegions.includes(region) || search.length > 0
          const regionTotals = {
            candidates: regionCities.reduce((a, c) => a + c.candidates, 0),
            businesses: regionCities.reduce((a, c) => a + c.businesses, 0),
            flash: regionCities.reduce((a, c) => a + c.flash_jobs, 0),
            subs: regionCities.reduce((a, c) => a + c.subscribers, 0),
          }

          return (
            <Card key={region} className="bg-white overflow-hidden">
              <button
                onClick={() => toggleRegion(region)}
                className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors"
              >
                <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                  <MapPin className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-slate-800">{region}</p>
                  <p className="text-[10px] text-slate-400">{regionCities.length} provincia{regionCities.length !== 1 ? "s" : ""}</p>
                </div>
                <div className="hidden sm:flex items-center gap-2">
                  <Badge className="bg-[#01A89E]/10 text-[#01A89E] border-0 text-[10px] px-1.5"><Users className="h-2.5 w-2.5 mr-0.5" />{regionTotals.candidates}</Badge>
                  <Badge className="bg-orange-100 text-[#F48221] border-0 text-[10px] px-1.5"><Building2 className="h-2.5 w-2.5 mr-0.5" />{regionTotals.businesses}</Badge>
                  <Badge className="bg-orange-50 text-orange-600 border-0 text-[10px] px-1.5"><Zap className="h-2.5 w-2.5 mr-0.5" />{regionTotals.flash}</Badge>
                  <Badge className="bg-amber-50 text-amber-600 border-0 text-[10px] px-1.5"><Crown className="h-2.5 w-2.5 mr-0.5" />{regionTotals.subs}</Badge>
                </div>
                {isOpen ? <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" /> : <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />}
              </button>

              {isOpen && (
                <div className="border-t">
                  {/* Header */}
                  <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-slate-50 text-[10px] font-semibold text-slate-500">
                    <div className="col-span-4">Provincia</div>
                    <div className="col-span-2 text-center">Candidatos</div>
                    <div className="col-span-2 text-center">Empresas</div>
                    <div className="col-span-2 text-center">Flash</div>
                    <div className="col-span-2 text-center">Suscriptores</div>
                  </div>
                  {regionCities.sort((a, b) => a.name.localeCompare(b.name)).map(city => (
                    <div key={city.id} className="grid grid-cols-12 gap-2 px-4 py-2.5 border-t border-slate-50 hover:bg-slate-50/50 items-center">
                      <div className="col-span-4 flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full shrink-0 ${city.total > 0 ? "bg-emerald-400" : "bg-slate-200"}`} />
                        <span className="text-xs font-medium text-slate-700 truncate">{city.name}</span>
                      </div>
                      <div className="col-span-2 text-center">
                        <span className={`text-xs font-semibold ${city.candidates > 0 ? "text-[#01A89E]" : "text-slate-300"}`}>
                          {city.candidates}
                        </span>
                      </div>
                      <div className="col-span-2 text-center">
                        <span className={`text-xs font-semibold ${city.businesses > 0 ? "text-[#F48221]" : "text-slate-300"}`}>
                          {city.businesses}
                        </span>
                      </div>
                      <div className="col-span-2 text-center">
                        <span className={`text-xs font-semibold ${city.flash_jobs > 0 ? "text-orange-600" : "text-slate-300"}`}>
                          {city.flash_jobs}
                        </span>
                      </div>
                      <div className="col-span-2 text-center">
                        <span className={`text-xs font-semibold ${city.subscribers > 0 ? "text-amber-600" : "text-slate-300"}`}>
                          {city.subscribers}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <Card className="bg-white">
          <CardContent className="p-8 text-center">
            <MapPin className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No se encontraron provincias para &ldquo;{search}&rdquo;</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
