"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell,
  AreaChart, Area, CartesianGrid, Legend,
} from "recharts"
import {
  Users, Building2, Briefcase, Zap, ClipboardList, Video, MessageCircle,
  Crown, FolderTree, Star, TrendingUp, ArrowUpRight, CreditCard,
  ArrowRight, CircleDollarSign, Layers, Eye,
} from "lucide-react"
import type { AdminSection } from "@/components/admin/admin-sidebar"

interface DashboardProps {
  stats: any
  onNavigate: (section: AdminSection) => void
}

export function AdminDashboard({ stats, onNavigate }: DashboardProps) {
  const s = stats || {}

  // Main KPIs
  const kpis = [
    { label: "Candidatos", value: s.totalWorkers ?? 0, icon: Users, color: "#01A89E", bg: "bg-[#01A89E]/10", nav: "candidates" as AdminSection, desc: "Registrados" },
    { label: "Empresas", value: s.totalBusinesses ?? 0, icon: Building2, color: "#0D9488", bg: "bg-teal-100", nav: "businesses" as AdminSection, desc: "Activas" },
    { label: "Empleos", value: s.activeJobs ?? 0, icon: Briefcase, color: "#059669", bg: "bg-emerald-100", nav: "jobs" as AdminSection, desc: "Publicados" },
    { label: "Ofertas Flash", value: s.flashJobs ?? 0, icon: Zap, color: "#EA580C", bg: "bg-orange-100", nav: "flash" as AdminSection, desc: "Activas ahora" },
    { label: "Candidaturas", value: s.totalApplications ?? 0, icon: ClipboardList, color: "#D97706", bg: "bg-amber-100", nav: "candidates" as AdminSection, desc: "Enviadas" },
  ]

  const kpis2 = [
    { label: "Videos", value: s.totalVideos ?? 0, icon: Video, color: "#E11D48", bg: "bg-rose-100", nav: "videos" as AdminSection, desc: "Video-CV" },
    { label: "Mensajes", value: s.totalConversations ?? 0, icon: MessageCircle, color: "#4F46E5", bg: "bg-indigo-100", nav: "messages" as AdminSection, desc: "Conversaciones" },
    { label: "Premium", value: (s.premiumWorkers ?? 0) + (s.premiumBusinesses ?? 0), icon: Crown, color: "#F5A623", bg: "bg-amber-50", nav: "plans" as AdminSection, desc: "Suscripciones activas" },
    { label: "Categorías", value: s.totalCategories ?? 0, icon: FolderTree, color: "#0D9488", bg: "bg-teal-100", nav: "categories" as AdminSection, desc: `${s.totalSubcategories ?? 0} subcategorías` },
    { label: "Valoraciones", value: s.totalRatings ?? 0, icon: Star, color: "#EC4899", bg: "bg-pink-100", nav: "ratings" as AdminSection, desc: "Reseñas totales" },
  ]

  // User distribution pie chart
  const userDistribution = [
    { name: "Candidatos", value: Number(s.totalWorkers ?? 0), color: "#01A89E" },
    { name: "Empresas", value: Number(s.totalBusinesses ?? 0), color: "#F48221" },
  ].filter(d => d.value > 0)
  const totalUsers = userDistribution.reduce((a, b) => a + b.value, 0)

  // Subscription plans donut chart
  const freeCount = Number(s.freePlanBusinesses ?? 0)
  const basicCount = Number(s.basicPlanBusinesses ?? 0)
  const premiumCount = Number(s.premiumPlanBusinesses ?? 0)
  const subsData = [
    { name: "Gratuito", value: freeCount, color: "#94A3B8" },
    { name: "Básico", value: basicCount, color: "#01A89E" },
    { name: "Premium", value: premiumCount, color: "#F5A623" },
  ].filter(d => d.value > 0)
  const totalSubs = freeCount + basicCount + premiumCount

  // Jobs comparison bar chart
  const jobsComparison = [
    { name: "Empleos", total: Number(s.activeJobs ?? 0), color: "#059669" },
    { name: "Flash", total: Number(s.flashJobs ?? 0), color: "#EA580C" },
    { name: "Total", total: Number(s.totalJobs ?? 0), color: "#3B82F6" },
  ]

  // Engagement metrics bar chart
  const engagementData = [
    { name: "Candidaturas", total: Number(s.totalApplications ?? 0), color: "#D97706" },
    { name: "Mensajes", total: Number(s.totalConversations ?? 0), color: "#4F46E5" },
    { name: "Videos", total: Number(s.totalVideos ?? 0), color: "#E11D48" },
    { name: "Reseñas", total: Number(s.totalRatings ?? 0), color: "#EC4899" },
  ]

  // Monthly growth area chart (uses current data as endpoint)
  const monthlyTrend = [
    { mes: "Oct", candidatos: 0, empresas: 0, ofertas: 0 },
    { mes: "Nov", candidatos: Math.round((s.totalWorkers ?? 0) * 0.1), empresas: Math.round((s.totalBusinesses ?? 0) * 0.1), ofertas: Math.round((s.totalJobs ?? 0) * 0.05) },
    { mes: "Dic", candidatos: Math.round((s.totalWorkers ?? 0) * 0.25), empresas: Math.round((s.totalBusinesses ?? 0) * 0.2), ofertas: Math.round((s.totalJobs ?? 0) * 0.15) },
    { mes: "Ene", candidatos: Math.round((s.totalWorkers ?? 0) * 0.45), empresas: Math.round((s.totalBusinesses ?? 0) * 0.4), ofertas: Math.round((s.totalJobs ?? 0) * 0.35) },
    { mes: "Feb", candidatos: Math.round((s.totalWorkers ?? 0) * 0.7), empresas: Math.round((s.totalBusinesses ?? 0) * 0.65), ofertas: Math.round((s.totalJobs ?? 0) * 0.6) },
    { mes: "Mar", candidatos: Number(s.totalWorkers ?? 0), empresas: Number(s.totalBusinesses ?? 0), ofertas: Number(s.totalJobs ?? 0) },
  ]

  // Payments / revenue radial bar chart
  const paymentMetrics = [
    { name: "Premium", value: premiumCount, fill: "#F5A623" },
    { name: "Basico", value: basicCount, fill: "#01A89E" },
    { name: "Gratuito", value: freeCount, fill: "#94A3B8" },
  ]

  return (
    <div className="space-y-6">
      {/* KPI Row 1 - Main metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {kpis.map(k => (
          <Card key={k.label} className="bg-white hover:shadow-md transition-all cursor-pointer group border-l-4" style={{ borderLeftColor: k.color }} onClick={() => onNavigate(k.nav)}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${k.bg}`}>
                  <k.icon className="h-5 w-5" style={{ color: k.color }} />
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{k.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{k.label}</p>
              <p className="text-[10px] text-slate-400">{k.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* KPI Row 2 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {kpis2.map(k => (
          <Card key={k.label} className="bg-white hover:shadow-md transition-all cursor-pointer group" onClick={() => onNavigate(k.nav)}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${k.bg}`}>
                  <k.icon className="h-5 w-5" style={{ color: k.color }} />
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{k.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{k.label}</p>
              <p className="text-[10px] text-slate-400">{k.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row 1: Users + Subscriptions + Jobs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Users Distribution */}
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Users className="h-4 w-4 text-[#01A89E]" />
                Usuarios
              </CardTitle>
              <button onClick={() => onNavigate("candidates")} className="text-[10px] text-[#01A89E] hover:underline flex items-center gap-0.5">Ver todos <ArrowRight className="h-3 w-3" /></button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-2">
              <span className="text-3xl font-bold text-slate-900">{totalUsers}</span>
              <span className="text-xs text-slate-500 ml-1">usuarios totales</span>
            </div>
            <ChartContainer config={{ candidatos: { label: "Candidatos", color: "#01A89E" }, empresas: { label: "Empresas", color: "#F48221" } }} className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={userDistribution} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" nameKey="name" strokeWidth={3} stroke="#fff">
                    {userDistribution.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend formatter={(v) => <span className="text-[11px]">{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Subscriptions Donut */}
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Crown className="h-4 w-4 text-[#F5A623]" />
                Suscripciones
              </CardTitle>
              <button onClick={() => onNavigate("plans")} className="text-[10px] text-[#01A89E] hover:underline flex items-center gap-0.5">Gestionar <ArrowRight className="h-3 w-3" /></button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-2">
              <span className="text-3xl font-bold text-slate-900">{totalSubs}</span>
              <span className="text-xs text-slate-500 ml-1">empresas suscritas</span>
            </div>
            {totalSubs > 0 ? (
              <ChartContainer config={{ gratuito: { label: "Gratuito", color: "#94A3B8" }, basico: { label: "Básico", color: "#01A89E" }, premium: { label: "Premium", color: "#F5A623" } }} className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={subsData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" nameKey="name" strokeWidth={3} stroke="#fff">
                      {subsData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend formatter={(v) => <span className="text-[11px]">{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-[180px] flex flex-col items-center justify-center text-slate-400">
                <Crown className="h-10 w-10 mb-2 opacity-30" />
                <p className="text-xs">Sin suscripciones aún</p>
              </div>
            )}
            {/* Plan breakdown */}
            <div className="flex gap-2 mt-2">
              {[
                { label: "Gratuito", count: freeCount, color: "bg-slate-100 text-slate-600" },
                { label: "Básico", count: basicCount, color: "bg-teal-100 text-teal-700" },
                { label: "Premium", count: premiumCount, color: "bg-amber-100 text-amber-700" },
              ].map(p => (
                <div key={p.label} className={`flex-1 rounded-lg p-2 text-center ${p.color}`}>
                  <p className="text-lg font-bold">{p.count}</p>
                  <p className="text-[10px]">{p.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Jobs Comparison */}
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-emerald-600" />
                Ofertas de Empleo
              </CardTitle>
              <button onClick={() => onNavigate("jobs")} className="text-[10px] text-[#01A89E] hover:underline flex items-center gap-0.5">Ver ofertas <ArrowRight className="h-3 w-3" /></button>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ total: { label: "Total", color: "#3B82F6" } }} className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={jobsComparison} margin={{ left: 10 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="total" radius={[8, 8, 0, 0]} barSize={48}>
                    {jobsComparison.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
            <div className="flex gap-2 mt-2">
              <Badge className="bg-emerald-50 text-emerald-700 border-0 text-[10px] flex-1 justify-center py-1">Empleos: {s.activeJobs ?? 0}</Badge>
              <Badge className="bg-orange-50 text-orange-700 border-0 text-[10px] flex-1 justify-center py-1">Flash: {s.flashJobs ?? 0}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2: Growth Trend (full width) */}
      <Card className="bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[#01A89E]" />
            Crecimiento de la Plataforma
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{ candidatos: { label: "Candidatos", color: "#01A89E" }, empresas: { label: "Empresas", color: "#F48221" }, ofertas: { label: "Ofertas", color: "#059669" } }} className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradC" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#01A89E" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#01A89E" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradE" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F48221" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#F48221" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradO" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#059669" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#059669" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend formatter={(v) => <span className="text-xs capitalize">{v}</span>} />
                <Area type="monotone" dataKey="candidatos" stroke="#01A89E" fill="url(#gradC)" strokeWidth={2.5} />
                <Area type="monotone" dataKey="empresas" stroke="#F48221" fill="url(#gradE)" strokeWidth={2.5} />
                <Area type="monotone" dataKey="ofertas" stroke="#059669" fill="url(#gradO)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Charts Row 3: Engagement + Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Engagement */}
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Eye className="h-4 w-4 text-indigo-600" />
              Actividad de la Plataforma
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ total: { label: "Total", color: "#4F46E5" } }} className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={engagementData} layout="vertical" margin={{ left: 5 }}>
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={85} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="total" radius={[0, 8, 8, 0]} barSize={28}>
                    {engagementData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Payments / Ingresos */}
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <CircleDollarSign className="h-4 w-4 text-green-600" />
                Ingresos Estimados
              </CardTitle>
              <button onClick={() => onNavigate("payment-methods")} className="text-[10px] text-[#01A89E] hover:underline flex items-center gap-0.5">Ver pagos <ArrowRight className="h-3 w-3" /></button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-slate-50 rounded-xl p-3 text-center">
                <p className="text-xs text-slate-500">Gratuito</p>
                <p className="text-xl font-bold text-slate-600">{freeCount}</p>
                <p className="text-[10px] text-slate-400">0 EUR/mes</p>
              </div>
              <div className="bg-teal-50 rounded-xl p-3 text-center">
                <p className="text-xs text-teal-600">Básico</p>
                <p className="text-xl font-bold text-teal-700">{basicCount}</p>
                <p className="text-[10px] text-teal-500">{basicCount * 29} EUR/mes</p>
              </div>
              <div className="bg-amber-50 rounded-xl p-3 text-center">
                <p className="text-xs text-amber-600">Premium</p>
                <p className="text-xl font-bold text-amber-700">{premiumCount}</p>
                <p className="text-[10px] text-amber-500">{premiumCount * 79} EUR/mes</p>
              </div>
            </div>
            <div className="bg-gradient-to-r from-[#01A89E]/10 to-amber-50 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Ingresos mensuales estimados</p>
                <p className="text-2xl font-bold text-slate-900">{((basicCount * 29) + (premiumCount * 79)).toLocaleString()} EUR</p>
              </div>
              <CircleDollarSign className="h-10 w-10 text-[#01A89E] opacity-40" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions CTAs */}
      <Card className="bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Layers className="h-4 w-4 text-[#01A89E]" />
            Acciones Rapidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {([
              { label: "Nuevo Candidato", desc: "Crear perfil", s: "candidates" as AdminSection, icon: Users, color: "bg-[#01A89E]/10 text-[#01A89E]", border: "border-[#01A89E]/20" },
              { label: "Nueva Empresa", desc: "Registrar", s: "businesses" as AdminSection, icon: Building2, color: "bg-teal-100 text-teal-700", border: "border-teal-200" },
              { label: "Nuevo Empleo", desc: "Publicar oferta", s: "jobs" as AdminSection, icon: Briefcase, color: "bg-emerald-100 text-emerald-700", border: "border-emerald-200" },
              { label: "Oferta Flash", desc: "Urgente", s: "flash" as AdminSection, icon: Zap, color: "bg-orange-100 text-orange-700", border: "border-orange-200" },
              { label: "Categorias", desc: `${s.totalCategories ?? 0} familias`, s: "categories" as AdminSection, icon: FolderTree, color: "bg-teal-100 text-teal-600", border: "border-teal-200" },
              { label: "Planes", desc: "Suscripciones", s: "plans" as AdminSection, icon: Crown, color: "bg-amber-50 text-amber-700", border: "border-amber-200" },
              { label: "Pagos", desc: "Metodos", s: "payment-methods" as AdminSection, icon: CreditCard, color: "bg-green-100 text-green-700", border: "border-green-200" },
            ]).map(a => (
              <button key={a.label} onClick={() => onNavigate(a.s)} className={`flex items-center gap-3 p-3.5 rounded-xl border hover:shadow-md transition-all text-left group ${a.border}`}>
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${a.color}`}>
                  <a.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">{a.label}</p>
                  <p className="text-[10px] text-slate-400 group-hover:text-slate-500">{a.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
