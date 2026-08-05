"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation" 
import Link from "next/link"
import useSWR, { mutate as globalMutate } from "swr"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"
import { AdminSidebar, type AdminSection } from "@/components/admin/admin-sidebar"
import { AdminCategories } from "@/components/admin/admin-categories"
import { AdminDashboard } from "@/components/admin/admin-dashboard"
import { AdminCities } from "@/components/admin/admin-cities"
import { AdminCandidatePreview } from "@/components/admin/admin-candidate-preview"
import { AdminSettingsSection } from "@/components/admin/admin-settings-section"
import { AdminCrudTable, type ColumnDef } from "@/components/admin/admin-crud-table"
import { BUSINESS_VENUE_TYPES } from "@/lib/business-venue-types"
import { RATING_CRITERIA, readCriterion } from "@/lib/rating-criteria"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import {
  Users, Building2, Briefcase, Zap, FolderTree, Star, MessageCircle,
  Crown, Globe, MapPin, Languages, CreditCard, Plug, Settings,
  TrendingUp, UserCheck, ClipboardList, Search, Menu,
  Pencil, Trash2, Plus, Eye, ExternalLink,
  CheckCircle, XCircle, X, Shield, Bell,
} from "lucide-react"

const supabase = createClient()
const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function AdminPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [section, setSection] = useState<AdminSection>("dashboard")
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [mobileOpen, setMobileOpen] = useState(false)
  const [previewCandidate, setPreviewCandidate] = useState<any>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [editDialog, setEditDialog] = useState<{ open: boolean; type: string; item: any }>({ open: false, type: "", item: null })
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; type: string; item: any; endpoint: string }>({ open: false, type: "", item: null, endpoint: "" })
  const [saving, setSaving] = useState(false)
  const [notifForm, setNotifForm] = useState({ title: "", body: "", type: "aviso", target_scope: "all", target_user_id: "", link: "" })
  const [notifTargetSearch, setNotifTargetSearch] = useState("")
  const [notifTargetResults, setNotifTargetResults] = useState<any[]>([])
  const [notifSelectedTarget, setNotifSelectedTarget] = useState<any>(null)
  const [notifSending, setNotifSending] = useState(false)
  const [notifError, setNotifError] = useState("")

  // Auth guard: only allow admin users. Reads from the single shared
  // AuthProvider instead of running its own independent getSession() check -
  // a separate direct check here (with its own hard timeout) used to force
  // a logout redirect whenever the profile fetch was merely slow, even for a
  // genuinely logged-in admin.
  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) {
      router.push("/auth/login")
      return
    }
    if (!user) return
    if (user.userType === "admin") {
      setAuthChecked(true)
    } else {
      router.push("/auth/login")
    }
  }, [authLoading, isAuthenticated, user, router])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])
  useEffect(() => { setSearch(""); setDebouncedSearch("") }, [section])

  // Search candidates/businesses for the notification target picker
  useEffect(() => {
    if (notifForm.target_scope !== "user" || !notifTargetSearch.trim()) {
      setNotifTargetResults([])
      return
    }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/admin/profiles?search=${encodeURIComponent(notifTargetSearch)}&limit=8`)
      const json = await res.json()
      setNotifTargetResults(json.data || [])
    }, 300)
    return () => clearTimeout(t)
  }, [notifTargetSearch, notifForm.target_scope])

  // ===== SWR DATA =====
  const { data: stats } = useSWR("/api/admin/stats", fetcher, { refreshInterval: 30000 })
  const candidatesKey = section === "candidates" ? `/api/admin/profiles?user_type=worker&search=${debouncedSearch}` : null
  const { data: candidatesData } = useSWR(candidatesKey, fetcher)
  const businessesKey = section === "businesses" ? `/api/admin/businesses?search=${debouncedSearch}` : null
  const { data: businessesData } = useSWR(businessesKey, fetcher)
  const jobsKey = section === "jobs" ? `/api/admin/jobs?is_flash=false&search=${debouncedSearch}` : null
  const { data: jobsData } = useSWR(jobsKey, fetcher)
  const flashKey = section === "flash" ? `/api/admin/jobs?is_flash=true&search=${debouncedSearch}` : null
  const { data: flashData } = useSWR(flashKey, fetcher)
  const catsKey = section === "categories" ? "/api/admin/categories" : null
  const { data: catsData } = useSWR(catsKey, fetcher)
  const { data: ratingsData } = useSWR(section === "ratings" ? `/api/admin/ratings?search=${debouncedSearch}` : null, fetcher)
  const { data: applicationsData } = useSWR(section === "applications" ? "/api/admin/applications?limit=100" : null, fetcher)
  const { data: integrationsData } = useSWR(section === "apis" ? "/api/admin/integrations" : null, fetcher)
  const { data: micropaymentsData } = useSWR(section === "micropayments" ? "/api/admin/micropayments" : null, fetcher)
  const { data: subsData } = useSWR(section === "subscriptions" ? `/api/admin/subscriptions?search=${debouncedSearch}` : null, fetcher)
  const { data: interviewsData } = useSWR(section === "interviews" ? `/api/admin/interviews?search=${debouncedSearch}` : null, fetcher)
  const { data: msgsData } = useSWR(section === "messages" ? "/api/admin/messages" : null, fetcher)
  const notifKey = section === "notifications" ? "/api/admin/notifications" : null
  const { data: notifData } = useSWR(notifKey, fetcher)

  const countriesKey = section === "countries" ? `/api/admin/countries?search=${debouncedSearch}` : null
  const { data: countriesData } = useSWR(countriesKey, fetcher)
  const citiesKey = section === "cities" ? `/api/admin/cities?search=${debouncedSearch}` : null
  const { data: citiesData } = useSWR(citiesKey, fetcher)
  const langsKey = section === "languages" ? `/api/admin/languages?search=${debouncedSearch}` : null
  const { data: langsData } = useSWR(langsKey, fetcher)
  const pmKey = section === "payment-methods" ? "/api/admin/payment-methods" : null
  const { data: pmData } = useSWR(pmKey, fetcher)
  const jobPaymentsKey = section === "job-payments" ? "/api/admin/job-payments" : null
  const { data: jobPaymentsData, mutate: mutateJobPayments } = useSWR(jobPaymentsKey, fetcher)
  const pointsLedgerKey = section === "points-ledger" ? `/api/admin/points-ledger?search=${debouncedSearch}` : null
  const { data: pointsLedgerData } = useSWR(pointsLedgerKey, fetcher)
  const plansKey = section === "plans" ? "/api/admin/plans" : null
  const { data: plansData } = useSWR(plansKey, fetcher)

  // Also fetch countries list when on cities section (for the country selector)
  const { data: countriesListData } = useSWR(section === "cities" ? "/api/admin/countries" : null, fetcher)

  // ===== DATA EXTRACTION =====
  const candidates = candidatesData?.data || []
  const businesses = businessesData?.data || []
  const regularJobs = jobsData?.data || []
  const flashJobs = flashData?.data || []
  const categories = catsData?.categories || catsData?.data || []
  const subcategories = catsData?.subcategories || []
  const ratings = ratingsData?.data || []
  const applications = applicationsData?.data || []
  const interviews = interviewsData?.data || []
  const conversations = msgsData?.data || []
  const sentNotifications = notifData?.data || []
  const countries = countriesData?.data || []
  const countriesList = countriesListData?.data || countries
  const cities = citiesData?.data || []
  const languages = langsData?.data || []
  const paymentMethods = pmData?.data || []
  const plans = plansData?.data || []
  const jobPayments = jobPaymentsData?.data || []
  const pointsLedger = pointsLedgerData?.data || []
  const completedReferrals = pointsLedgerData?.completedReferrals ?? 0

  // ===== HANDLERS =====
  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = "/auth/login"
  }

  const [reactivatingId, setReactivatingId] = useState<string | null>(null)
  const handleReactivateJobPayment = async (id: string) => {
    setReactivatingId(id)
    try {
      const res = await fetch(`/api/admin/micropayments/${id}/activate`, { method: "POST" })
      if (res.ok) mutateJobPayments()
    } finally {
      setReactivatingId(null)
    }
  }

  const handleSendNotification = async () => {
    setNotifError("")
    if (!notifForm.title.trim() || !notifForm.body.trim()) {
      setNotifError("El título y el mensaje son obligatorios")
      return
    }
    if (notifForm.target_scope === "user" && !notifSelectedTarget) {
      setNotifError("Selecciona un destinatario")
      return
    }
    setNotifSending(true)
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...notifForm,
          target_user_id: notifSelectedTarget?.id || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setNotifError(json.error || "Error al enviar la notificación")
        return
      }
      setNotifForm({ title: "", body: "", type: "aviso", target_scope: "all", target_user_id: "", link: "" })
      setNotifSelectedTarget(null)
      setNotifTargetSearch("")
      setNotifTargetResults([])
      if (notifKey) globalMutate(notifKey)
    } finally {
      setNotifSending(false)
    }
  }

  const handleDeleteNotification = async (id: string) => {
    if (!confirm("¿Eliminar esta notificación enviada?")) return
    await fetch("/api/admin/notifications", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    if (notifKey) globalMutate(notifKey)
  }

  // Loading guard - AFTER all hooks
  if (authLoading || !authChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#01A89E] mx-auto mb-4" />
          <p className="text-sm text-slate-500">Verificando acceso de administrador...</p>
        </div>
      </div>
    )
  }

  // ===== CRUD COLUMN DEFS =====
  const candidateColumns: ColumnDef[] = [
    // -- Visual / Media (top of form) --
    { key: "avatar_url", label: "Foto de Perfil", type: "avatar", editable: true },
    { key: "portfolio_images", label: "Portfolio de Imagenes (max 3)", type: "images", editable: true, maxImages: 3 },
    // -- Basic info --
    { key: "display_name", label: "Nombre", editable: true, render: (v) => <span className="text-sm font-semibold">{v || "Sin nombre"}</span> },
    { key: "email", label: "Email", editable: false, render: (v) => <span className="text-sm text-muted-foreground">{v || "Sin email"}</span> },
    { key: "password", label: "Nueva Contraseña", editable: true, createOnly: false, type: "password" },
    { key: "phone", label: "Teléfono", editable: true },
    { key: "date_of_birth", label: "Fecha de nacimiento", editable: true },
    { key: "location", label: "Ubicación", editable: true },
    { key: "bio", label: "Bio", type: "textarea", editable: true },
    { key: "job_category", label: "Categoría profesional", type: "category", editable: true },
    { key: "specialties", label: "Especialidades", type: "subcategories", editable: true },
    { key: "skills", label: "Destrezas (JSON)", type: "json", editable: true },
    { key: "experience_years", label: "Años experiencia", type: "number", editable: true },
    { key: "availability_status", label: "Disponibilidad", editable: true, type: "select", options: [{ value: "available", label: "Disponible" }, { value: "busy", label: "Ocupado" }, { value: "not_looking", label: "No busca" }] },
    { key: "contract_type_sought", label: "Tipo de contrato", type: "select", editable: true, options: [{ value: "full_time", label: "Tiempo completo" }, { value: "part_time", label: "Tiempo parcial" }, { value: "temporary", label: "Temporal" }, { value: "freelance", label: "Freelance" }, { value: "internship", label: "Prácticas" }] },
    { key: "languages", label: "Idioma principal", type: "select", editable: true, options: [{ value: "es", label: "Español" }, { value: "en", label: "Inglés" }] },
    // -- Status --
    { key: "is_active", label: "Activo", type: "boolean", editable: true },
    { key: "is_premium", label: "Premium", type: "boolean", editable: true },
    { key: "is_admin", label: "Admin", type: "boolean", editable: true },
    { key: "points", label: "Puntos", type: "number", editable: true },
    { key: "level", label: "Nivel", type: "number", editable: true },
    { key: "rating", label: "Rating", type: "number", editable: true },
    { key: "badges", label: "Insignias (JSON) — incl. 'Perfil del Mes'", type: "json", editable: true },
  ]

  const businessColumns: ColumnDef[] = [
    // -- Visual / Media (solo imagenes, NO video para empresas) --
    { key: "company_logo_url", label: "Logo de Empresa", type: "avatar", editable: true },
    { key: "photos", label: "Fotos del Negocio (max 5)", type: "images", editable: true, maxImages: 5 },
    { key: "video_url", label: "Vídeo del Negocio", type: "video", editable: true },
    // -- Basic info --
    { key: "company_name", label: "Empresa", editable: true, render: (v) => <span className="text-sm font-semibold">{v || "Sin nombre"}</span> },
    { key: "email", label: "Email", editable: true },
    { key: "company_description", label: "Descripción", type: "textarea", editable: true },
    { key: "business_type", label: "Tipo de local", editable: true, type: "select", options: BUSINESS_VENUE_TYPES.map((name) => ({ value: name, label: name })) },
    { key: "category_id", label: "Categoría", type: "category", editable: true },
    { key: "phone", label: "Teléfono", editable: true },
    { key: "website", label: "Web", editable: true },
    { key: "address", label: "Dirección", editable: true },
    { key: "city", label: "Ciudad", editable: true },
    { key: "service_description", label: "Descripción servicio", type: "textarea", editable: true },
    { key: "avg_salary_range", label: "Rango salarial", editable: true },
    { key: "hiring_history_count", label: "Contrataciones", type: "number", editable: true },
    // -- Status --
    { key: "verified", label: "Verificada", type: "boolean", editable: true },
    { key: "is_premium", label: "Premium", type: "boolean", editable: true },
    { key: "subscription_plan", label: "Plan suscripción", editable: true, type: "select", options: [{ value: "free", label: "Gratuito" }, { value: "basic", label: "Básico" }, { value: "premium", label: "Premium" }] },
    { key: "points", label: "Puntos", type: "number", editable: true },
    { key: "level", label: "Nivel", type: "number", editable: true },
    { key: "flash_credits", label: "Créditos Oferta Flash", type: "number", editable: true },
    { key: "highlight_credits", label: "Créditos Destacar", type: "number", editable: true },
    { key: "badges", label: "Insignias (JSON) — incl. 'Formador'/'Rotación Baja'", type: "json", editable: true },
  ]

  const jobColumns: ColumnDef[] = [
    { key: "title", label: "Título", editable: true, render: (v) => <span className="text-sm font-semibold">{v || "Sin título"}</span> },
    { key: "position", label: "Puesto", editable: true },
    { key: "description", label: "Descripción", type: "textarea", editable: true },
    { key: "requirements", label: "Requisitos", type: "textarea", editable: true },
    { key: "benefits", label: "Beneficios", type: "textarea", editable: true },
    { key: "category", label: "Categoría", type: "category", editable: true },
    { key: "contract_type", label: "Tipo contrato", editable: true, type: "select", options: [{ value: "full_time", label: "Tiempo completo" }, { value: "part_time", label: "Tiempo parcial" }, { value: "temporary", label: "Temporal" }, { value: "internship", label: "Practicas" }, { value: "freelance", label: "Freelance" }] },
    { key: "experience_required", label: "Experiencia requerida", editable: true },
    { key: "work_schedule", label: "Horario", editable: true },
    { key: "city", label: "Ciudad", editable: true },
    { key: "location", label: "Ubicacion", editable: true },
    { key: "salary_min", label: "Salario min", type: "number", editable: true },
    { key: "salary_max", label: "Salario max", type: "number", editable: true },
    { key: "salary_display", label: "Salario visible", editable: true },
    { key: "vacancies", label: "Vacantes", type: "number", editable: true },
    { key: "start_date", label: "Fecha incorporación (ISO)", editable: true },
    { key: "languages_required", label: "Idiomas requeridos (JSON)", type: "json", editable: true },
    { key: "uniform_required", label: "Uniforme", type: "boolean", editable: true },
    { key: "tpv_required", label: "TPV requerido", type: "boolean", editable: true },
    { key: "is_active", label: "Activa", type: "boolean", editable: true },
    { key: "is_highlighted", label: "Destacada", type: "boolean", editable: true },
    { key: "latitude", label: "Latitud", type: "number", editable: true },
    { key: "longitude", label: "Longitud", type: "number", editable: true },
  ]

  const flashColumns: ColumnDef[] = [
    ...jobColumns.filter(c => c.key !== "is_highlighted"),
    { key: "flash_expires_at", label: "Expira flash", editable: true },
  ]

  const categoryColumns: ColumnDef[] = [
    { key: "name", label: "Nombre", editable: true, render: (v) => <span className="text-sm font-semibold">{v}</span> },
    { key: "slug", label: "Slug", editable: true, render: (v) => <Badge className="text-[9px] px-1.5 py-0 bg-slate-100 text-slate-700 border-0 font-mono">{v}</Badge> },
    { key: "icon", label: "Icono", editable: true },
    { key: "sort_order", label: "Orden", type: "number", editable: true },
  ]

  const countryColumns: ColumnDef[] = [
    { key: "flag", label: "Bandera", editable: true, render: (v) => <span className="text-lg mr-1">{v}</span> },
    { key: "code", label: "Codigo", editable: true, render: (v) => <Badge className="text-[9px] px-1.5 py-0 bg-slate-100 text-slate-700 border-0 font-mono">{v}</Badge> },
    { key: "name", label: "Nombre", editable: true, render: (v) => <span className="text-sm font-semibold">{v}</span> },
    { key: "name_en", label: "Nombre (EN)", editable: true },
    { key: "phone_prefix", label: "Prefijo tel.", editable: true, render: (v) => v ? <span className="text-xs text-slate-500">{v}</span> : null },
    { key: "currency", label: "Moneda", editable: true, render: (v) => v ? <Badge className="text-[9px] px-1.5 py-0 bg-teal-50 text-[#01A89E] border-0">{v}</Badge> : null },
    { key: "is_active", label: "Activo", type: "boolean", editable: true },
    { key: "sort_order", label: "Orden", type: "number", editable: true },
  ]
  const cityColumns: ColumnDef[] = [
    { key: "name", label: "Ciudad", editable: true, render: (v) => <span className="text-sm font-semibold">{v}</span> },
    { key: "name_en", label: "Nombre (EN)", editable: true },
    { key: "region", label: "Region", editable: true, render: (v) => v ? <span className="text-xs text-slate-500">{v}</span> : null },
    { key: "country", label: "Pais", render: (_, row) => row.country ? <Badge className="text-[9px] px-1.5 py-0 bg-slate-100 text-slate-600 border-0">{row.country.flag} {row.country.name}</Badge> : null },
    { key: "country_id", label: "Pais", editable: true, type: "select", options: countriesList.map((c: any) => ({ value: c.id, label: `${c.flag || ""} ${c.name}` })) },
    { key: "latitude", label: "Latitud", type: "number", editable: true },
    { key: "longitude", label: "Longitud", type: "number", editable: true },
    { key: "is_active", label: "Activo", type: "boolean", editable: true },
    { key: "sort_order", label: "Orden", type: "number", editable: true },
  ]
  const langColumns: ColumnDef[] = [
    { key: "flag", label: "Bandera", editable: true, render: (v) => <span className="text-lg mr-1">{v}</span> },
    { key: "code", label: "Codigo", editable: true, render: (v) => <Badge className="text-[9px] px-1.5 py-0 bg-slate-100 text-slate-700 border-0 font-mono">{v}</Badge> },
    { key: "name", label: "Nombre", editable: true, render: (v) => <span className="text-sm font-semibold">{v}</span> },
    { key: "native_name", label: "Nombre nativo", editable: true, render: (v) => <span className="text-xs text-slate-500">{v}</span> },
    { key: "is_active", label: "Activo", type: "boolean", editable: true },
    { key: "sort_order", label: "Orden", type: "number", editable: true },
  ]
  const pmColumns: ColumnDef[] = [
    { key: "provider", label: "Proveedor", editable: true, createOnly: true, render: (v) => <Badge className="text-[9px] px-1.5 py-0 bg-slate-100 text-slate-700 border-0 font-mono uppercase">{v}</Badge> },
    { key: "display_name", label: "Nombre", editable: true, render: (v) => <span className="text-sm font-semibold">{v}</span> },
    { key: "description", label: "Descripcion", type: "textarea", editable: true, render: (v) => v ? <span className="text-xs text-slate-500 line-clamp-1">{v}</span> : null },
    { key: "config", label: "Configuracion", type: "json", editable: true },
    { key: "is_active", label: "Activo", type: "boolean", editable: true },
    { key: "sort_order", label: "Orden", type: "number", editable: true },
  ]
  const planColumns: ColumnDef[] = [
    { key: "slug", label: "Slug", editable: true, createOnly: true, render: (v) => <Badge className="text-[9px] px-1.5 py-0 bg-slate-100 text-slate-700 border-0 font-mono">{v}</Badge> },
    { key: "name", label: "Nombre", editable: true, render: (v, row) => <span className="text-sm font-semibold">{v} {row.slug === "premium" ? <Crown className="inline h-3.5 w-3.5 text-[#F5A623] ml-0.5" /> : null}</span> },
    { key: "description", label: "Descripcion", type: "textarea", editable: true },
    { key: "price_monthly", label: "Precio/mes", type: "number", editable: true, render: (v) => <Badge className="text-[9px] px-1.5 py-0 bg-emerald-50 text-emerald-700 border-0">{Number(v).toFixed(2)} EUR</Badge> },
    { key: "price_yearly", label: "Precio/anual", type: "number", editable: true },
    { key: "currency", label: "Moneda", editable: true },
    { key: "max_jobs", label: "Max ofertas", type: "number", editable: true },
    { key: "max_flash", label: "Max flash", type: "number", editable: true },
    { key: "max_candidates", label: "Max candidatos", type: "number", editable: true },
    { key: "video_upload", label: "Video upload", type: "boolean", editable: true },
    { key: "priority_support", label: "Soporte prioritario", type: "boolean", editable: true },
    { key: "highlighted_profile", label: "Perfil destacado", type: "boolean", editable: true },
    { key: "features", label: "Caracteristicas", type: "json", editable: true },
    { key: "stripe_price_id_monthly", label: "Stripe Price ID (mes)", editable: true },
    { key: "stripe_price_id_yearly", label: "Stripe Price ID (anual)", editable: true },
    { key: "is_active", label: "Activo", type: "boolean", editable: true },
    { key: "sort_order", label: "Orden", type: "number", editable: true },
  ]

  // Section titles
  const sectionTitles: Record<AdminSection, string> = {
    dashboard: "Dashboard", candidates: "Candidatos", businesses: "Empresas",
    jobs: "Ofertas de Empleo", flash: "Ofertas Flash",
    applications: "Candidaturas", interviews: "Solicitudes de Entrevista", categories: "Empleos",
    ratings: "Reseñas", messages: "Mensajes",
    notifications: "Notificaciones",
    plans: "Planes de Suscripción", subscriptions: "Suscripciones Activas",
    countries: "Países", cities: "Ciudades", languages: "Idiomas",
    "payment-methods": "Métodos de Pago", "job-payments": "Pagos de Ofertas", micropayments: "Micropagos (Destacar / Flash)", "points-ledger": "Puntos y Referidos", apis: "APIs e Integraciones", settings: "Configuración",
  }

  const showSearch = !["dashboard", "settings", "apis", "notifications", "job-payments"].includes(section)

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="relative w-72 h-full z-10">
            <AdminSidebar active={section} onSelect={setSection} onLogout={handleLogout} stats={stats} mobile onCloseMobile={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:flex h-full">
        <AdminSidebar active={section} onSelect={setSection} onLogout={handleLogout} stats={stats} />
      </div>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b px-4 lg:px-6 py-3 flex items-center gap-3 shrink-0 pt-[env(safe-area-inset-top,0px)]">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden p-1.5 rounded-md hover:bg-slate-100"><Menu className="h-5 w-5" /></button>
          <h1 className="text-lg font-bold text-slate-800">{sectionTitles[section]}</h1>
          <div className="flex-1" />
          {showSearch && (
            <div className="relative hidden sm:block">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="pl-8 h-8 w-56 text-xs" />
              {search && <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2"><X className="h-3 w-3 text-slate-400" /></button>}
            </div>
          )}
          <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 hidden sm:flex">Live Data</Badge>
          <Button asChild variant="ghost" size="sm" className="text-xs hidden md:flex"><Link href="/">Ir al Frontend</Link></Button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-6">

          {/* ========== DASHBOARD ========== */}
          {section === "dashboard" && (
            <AdminDashboard stats={stats} onNavigate={setSection} />
          )}

          {/* ========== CANDIDATES ========== */}
          {section === "candidates" && (
            <>
              <AdminCrudTable
                title="Candidatos"
                icon={<Users className="h-5 w-5 text-[#01A89E]" />}
                data={candidates}
                columns={candidateColumns}
                endpoint="/api/admin/profiles"
                swrKey={candidatesKey!}
                search={search}
                onSearchChange={setSearch}
                searchPlaceholder="Buscar candidato..."
                emptyText="No se encontraron candidatos"
                createDefaults={{ user_type: "worker", display_name: "", email: "", password: "Temp1234!", is_active: true, is_premium: false, points: 0, level: 1 }}
                onPreview={(row) => setPreviewCandidate(row)}
              />
              <AdminCandidatePreview
                open={!!previewCandidate}
                onOpenChange={(open) => { if (!open) setPreviewCandidate(null) }}
                candidate={previewCandidate}
              />
            </>
          )}

          {/* ========== BUSINESSES ========== */}
          {section === "businesses" && (
            <AdminCrudTable
              title="Empresas"
              icon={<Building2 className="h-5 w-5 text-[#01A89E]" />}
              data={businesses}
              columns={businessColumns}
              endpoint="/api/admin/businesses"
              swrKey={businessesKey!}
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder="Buscar empresa..."
              emptyText="No se encontraron empresas"
              createDefaults={{ company_name: "", business_type: "", verified: false, is_premium: false, points: 0, level: 1 }}
            />
          )}

          {/* ========== JOBS ========== */}
          {section === "jobs" && (
            <AdminCrudTable
              title="Empleos"
              icon={<Briefcase className="h-5 w-5 text-emerald-600" />}
              data={regularJobs}
              columns={jobColumns}
              endpoint="/api/admin/jobs"
              swrKey={jobsKey!}
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder="Buscar empleo..."
              emptyText="No se encontraron empleos"
              createDefaults={{ title: "", is_flash: false, is_active: true, vacancies: 1, salary_min: 0, salary_max: 0 }}
            />
          )}

          {/* ========== FLASH ========== */}
          {section === "flash" && (
            <AdminCrudTable
              title="Ofertas Flash"
              icon={<Zap className="h-5 w-5 text-orange-600" />}
              data={flashJobs}
              columns={flashColumns}
              endpoint="/api/admin/jobs"
              swrKey={flashKey!}
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder="Buscar oferta flash..."
              emptyText="No se encontraron ofertas flash"
              createDefaults={{ title: "", is_flash: true, is_active: true, vacancies: 1, salary_min: 0, salary_max: 0 }}
            />
          )}

          {/* ========== CATEGORIES ========== */}
          {section === "categories" && (
            <AdminCategories categories={categories} swrKey={catsKey!} />
          )}

          {/* ========== RATINGS ========== */}
          {section === "ratings" && (
            <div className="space-y-2">
              <p className="text-xs text-slate-500">{ratings.length} reseñas</p>
              {ratings.map((r: any) => (
                <Card key={r.id} className="bg-white"><CardContent className="p-3"><div className="flex items-start gap-3">
                  <Avatar className="h-9 w-9 shrink-0"><AvatarImage src={r.rater?.avatar_url} /><AvatarFallback className="bg-yellow-100 text-yellow-700 text-xs">{(r.rater?.display_name||"?")[0]}</AvatarFallback></Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm font-medium">{r.rater?.display_name || "Anónimo"}</p>
                      <span className="text-[10px] text-slate-400">{">"}</span>
                      <p className="text-sm font-medium text-[#01A89E]">{r.rated?.display_name || "Usuario"}</p>
                    </div>
                    <div className="flex items-center gap-0.5 mt-0.5">
                      {/* La columna es `score`; leer `r.rating` daba NaN y
                          estrellas vacías en todas las reseñas. */}
                      {Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-3 w-3 ${i < Math.round(Number(r.score) || 0) ? "fill-yellow-400 text-yellow-400" : "text-slate-300"}`} />)}
                      <span className="text-xs ml-1">{Number(r.score || 0).toFixed(1)}</span>
                    </div>
                    {r.comment && <p className="text-xs text-slate-600 mt-1 bg-slate-50 rounded p-1.5 line-clamp-2">{r.comment}</p>}
                    {(() => {
                      const raw = typeof r.criteria === "string" ? (() => { try { return JSON.parse(r.criteria) } catch { return null } })() : r.criteria
                      if (!raw || typeof raw !== "object") return null
                      const rows = RATING_CRITERIA
                        .map((c) => ({ label: c.label, value: readCriterion(raw, c) }))
                        .filter((x) => typeof x.value === "number")
                      if (rows.length === 0) return null
                      return (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {rows.map((x) => (
                            <span key={x.label} className="flex items-center gap-0.5 rounded-full bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-600">
                              {x.label}
                              <b className="text-slate-900">{x.value!.toFixed(1)}</b>
                              <Star className="h-2 w-2 fill-yellow-400 text-yellow-400" />
                            </span>
                          ))}
                        </div>
                      )
                    })()}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditDialog({ open: true, type: "rating", item: { ...r } })}><Pencil className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteDialog({ open: true, type: "reseña", item: r, endpoint: "/api/admin/ratings" })}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </div></CardContent></Card>
              ))}
            </div>
          )}

          {/* ========== INTERVIEWS ========== */}
          {/* ========== CANDIDATURAS ========== */}
          {section === "applications" && (
            <div className="space-y-2">
              <p className="text-xs text-slate-500">
                {applications.length} candidaturas · incluye las canceladas por el candidato ("Ya no me interesa")
              </p>
              {applications.length === 0 && (
                <Card className="bg-white"><CardContent className="p-8 text-center text-sm text-slate-500">
                  Todavía no hay candidaturas.
                </CardContent></Card>
              )}
              {applications.map((a: any) => {
                const statusStyle: Record<string, string> = {
                  pending: "bg-amber-50 text-amber-700",
                  interview: "bg-blue-50 text-blue-700",
                  accepted: "bg-emerald-50 text-emerald-700",
                  rejected: "bg-red-50 text-red-700",
                  withdrawn: "bg-orange-50 text-orange-700",
                }
                const statusLabel: Record<string, string> = {
                  pending: "Pendiente", interview: "En entrevista", accepted: "Contratado",
                  rejected: "Rechazada", withdrawn: "Cancelada",
                }
                return (
                  <Card key={a.id} className="bg-white"><CardContent className="p-3"><div className="flex items-start gap-3">
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarImage src={a.profiles?.avatar_url} />
                      <AvatarFallback className="bg-teal-100 text-teal-700 text-xs">{(a.profiles?.display_name || "?")[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-sm font-medium">{a.profiles?.display_name || "Candidato"}</p>
                        <span className="text-[10px] text-slate-400">{"->"}</span>
                        <p className="text-sm font-medium text-[#01A89E] truncate">{a.jobs?.title || "Oferta eliminada"}</p>
                        <Badge className={`text-[9px] px-1.5 py-0 border-0 ${statusStyle[a.status] || "bg-slate-50 text-slate-600"}`}>
                          {statusLabel[a.status] || a.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Creada {new Date(a.created_at).toLocaleString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        {a.updated_at && a.updated_at !== a.created_at && (
                          <> · actualizada {new Date(a.updated_at).toLocaleString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</>
                        )}
                      </p>
                      {a.cover_letter && <p className="text-xs text-slate-600 mt-1 bg-slate-50 rounded p-1.5 line-clamp-2">{a.cover_letter}</p>}
                    </div>
                    <Button
                      variant="ghost" size="icon" className="h-7 w-7 text-destructive shrink-0"
                      onClick={() => setDeleteDialog({ open: true, type: "candidatura", item: a, endpoint: "/api/admin/applications" })}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div></CardContent></Card>
                )
              })}
            </div>
          )}

          {section === "interviews" && (
            <div className="space-y-2">
              <p className="text-xs text-slate-500">{interviews.length} solicitudes de entrevista</p>
              {interviews.map((i: any) => {
                const statusStyle: Record<string, string> = {
                  pending: "bg-amber-50 text-amber-700",
                  confirmed: "bg-blue-50 text-blue-700",
                  approved: "bg-emerald-50 text-emerald-700",
                  not_hired: "bg-slate-100 text-slate-600",
                  cancelled: "bg-red-50 text-red-700",
                }
                const statusLabel: Record<string, string> = {
                  pending: "Pendiente", confirmed: "Confirmada", approved: "Contratado",
                  // Se hizo la entrevista y no hubo contratación: distinto de
                  // cancelada, que nunca llegó a celebrarse.
                  not_hired: "Sin contratación", cancelled: "Cancelada",
                }
                const typeLabel: Record<string, string> = {
                  call: "Llamada", in_person: "Presencial", video_call: "Videoconferencia", other: "Otra",
                }
                return (
                  <Card key={i.id} className="bg-white"><CardContent className="p-3"><div className="flex items-start gap-3">
                    <Avatar className="h-9 w-9 shrink-0"><AvatarImage src={i.worker?.avatar_url} /><AvatarFallback className="bg-teal-100 text-teal-700 text-xs">{(i.worker?.display_name || "?")[0]}</AvatarFallback></Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-sm font-medium">{i.worker?.display_name || "Candidato"}</p>
                        <span className="text-[10px] text-slate-400">{"<-"}</span>
                        <p className="text-sm font-medium text-[#01A89E]">{i.business?.display_name || "Empresa"}</p>
                        <Badge className={`text-[9px] px-1.5 py-0 border-0 ${statusStyle[i.status] || "bg-slate-50 text-slate-600"}`}>{statusLabel[i.status] || i.status}</Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {new Date(i.scheduled_at).toLocaleString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} · {typeLabel[i.interview_type] || i.interview_type}
                      </p>
                      {i.rescheduled_count > 0 && (
                        <p className="text-[11px] text-amber-700 mt-0.5">
                          Reprogramada {i.rescheduled_count} {i.rescheduled_count === 1 ? "vez" : "veces"}
                          {i.reschedule_reason ? ` · ${i.reschedule_reason}` : ""}
                        </p>
                      )}
                      {i.status === "cancelled" && i.cancellation_reason && (
                        <p className="text-[11px] text-red-700 mt-0.5">Motivo: {i.cancellation_reason}</p>
                      )}
                      {i.notes && <p className="text-xs text-slate-600 mt-1 bg-slate-50 rounded p-1.5 line-clamp-2">{i.notes}</p>}
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive shrink-0" onClick={() => setDeleteDialog({ open: true, type: "entrevista", item: i, endpoint: "/api/admin/interviews" })}><Trash2 className="h-3 w-3" /></Button>
                  </div></CardContent></Card>
                )
              })}
            </div>
          )}

          {/* ========== MESSAGES ========== */}
          {section === "messages" && (
            <div className="space-y-2">
              <p className="text-xs text-slate-500">{conversations.length} conversaciones</p>
              {conversations.map((c: any) => (
                <Card key={c.id} className="bg-white"><CardContent className="p-3"><div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0"><MessageCircle className="h-4 w-4 text-indigo-600" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{c.p1?.display_name || "?"} - {c.p2?.display_name || "?"}</p>
                    <p className="text-xs text-slate-500 truncate">{c.last_message || "Sin mensajes"}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteDialog({ open: true, type: "conversacion", item: c, endpoint: "/api/admin/messages" })}><Trash2 className="h-3 w-3" /></Button>
                </div></CardContent></Card>
              ))}
            </div>
          )}

          {/* ========== NOTIFICATIONS ========== */}
          {section === "notifications" && (
            <div className="space-y-4">
              <Card className="bg-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Bell className="h-4 w-4 text-[#F5A623]" /> Enviar notificación
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs">Título</Label>
                    <Input value={notifForm.title} onChange={(e) => setNotifForm({ ...notifForm, title: e.target.value })} placeholder="Ej: Nueva oferta disponible" />
                  </div>
                  <div>
                    <Label className="text-xs">Mensaje</Label>
                    <Textarea value={notifForm.body} onChange={(e) => setNotifForm({ ...notifForm, body: e.target.value })} placeholder="Escribe el contenido de la notificación..." rows={3} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Tipo</Label>
                      <select
                        className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                        value={notifForm.type}
                        onChange={(e) => setNotifForm({ ...notifForm, type: e.target.value })}
                      >
                        <option value="aviso">Aviso / Notificación</option>
                        <option value="oferta">Oferta</option>
                        <option value="otro">Otro</option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs">Destinatarios</Label>
                      <select
                        className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                        value={notifForm.target_scope}
                        onChange={(e) => {
                          setNotifForm({ ...notifForm, target_scope: e.target.value })
                          setNotifSelectedTarget(null)
                          setNotifTargetSearch("")
                          setNotifTargetResults([])
                        }}
                      >
                        <option value="all">Todos los usuarios</option>
                        <option value="candidates">Todos los candidatos</option>
                        <option value="businesses">Todas las empresas</option>
                        <option value="user">Un usuario concreto</option>
                      </select>
                    </div>
                  </div>

                  {notifForm.target_scope === "user" && (
                    <div className="relative">
                      <Label className="text-xs">Buscar candidato o empresa</Label>
                      {notifSelectedTarget ? (
                        <div className="flex items-center justify-between mt-1 px-3 py-2 rounded-md border bg-slate-50">
                          <span className="text-sm">{notifSelectedTarget.display_name} <span className="text-[10px] text-slate-400">({notifSelectedTarget.user_type === "business" ? "Empresa" : "Candidato"})</span></span>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setNotifSelectedTarget(null); setNotifTargetSearch("") }}><X className="h-3 w-3" /></Button>
                        </div>
                      ) : (
                        <>
                          <Input value={notifTargetSearch} onChange={(e) => setNotifTargetSearch(e.target.value)} placeholder="Escribe un nombre..." />
                          {notifTargetResults.length > 0 && (
                            <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">
                              {notifTargetResults.map((p: any) => (
                                <button
                                  key={p.id}
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center justify-between"
                                  onClick={() => { setNotifSelectedTarget(p); setNotifTargetResults([]) }}
                                >
                                  <span>{p.display_name}</span>
                                  <span className="text-[10px] text-slate-400">{p.user_type === "business" ? "Empresa" : "Candidato"}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  <div>
                    <Label className="text-xs">Enlace (opcional)</Label>
                    <Input value={notifForm.link} onChange={(e) => setNotifForm({ ...notifForm, link: e.target.value })} placeholder="/flash-offers, /jobs/..., etc." />
                  </div>

                  {notifError && <p className="text-xs text-destructive">{notifError}</p>}

                  <Button onClick={handleSendNotification} disabled={notifSending} className="bg-[#F5A623] hover:bg-[#E09612] text-white">
                    {notifSending ? "Enviando..." : "Enviar notificación"}
                  </Button>
                </CardContent>
              </Card>

              <div>
                <p className="text-xs text-slate-500 mb-2">{sentNotifications.length} notificaciones enviadas</p>
                <div className="space-y-2">
                  {sentNotifications.map((n: any) => (
                    <Card key={n.id} className="bg-white"><CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        <div className="h-9 w-9 rounded-lg bg-amber-100 flex items-center justify-center shrink-0"><Bell className="h-4 w-4 text-amber-600" /></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold">{n.title}</p>
                            <Badge className="text-[9px] px-1.5 py-0 bg-slate-100 text-slate-600 border-0 capitalize">{n.type}</Badge>
                            <Badge className="text-[9px] px-1.5 py-0 bg-indigo-50 text-indigo-700 border-0">
                              {n.target_scope === "all" && "Todos"}
                              {n.target_scope === "candidates" && "Candidatos"}
                              {n.target_scope === "businesses" && "Empresas"}
                              {n.target_scope === "user" && (n.target_user?.display_name || "Usuario")}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{n.body}</p>
                          <p className="text-[10px] text-slate-400 mt-1">{new Date(n.created_at).toLocaleString("es-ES")}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive shrink-0" onClick={() => handleDeleteNotification(n.id)}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </CardContent></Card>
                  ))}
                  {sentNotifications.length === 0 && <p className="text-xs text-slate-400 text-center py-8">No se han enviado notificaciones todavía</p>}
                </div>
              </div>
            </div>
          )}

          {/* ========== PLANS ========== */}
          {section === "plans" && (
            <AdminCrudTable title="Planes de Suscripcion" icon={<Crown className="h-5 w-5 text-[#F5A623]" />} data={plans} columns={planColumns} endpoint="/api/admin/plans" swrKey={plansKey!} emptyText="No hay planes" createDefaults={{ slug: "", name: "", price_monthly: 0, currency: "EUR", is_active: true }} />
          )}

          {/* ========== COUNTRIES ========== */}
          {section === "countries" && (
            <AdminCrudTable title="Paises" icon={<Globe className="h-5 w-5 text-indigo-600" />} data={countries} columns={countryColumns} endpoint="/api/admin/countries" swrKey={countriesKey!} search={search} onSearchChange={setSearch} searchPlaceholder="Buscar pais..." emptyText="No hay paises" createDefaults={{ code: "", name: "", currency: "EUR", is_active: true }} />
          )}

          {/* ========== CITIES / PROVINCES ========== */}
          {section === "cities" && (
            <AdminCities />
          )}

          {/* ========== LANGUAGES ========== */}
          {section === "languages" && (
            <AdminCrudTable title="Idiomas" icon={<Languages className="h-5 w-5 text-teal-600" />} data={languages} columns={langColumns} endpoint="/api/admin/languages" swrKey={langsKey!} search={search} onSearchChange={setSearch} searchPlaceholder="Buscar idioma..." emptyText="No hay idiomas" createDefaults={{ code: "", name: "", native_name: "", is_active: true }} />
          )}

          {/* ========== PAYMENT METHODS ========== */}
          {section === "payment-methods" && (
            <AdminCrudTable title="Metodos de Pago" icon={<CreditCard className="h-5 w-5 text-green-600" />} data={paymentMethods} columns={pmColumns} endpoint="/api/admin/payment-methods" swrKey={pmKey!} emptyText="No hay metodos de pago" createDefaults={{ provider: "", display_name: "", is_active: true, config: {} }} />
          )}

          {/* ========== JOB PAYMENTS (Flash / Destacar ledger) ========== */}
          {section === "job-payments" && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                Registro de cobros de Ofertas Flash (5€) y Destacar Oferta (2,5€). Solo lectura — se activan
                automáticamente vía el webhook de Stripe; usa "Reactivar" si un pago se quedó pendiente porque el
                webhook nunca llegó.
              </p>
              {jobPayments.length === 0 ? (
                <Card className="bg-white"><CardContent className="p-8 text-center text-sm text-slate-500">No hay pagos de ofertas todavía</CardContent></Card>
              ) : (
                <div className="space-y-2">
                  {jobPayments.map((mp: any) => (
                    <Card key={mp.id} className="bg-white">
                      <CardContent className="p-4 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold truncate">{mp.job_title || "Oferta eliminada"}</p>
                            <Badge className="text-[9px] px-1.5 py-0 border-0 bg-slate-100 text-slate-600">
                              {mp.feature_type === "flash_job" ? "Flash" : "Destacar"}
                            </Badge>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {mp.business_name || "Negocio desconocido"} · {new Date(mp.created_at).toLocaleString("es-ES")}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="text-sm font-semibold tabular-nums">{(mp.amount_cents / 100).toFixed(2)}€</span>
                          <Badge
                            className={`text-[9px] px-2 py-0.5 border-0 capitalize ${
                              mp.status === "completed"
                                ? "bg-emerald-50 text-emerald-700"
                                : mp.status === "failed"
                                  ? "bg-red-50 text-red-700"
                                  : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {mp.status}
                          </Badge>
                          {mp.status === "pending" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-[10px] h-7"
                              disabled={reactivatingId === mp.id}
                              onClick={() => handleReactivateJobPayment(mp.id)}
                            >
                              {reactivatingId === mp.id ? "Reactivando..." : "Reactivar"}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========== POINTS LEDGER + REFERRALS ========== */}
          {section === "points-ledger" && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                Log de puntos (motor de gamificación) y referidos completados: <strong>{completedReferrals}</strong> amigos
                registrados han completado su perfil gracias a un código de invitación.
              </p>
              {pointsLedger.length === 0 ? (
                <Card className="bg-white"><CardContent className="p-8 text-center text-sm text-slate-500">Sin movimientos de puntos todavía</CardContent></Card>
              ) : (
                <div className="space-y-1.5">
                  {pointsLedger.map((entry: any) => (
                    <Card key={entry.id} className="bg-white">
                      <CardContent className="p-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{entry.user_display_name}</p>
                          <p className="text-[10px] text-slate-500">
                            {entry.reason} · {new Date(entry.created_at).toLocaleString("es-ES")}
                          </p>
                        </div>
                        <span className={`text-sm font-bold tabular-nums flex-shrink-0 ${entry.points >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                          {entry.points >= 0 ? "+" : ""}{entry.points}
                        </span>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========== SUSCRIPCIONES ACTIVAS ========== */}
          {section === "subscriptions" && (
            <div className="space-y-3">
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: "Total", value: subsData?.summary?.total ?? 0, color: "text-slate-900" },
                  { label: "Activas", value: subsData?.summary?.activas ?? 0, color: "text-emerald-600" },
                  { label: "Por caducar", value: subsData?.summary?.porCaducar ?? 0, color: "text-amber-600" },
                  { label: "Caducadas", value: subsData?.summary?.caducadas ?? 0, color: "text-red-600" },
                ].map((s) => (
                  <Card key={s.label} className="bg-white"><CardContent className="p-3 text-center">
                    <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-[10px] text-slate-500">{s.label}</p>
                  </CardContent></Card>
                ))}
              </div>

              {(subsData?.data || []).length === 0 && (
                <Card className="bg-white"><CardContent className="p-8 text-center text-sm text-slate-500">
                  Todavía no hay nadie suscrito.
                </CardContent></Card>
              )}

              {(subsData?.data || []).map((s: any) => {
                const stateStyle: Record<string, string> = {
                  activa: "bg-emerald-50 text-emerald-700",
                  por_caducar: "bg-amber-50 text-amber-700",
                  caducada: "bg-red-50 text-red-700",
                  sin_caducidad: "bg-slate-100 text-slate-600",
                }
                const stateLabel: Record<string, string> = {
                  activa: "Activa", por_caducar: "Por caducar",
                  caducada: "Caducada", sin_caducidad: "Sin caducidad",
                }
                const planLabel: Record<string, string> = {
                  "standard-business": "Standard (empresa)",
                  "premium-business": "Premium (empresa)",
                  "premium-worker": "Premium (candidato)",
                }
                return (
                  <Card key={`${s.kind}-${s.id}`} className="bg-white"><CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarImage src={s.avatar_url || undefined} />
                        <AvatarFallback className={s.kind === "business" ? "bg-orange-100 text-orange-700 text-xs" : "bg-teal-100 text-teal-700 text-xs"}>
                          {(s.name || "?")[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-sm font-medium truncate">{s.name}</p>
                          <Badge className="text-[9px] px-1.5 py-0 border-0 bg-slate-100 text-slate-600">
                            {s.kind === "business" ? "Empresa" : "Candidato"}
                          </Badge>
                          <Badge className={`text-[9px] px-1.5 py-0 border-0 ${stateStyle[s.state] || ""}`}>
                            {stateLabel[s.state] || s.state}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {planLabel[s.plan] || s.plan || "—"}
                          {s.expires_at && (
                            <>
                              {" · hasta "}
                              {new Date(s.expires_at).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                              {typeof s.daysLeft === "number" && (
                                <> ({s.daysLeft > 0 ? `quedan ${s.daysLeft} d` : `caducó hace ${Math.abs(s.daysLeft)} d`})</>
                              )}
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  </CardContent></Card>
                )
              })}
            </div>
          )}

          {/* ========== MICROPAGOS ========== */}
          {section === "micropayments" && (
            <div className="space-y-2">
              <p className="text-xs text-slate-500">
                Compras puntuales de Destacar oferta, Oferta Flash y funciones premium. Se marcan
                como completadas desde el webhook de Stripe, nunca desde el navegador.
              </p>
              {(micropaymentsData?.data || []).length === 0 && (
                <Card className="bg-white"><CardContent className="p-8 text-center text-sm text-slate-500">
                  Todavía no hay micropagos.
                </CardContent></Card>
              )}
              {(micropaymentsData?.data || []).map((m: any) => {
                const statusStyle: Record<string, string> = {
                  completed: "bg-emerald-50 text-emerald-700",
                  pending: "bg-amber-50 text-amber-700",
                  failed: "bg-red-50 text-red-700",
                  cancelled: "bg-slate-100 text-slate-600",
                }
                const featureLabel: Record<string, string> = {
                  highlight_job: "Destacar oferta (24h)",
                  flash_job: "Oferta Flash",
                  highlight_profile: "Destacar perfil (7 días)",
                  view_matches: "Ver empresas interesadas",
                  boost_visibility: "Impulsar visibilidad",
                }
                return (
                  <Card key={m.id} className="bg-white"><CardContent className="p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-sm font-medium">
                            {featureLabel[m.feature_type] || m.feature_type}
                          </p>
                          <Badge className={`text-[9px] px-1.5 py-0 border-0 ${statusStyle[m.status] || "bg-slate-50 text-slate-600"}`}>
                            {m.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {m.profiles?.display_name || m.user_id?.slice(0, 8) || "—"}
                          {m.created_at && ` · ${new Date(m.created_at).toLocaleString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold">
                          {typeof m.amount === "number" ? (m.amount / 100).toFixed(2) + " €" : "—"}
                        </p>
                      </div>
                    </div>
                  </CardContent></Card>
                )
              })}
            </div>
          )}

          {/* ========== APIS ========== */}
          {section === "apis" && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">
                Estado real, leído de la configuración del servidor. Antes esta lista estaba
                escrita a mano y no se correspondía con la realidad.
              </p>

              {integrationsData?.stripeMode === "pruebas" && (
                <Card className="bg-amber-50 border-amber-200"><CardContent className="p-3">
                  <p className="text-xs font-medium text-amber-800">
                    Stripe está en modo PRUEBAS: se puede probar el flujo completo con tarjetas
                    de test, pero no se cobra dinero real.
                  </p>
                </CardContent></Card>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(integrationsData?.data || []).map((api: any) => {
                  const color =
                    api.status === "conectado" ? "bg-emerald-50 text-emerald-700"
                    : api.status === "incompleto" ? "bg-amber-50 text-amber-700"
                    : "bg-red-50 text-red-700"
                  return (
                    <Card key={api.key} className="bg-white"><CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold">{api.name}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{api.desc}</p>
                        </div>
                        <Badge className={`text-[9px] px-2 py-0.5 border-0 capitalize shrink-0 ${color}`}>
                          {api.status}
                        </Badge>
                      </div>
                      {api.missing?.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {api.missing.map((key: string) => (
                            <div key={key} className="flex items-center gap-1.5">
                              <XCircle className="h-3 w-3 text-red-500 shrink-0" />
                              <code className="text-[10px] font-mono text-slate-600">{key}</code>
                              <span className="text-[10px] text-slate-400">sin valor</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {api.configUrl && (
                        <div className="mt-3 pt-3 border-t">
                          <a href={api.configUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[10px] text-[#01A89E] hover:underline">
                            <Settings className="h-3 w-3" /> Configurar en panel externo
                            <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        </div>
                      )}
                    </CardContent></Card>
                  )
                })}
              </div>
            </div>
          )}

          {/* ========== SETTINGS ========== */}
          {section === "settings" && <AdminSettingsSection />}

        </div>
      </main>

      {/* Dialogs are now handled by AdminCrudTable and AdminCategories components */}
    </div>
  )
}
