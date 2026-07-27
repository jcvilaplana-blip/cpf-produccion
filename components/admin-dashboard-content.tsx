"use client"

import { useState, useMemo } from "react"
import Image from "next/image" 
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import {
  Users, Briefcase, Building2, FileText, Search, MapPin, Eye, Shield, Star,
  ChevronRight, TrendingUp, UserCheck, Zap, FolderTree, Pencil, Trash2,
  ChevronDown, ChevronUp, LayoutDashboard, X, Map
} from "lucide-react"
import { CATEGORIES } from "@/lib/categories"

interface AdminDashboardContentProps {
  user: any
  profile: any
  stats: {
    totalUsers: number
    totalCandidates: number
    totalBusinesses: number
    totalJobs: number
    activeJobs: number
    totalApplications: number
  }
  candidates: any[]
  businesses: any[]
  businessProfiles: any[]
  jobs: any[]
  applications: any[]
}

type AdminTab = "dashboard" | "candidates" | "businesses" | "jobs" | "flash" | "categories" | "map"

export function AdminDashboardContent({
  user, profile, stats, candidates, businesses, businessProfiles, jobs, applications,
}: AdminDashboardContentProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard")
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  // Real DB data only
  const allCandidates = useMemo(() => {
    return candidates.map(c => ({ ...c, _source: "db" as const }))
  }, [candidates])

  const allBusinesses = useMemo(() => {
    return businesses.map(b => {
      const biz = businessProfiles.find(bp => bp.id === b.id)
      return { ...b, company_name: biz?.company_name, business_type: biz?.business_type, city: biz?.city, verified: biz?.verified, company_logo_url: biz?.company_logo_url, _source: "db" as const }
    })
  }, [businesses, businessProfiles])

  const allJobs = useMemo(() => {
    return jobs.filter(j => !j.is_flash).map(j => ({ ...j, _source: "db" as const }))
  }, [jobs])

  const allFlash = useMemo(() => {
    return jobs.filter(j => j.is_flash).map(j => ({ ...j, _source: "db" as const }))
  }, [jobs])

  const filteredCandidates = allCandidates.filter(c =>
    (c.display_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.job_category || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.location || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.category || "").toLowerCase().includes(searchQuery.toLowerCase())
  )
  const filteredBusinesses = allBusinesses.filter(b =>
    (b.company_name || b.display_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (b.business_type || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (b.city || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (b.category || "").toLowerCase().includes(searchQuery.toLowerCase())
  )
  const filteredJobs = allJobs.filter(j =>
    (j.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (j.category || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (j.city || "").toLowerCase().includes(searchQuery.toLowerCase())
  )
  const filteredFlash = allFlash.filter(f =>
    (f.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (f.category || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (f.city || "").toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalStats = {
    totalUsers: stats.totalUsers,
    totalCandidates: stats.totalCandidates,
    totalBusinesses: stats.totalBusinesses,
    totalJobs: stats.totalJobs,
    activeJobs: stats.activeJobs,
    totalFlash: jobs.filter(j => j.is_flash).length,
    totalApplications: stats.totalApplications,
    totalCategories: CATEGORIES.length,
  }

  const tabs: { id: AdminTab; label: string; icon: any; count?: number }[] = [
    { id: "dashboard", label: "Panel", icon: LayoutDashboard },
    { id: "candidates", label: "Candidatos", icon: UserCheck, count: allCandidates.length },
    { id: "businesses", label: "Empresas", icon: Building2, count: allBusinesses.length },
    { id: "jobs", label: "Ofertas", icon: Briefcase, count: allJobs.length },
    { id: "flash", label: "Flash", icon: Zap, count: allFlash.length },
    { id: "categories", label: "Categorias", icon: FolderTree, count: CATEGORIES.length },
    { id: "map", label: "Mapa", icon: Map },
  ]

  return (
    <div className="min-h-screen bg-gray-50 md:pt-14">
      {/* Header */}
      <header className="bg-[#031140] text-white px-4 py-3 sticky top-0 z-40 pt-[env(safe-area-inset-top,0px)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-white/10 flex items-center justify-center">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight">Admin CamareroPorFavor</h1>
              <p className="text-[10px] text-white/60">Super Administrador</p>
            </div>
          </div>
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10 text-xs">
              Ir al Frontend
            </Button>
          </Link>
        </div>
      </header>

      {/* Tab Navigation - scrollable horizontal */}
      <nav className="bg-white border-b sticky top-[52px] z-30 overflow-x-auto">
        <div className="flex min-w-max px-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSearchQuery("") }}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-[#01A89E] text-[#01A89E]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
              {tab.count !== undefined && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.id ? "bg-[#01A89E]/10 text-[#01A89E]" : "bg-gray-100 text-gray-500"
                }`}>{tab.count}</span>
              )}
            </button>
          ))}
        </div>
      </nav>

      <main className="px-4 py-4 max-w-7xl mx-auto">
        {/* Search - visible in list tabs */}
        {activeTab !== "dashboard" && activeTab !== "map" && (
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={`Buscar en ${tabs.find(t => t.id === activeTab)?.label}...`}
              className="pl-10 bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="h-4 w-4 text-gray-400" />
              </button>
            )}
          </div>
        )}

        {/* ===== DASHBOARD TAB ===== */}
        {activeTab === "dashboard" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Candidatos", value: totalStats.totalCandidates, icon: UserCheck, color: "bg-[#01A89E]/10 text-[#01A89E]" },
                { label: "Empresas", value: totalStats.totalBusinesses, icon: Building2, color: "bg-teal-100 text-[#01A89E]" },
                { label: "Ofertas", value: totalStats.activeJobs, icon: Briefcase, color: "bg-emerald-100 text-emerald-600" },
                { label: "Flash", value: totalStats.totalFlash, icon: Zap, color: "bg-red-100 text-red-600" },
                { label: "Categorias", value: totalStats.totalCategories, icon: FolderTree, color: "bg-purple-100 text-purple-600" },
                { label: "Candidaturas", value: totalStats.totalApplications, icon: TrendingUp, color: "bg-pink-100 text-pink-600" },
                { label: "Total Usuarios", value: totalStats.totalUsers, icon: Users, color: "bg-amber-100 text-amber-600" },
                { label: "Total Ofertas", value: totalStats.totalJobs, icon: FileText, color: "bg-indigo-100 text-indigo-600" },
              ].map(s => (
                <Card key={s.label} className="bg-white">
                  <CardContent className="p-3">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center mb-2 ${s.color}`}>
                      <s.icon className="h-4 w-4" />
                    </div>
                    <p className="text-xl font-bold">{s.value}</p>
                    <p className="text-[10px] text-gray-500">{s.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick lists */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="bg-white">
                <CardHeader className="pb-2 px-4 pt-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-[#01A89E]" />
                    Candidatos Recientes
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3 space-y-1">
                  {allCandidates.slice(0, 6).map(c => (
                    <div key={c.id} className="flex items-center gap-2.5 p-1.5 rounded hover:bg-gray-50">
                      <div className="h-8 w-8 rounded-full bg-[#01A89E]/10 flex items-center justify-center overflow-hidden shrink-0">
                        {c.avatar_url ? <Image src={c.avatar_url} alt="" width={32} height={32} className="object-cover rounded-full" /> : <Users className="h-3.5 w-3.5 text-[#01A89E]" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{c.display_name}</p>
                        <p className="text-[10px] text-gray-400">{c.job_category || c.category}</p>
                      </div>
                      <Badge variant="secondary" className="text-[9px] px-1.5 py-0 shrink-0">{c._source === "db" ? "Real" : "Mock"}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="bg-white">
                <CardHeader className="pb-2 px-4 pt-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-[#01A89E]" />
                    Empresas Recientes
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3 space-y-1">
                  {allBusinesses.slice(0, 6).map(b => (
                    <div key={b.id} className="flex items-center gap-2.5 p-1.5 rounded hover:bg-gray-50">
                      <div className="h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center overflow-hidden shrink-0">
                        {b.company_logo_url ? <Image src={b.company_logo_url} alt="" width={32} height={32} className="object-cover rounded-full" /> : <Building2 className="h-3.5 w-3.5 text-[#01A89E]" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{b.company_name || b.display_name}</p>
                        <p className="text-[10px] text-gray-400">{b.business_type || b.category}</p>
                      </div>
                      <Badge variant="secondary" className="text-[9px] px-1.5 py-0 shrink-0">{b._source === "db" ? "Real" : "Mock"}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Card className="bg-white">
                <CardHeader className="pb-2 px-4 pt-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-emerald-500" />
                    Ofertas Recientes
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3 space-y-1">
                  {allJobs.slice(0, 6).map(j => (
                    <div key={j.id} className="flex items-center gap-2.5 p-1.5 rounded hover:bg-gray-50">
                      <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                        <Briefcase className="h-3.5 w-3.5 text-emerald-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{j.title}</p>
                        <p className="text-[10px] text-gray-400">{j.category} - {j.city}</p>
                      </div>
                      <Badge variant="secondary" className="text-[9px] px-1.5 py-0 shrink-0">{j._source === "db" ? "Real" : "Mock"}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="bg-white">
                <CardHeader className="pb-2 px-4 pt-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Zap className="h-4 w-4 text-red-500" />
                    Ofertas Flash Recientes
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3 space-y-1">
                  {allFlash.slice(0, 6).map(f => (
                    <div key={f.id} className="flex items-center gap-2.5 p-1.5 rounded hover:bg-gray-50">
                      <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                        <Zap className="h-3.5 w-3.5 text-red-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{f.title}</p>
                        <p className="text-[10px] text-gray-400">{f.category} - {f.city}</p>
                      </div>
                      {f.urgency && <Badge className="text-[9px] px-1.5 py-0 bg-red-100 text-red-600 shrink-0">{f.urgency}</Badge>}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ===== CANDIDATES TAB ===== */}
        {activeTab === "candidates" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">{filteredCandidates.length} candidatos</p>
            </div>
            {filteredCandidates.map(c => (
              <Card key={c.id} className="bg-white">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-full bg-[#01A89E]/10 flex items-center justify-center overflow-hidden shrink-0">
                      {c.avatar_url ? <Image src={c.avatar_url} alt="" width={44} height={44} className="object-cover rounded-full" /> : <Users className="h-5 w-5 text-[#01A89E]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold truncate">{c.display_name || "Sin nombre"}</p>
                        <Badge variant="secondary" className="text-[9px] px-1.5 py-0">{c._source === "db" ? "Real" : "Mock"}</Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                        {(c.category || c.job_category) && <Badge className="text-[10px] px-1.5 py-0 bg-[#01A89E]/10 text-[#01A89E] border-0">{c.category || c.job_category}</Badge>}
                        {c.job_category && c.category && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{c.job_category}</Badge>}
                        {c.location && <span className="text-[10px] text-gray-400 flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{c.location}</span>}
                      </div>
                    </div>
                    <div className="text-right shrink-0 space-y-1">
                      {c.rating > 0 && <span className="text-xs text-amber-500 flex items-center gap-0.5 justify-end"><Star className="h-3 w-3 fill-amber-500" />{Number(c.rating).toFixed(1)}</span>}
                      {c.mux_playback_id && <Badge className="text-[9px] px-1.5 py-0 bg-purple-100 text-purple-600 border-0">Video</Badge>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* ===== BUSINESSES TAB ===== */}
        {activeTab === "businesses" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">{filteredBusinesses.length} empresas</p>
            </div>
            {filteredBusinesses.map(b => (
              <Card key={b.id} className="bg-white">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-full bg-teal-100 flex items-center justify-center overflow-hidden shrink-0">
                      {b.company_logo_url ? <Image src={b.company_logo_url} alt="" width={44} height={44} className="object-cover rounded-full" /> : <Building2 className="h-5 w-5 text-[#01A89E]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold truncate">{b.company_name || b.display_name}</p>
                        <Badge variant="secondary" className="text-[9px] px-1.5 py-0">{b._source === "db" ? "Real" : "Mock"}</Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                        {(b.category || b.business_type) && <Badge className="text-[10px] px-1.5 py-0 bg-teal-50 text-[#01A89E] border-0">{b.category || b.business_type}</Badge>}
                        {b.city && <span className="text-[10px] text-gray-400 flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{b.city}</span>}
                        {b.verified && <Badge className="text-[9px] px-1.5 py-0 bg-emerald-100 text-emerald-700 border-0">Verificado</Badge>}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* ===== JOBS TAB ===== */}
        {activeTab === "jobs" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">{filteredJobs.length} ofertas</p>
            </div>
            {filteredJobs.map(j => (
              <Card key={j.id} className="bg-white">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                      <Briefcase className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold truncate">{j.title}</p>
                        <Badge variant="secondary" className="text-[9px] px-1.5 py-0">{j._source === "db" ? "Real" : "Mock"}</Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                        <Badge className="text-[10px] px-1.5 py-0 bg-emerald-50 text-emerald-600 border-0">{j.category}</Badge>
                        {j.city && <span className="text-[10px] text-gray-400 flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{j.city}</span>}
                        {j.contract_type && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{j.contract_type}</Badge>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {j.salary_range && <p className="text-xs font-medium text-emerald-600">{j.salary_range}</p>}
                      <span className="text-[10px] text-gray-400 flex items-center gap-0.5 justify-end"><Eye className="h-2.5 w-2.5" />{j.views || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* ===== FLASH TAB ===== */}
        {activeTab === "flash" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">{filteredFlash.length} ofertas flash</p>
            </div>
            {filteredFlash.map(f => (
              <Card key={f.id} className="bg-white border-red-100">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                      <Zap className="h-5 w-5 text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold truncate">{f.title}</p>
                        {f.urgency && <Badge className="text-[9px] px-1.5 py-0 bg-red-100 text-red-600 border-0">{f.urgency}</Badge>}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                        <Badge className="text-[10px] px-1.5 py-0 bg-red-50 text-red-600 border-0">{f.category}</Badge>
                        {f.city && <span className="text-[10px] text-gray-400 flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{f.city}</span>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {f.salary_range && <p className="text-xs font-medium text-red-600">{f.salary_range}</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* ===== CATEGORIES TAB ===== */}
        {activeTab === "categories" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500">{CATEGORIES.length} familias profesionales</p>
            </div>
            {CATEGORIES.filter(c =>
              !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              c.subcategories.some(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
            ).map(cat => (
              <Card key={cat.slug} className="bg-white">
                <CardContent className="p-0">
                  <button
                    onClick={() => setExpandedCategory(expandedCategory === cat.slug ? null : cat.slug)}
                    className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="h-9 w-9 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                      <FolderTree className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{cat.name}</p>
                      <p className="text-[10px] text-gray-400">{cat.subcategories.length} subcategorias</p>
                    </div>
                    {expandedCategory === cat.slug ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                  </button>
                  {expandedCategory === cat.slug && (
                    <div className="border-t px-3 py-2 space-y-1 bg-gray-50/50">
                      {cat.subcategories.map(sub => (
                        <div key={sub.slug} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-white">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                            <span className="text-xs">{sub.name}</span>
                          </div>
                          <span className="text-[10px] text-gray-400">{sub.slug}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* ===== MAP TAB ===== */}
        {activeTab === "map" && (
          <div className="space-y-3">
            <p className="text-xs text-gray-500">Vista de mapa en tiempo real con todos los marcadores</p>
            <Card className="bg-white overflow-hidden">
              <CardContent className="p-0">
                <div className="h-[calc(100vh-200px)] min-h-[400px] relative">
                  <AdminMapView
                    candidates={allCandidates}
                    businesses={allBusinesses}
                    flashOffers={allFlash}
                  />
                </div>
              </CardContent>
            </Card>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#01A89E]" />Candidatos ({allCandidates.length})</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#01A89E]" />Empresas ({allBusinesses.length})</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#EF4444]" />Flash ({allFlash.length})</span>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

// ===== ADMIN MAP VIEW - Embedded map with colored markers =====
function AdminMapView({ candidates, businesses, flashOffers }: { candidates: any[]; businesses: any[]; flashOffers: any[] }) {
  const [mapError, setMapError] = useState(false)
  const mapRef = useState<HTMLDivElement | null>(null)

  if (mapError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <p className="text-sm text-gray-500">No se pudo cargar el mapa</p>
      </div>
    )
  }

  return (
    <AdminMapInner
      candidates={candidates}
      businesses={businesses}
      flashOffers={flashOffers}
      onError={() => setMapError(true)}
    />
  )
}

function AdminMapInner({ candidates, businesses, flashOffers, onError }: {
  candidates: any[]; businesses: any[]; flashOffers: any[]; onError: () => void
}) {
  const containerRef = useState<HTMLDivElement | null>(null)
  const mapInitRef = useState(false)

  useState(() => {
    // Use useEffect-like pattern via useState initializer (runs once)
    if (typeof window === "undefined") return

    const init = async () => {
      try {
        const { getMapboxToken } = await import("@/lib/mapbox")
        const token = await getMapboxToken()
        if (!token) { onError(); return }

        const mapboxgl = (await import("mapbox-gl")).default

        // Add CSS
        if (!document.querySelector('link[href*="mapbox-gl"]')) {
          const link = document.createElement("link")
          link.rel = "stylesheet"
          link.href = "https://api.mapbox.com/mapbox-gl-js/v3.1.2/mapbox-gl.css"
          document.head.appendChild(link)
        }

        mapboxgl.accessToken = token

        // Wait for container
        await new Promise(r => setTimeout(r, 200))
        const container = document.getElementById("admin-map-container")
        if (!container) return

        const map = new mapboxgl.Map({
          container,
          style: "mapbox://styles/mapbox/light-v11",
          center: [-3.7038, 40.0],
          zoom: 5.5,
        })

        map.addControl(new mapboxgl.NavigationControl(), "top-right")

        map.on("load", () => {
          // Add candidate markers
          candidates.forEach(c => {
            if (!c.latitude && !c.longitude) return
            const el = document.createElement("div")
            el.style.cssText = "width:12px;height:12px;border-radius:50%;background:#01A89E;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,.3);cursor:pointer"
            new mapboxgl.Marker(el).setLngLat([c.longitude || 0, c.latitude || 0])
              .setPopup(new mapboxgl.Popup({ offset: 10 }).setHTML(`<strong>${c.display_name}</strong><br/><small>${c.job_category || c.category || ""}</small>`))
              .addTo(map)
          })

          // Add business markers
          businesses.forEach(b => {
            if (!b.latitude && !b.longitude) return
            const el = document.createElement("div")
            el.style.cssText = "width:12px;height:12px;border-radius:50%;background:#01A89E;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,.3);cursor:pointer"
            new mapboxgl.Marker(el).setLngLat([b.longitude || 0, b.latitude || 0])
              .setPopup(new mapboxgl.Popup({ offset: 10 }).setHTML(`<strong>${b.company_name || b.display_name}</strong><br/><small>${b.business_type || b.category || ""}</small>`))
              .addTo(map)
          })

          // Add flash markers
          flashOffers.forEach(f => {
            if (!f.latitude && !f.longitude) return
            const el = document.createElement("div")
            el.style.cssText = "width:14px;height:14px;border-radius:50%;background:#EF4444;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.3);cursor:pointer;animation:pulse 2s infinite"
            new mapboxgl.Marker(el).setLngLat([f.longitude || 0, f.latitude || 0])
              .setPopup(new mapboxgl.Popup({ offset: 10 }).setHTML(`<strong>${f.title}</strong><br/><small>${f.category || ""}</small>`))
              .addTo(map)
          })
        })
      } catch {
        onError()
      }
    }
    init()
  })

  return <div id="admin-map-container" className="w-full h-full" />
}
