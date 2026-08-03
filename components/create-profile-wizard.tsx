"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { LegalTermsDialog } from "@/components/legal-terms-dialog"
import {
  User, Briefcase, Languages, Calendar, Camera, CheckCircle2,
  ChevronRight, ChevronLeft, Upload, Building2, Lock, Loader2,
  Eye, EyeOff, CreditCard,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { AddressAutofill } from "@/components/address-autofill"
import { PhoneVerification } from "@/components/phone-verification"
import Image from "next/image"

// ─── Types ───────────────────────────────────────────────────────────────────
type UserType = "worker" | "business"

type Category = { id: string; name: string; slug: string; icon: string; role_type: string }
type Subcategory = { id: string; name: string; category_id: string }
type SelectedCategory = { categoryId: string; categoryName: string; subcategoryIds: string[]; subcategoryNames: string[] }

// ─── Constants ────────────────────────────────────────────────────────────────
const languagesOptions = [
  { name: "Español", levels: ["Nativo", "Avanzado", "Intermedio", "Básico"] },
  { name: "Inglés", levels: ["Nativo", "Avanzado", "Intermedio", "Básico"] },
]

const availabilityOptions = ["Inmediata", "En 2 semanas", "En 1 mes", "A convenir"]

// ─── Steps definition ────────────────────────────────────────────────────────
// WORKER:   1.Tipo → 2.Credenciales → 3.Info personal → 4.Categoría → 5.Idiomas → 6.Disponibilidad → 7.Multimedia → 8.Revisión
// BUSINESS: 1.Tipo → 2.Credenciales → 3.Info empresa  → 4.Idiomas   → 5.Multimedia → 6.Revisión

const WORKER_STEPS = [1, 2, 3, 4, 5, 6, 7, 8]
const BUSINESS_STEPS = [1, 2, 3, 4, 5, 6]

const slideVariants = {
  enter: (d: number) => ({ x: d > 0 ? "100%" : "-100%", opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d > 0 ? "-100%" : "100%", opacity: 0 }),
}

// ─── Component ────────────────────────────────────────────────────────────────
export function CreateProfileWizard() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [showLegalTerms, setShowLegalTerms] = useState(false)
  const [legalAccepted, setLegalAccepted] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showRepeatPassword, setShowRepeatPassword] = useState(false)

  // Existing user (already logged in, completing profile)
  const [existingUserId, setExistingUserId] = useState<string | null>(null)
  const [existingUserType, setExistingUserType] = useState<UserType | null>(null)
  const [isLoadingUser, setIsLoadingUser] = useState(true)

  // Categories
  const [dbCategories, setDbCategories] = useState<Category[]>([])
  const [dbSubcategories, setDbSubcategories] = useState<Subcategory[]>([])
  const [filteredSubcategories, setFilteredSubcategories] = useState<Subcategory[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)

  // Form data
  const [form, setForm] = useState({
    userType: "worker" as UserType,
    email: "",
    password: "",
    repeatPassword: "",
    // Worker
    fullName: "",
    phone: "",
    location: "",
    category: "",
    categoryId: "",
    subcategory: "",
    subcategoryId: "",
    customSubcategory: "",
    selectedCategories: [] as SelectedCategory[],
    phoneVerified: false,
    experience: "",
    availability: "",
    languages: [{ name: "Español", level: "Nativo" }] as { name: string; level: string }[],
    profilePhoto: null as File | null,
    videoFile: null as File | null,
    videoFile2: null as File | null,
    videoFile3: null as File | null,
    galleryImages: [] as File[],
    // Business
    companyName: "",
    businessType: "",
    website: "",
    companyDescription: "",
  })

  const update = (field: string, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const isWorker = existingUserType ? existingUserType === "worker" : form.userType === "worker"
  const steps = isWorker ? WORKER_STEPS : BUSINESS_STEPS
  const totalSteps = steps.length

  // ─── Check existing user ────────────────────────────────────────────────────
  useEffect(() => {
    const check = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const user = session?.user
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("user_type, profile_completed")
            .eq("id", user.id)
            .single()

          if (profile?.profile_completed) {
            window.location.href = profile.user_type === "business" ? "/business-dashboard" : "/dashboard"
            return
          }

          setExistingUserId(user.id)
          if (profile?.user_type) setExistingUserType(profile.user_type as UserType)
          // Skip type + credentials steps
          setStep(3)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setIsLoadingUser(false)
      }
    }
    const t = setTimeout(() => setIsLoadingUser(false), 5000)
    check()
    return () => clearTimeout(t)
  }, [supabase])

  // ─── Load categories ─────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/categories")
        const json = await res.json()
        const cats = json.data || []
        setDbCategories(cats.map((c: Category) => ({ id: c.id, name: c.name, slug: c.slug, icon: c.icon, role_type: c.role_type || "candidate" })))
        setDbSubcategories(cats.flatMap((c: Category & { subcategories?: Subcategory[] }) =>
          (c.subcategories || []).map((s) => ({ ...s, category_id: c.id }))
        ))
      } catch (e) {
        console.error(e)
      } finally {
        setCategoriesLoading(false)
      }
    }
    load()
  }, [])

  // ─── Step titles ──────────────────────────────────────────────────────────────
  const getStepTitle = () => {
    if (isWorker) {
      const titles = ["Tipo de Cuenta", "Tus Credenciales", "Información Personal", "Categoría y Experiencia", "Idiomas", "Disponibilidad", "Fotos y Vídeo", "Revisión Final"]
      return titles[step - 1] || ""
    } else {
      const titles = ["Tipo de Cuenta", "Tus Credenciales", "Datos de la Empresa", "Idiomas", "Logo de Empresa", "Revisión y Pago"]
      return titles[step - 1] || ""
    }
  }

  const getStepDescription = () => {
    if (isWorker) {
      const descs = [
        "¿Eres candidato o empresa?",
        "Crea tu acceso a CamareroPorFavor",
        "Cuéntanos quién eres",
        "¿En qué área trabajas?",
        "¿Qué idiomas hablas?",
        "¿Cuándo puedes empezar?",
        "Añade tu foto y vídeos",
        "Revisa antes de publicar",
      ]
      return descs[step - 1] || ""
    } else {
      const descs = [
        "¿Eres candidato o empresa?",
        "Crea tu acceso a CamareroPorFavor",
        "Datos de tu empresa",
        "Idiomas de atención",
        "El logo de tu empresa",
        "Selecciona tu plan y paga",
      ]
      return descs[step - 1] || ""
    }
  }

  // ─── Validation ───────────────────────────────────────────────────────────────
  const validate = (): string | null => {
    if (step === 1) return null
    if (step === 2 && !existingUserId) {
      if (!form.email || !form.email.includes("@")) return "Introduce un email válido"
      if (!form.password || form.password.length < 6) return "La contraseña debe tener al menos 6 caracteres"
      if (form.password !== form.repeatPassword) return "Las contraseñas no coinciden"
    }
    if (step === 3) {
      if (isWorker) {
        if (!form.fullName.trim()) return "El nombre es obligatorio"
        if (!form.phone.trim()) return "El teléfono es obligatorio"
        if (!form.phoneVerified) return "Verifica tu teléfono por SMS para continuar"
        if (!form.location.trim()) return "La ubicación es obligatoria"
      } else {
        if (!form.companyName.trim()) return "El nombre de empresa es obligatorio"
        if (!form.phone.trim()) return "El teléfono es obligatorio"
        if (!form.phoneVerified) return "Verifica tu teléfono por SMS para continuar"
        if (!form.location.trim()) return "La ciudad es obligatoria"
        if (!form.categoryId) return "Selecciona el tipo de negocio"
      }
    }
    if (step === 4 && isWorker) {
      if (form.selectedCategories.length === 0) return "Selecciona al menos una categoría profesional"
      if (!form.experience) return "Selecciona tus años de experiencia"
    }
    if (step === 5 && isWorker) {
      if (form.languages.length === 0) return "Selecciona al menos un idioma"
    }
    if (step === 4 && !isWorker) {
      if (form.languages.length === 0) return "Selecciona al menos un idioma"
    }
    if (step === 6 && isWorker) {
      if (!form.availability) return "Selecciona tu disponibilidad"
    }
    if (step === 7 && isWorker) {
      if (!form.profilePhoto) return "La foto de perfil es obligatoria"
      if (!form.videoFile) return "El vídeo principal es obligatorio"
    }
    if (step === 5 && !isWorker) {
      if (!form.profilePhoto) return "El logo de empresa es obligatorio"
    }
    return null
  }

  // ─── Navigation ───────────────────────────────────────────────────────────────
  const goNext = () => {
    const err = validate()
    if (err) { setValidationError(err); return }
    setValidationError(null)
    const isLast = step === totalSteps
    if (isLast) {
      handleSubmit()
      return
    }
    // Skip steps 1 and 2 for existing users
    let next = step + 1
    if (existingUserId && next <= 2) next = 3
    setDirection(1)
    setStep(next)
    window.scrollTo({ top: 0, behavior: "instant" })
  }

  const goPrev = () => {
    let prev = step - 1
    if (existingUserId && prev <= 2) prev = existingUserId ? 3 : 1
    if (prev < 1) return
    setDirection(-1)
    setStep(prev)
    window.scrollTo({ top: 0, behavior: "instant" })
  }

  const isLastStep = step === totalSteps

  // ─── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!legalAccepted) { setShowLegalTerms(true); return }
    await doSubmit()
  }

  const handleLegalAccept = () => {
    setLegalAccepted(true)
    setShowLegalTerms(false)
    doSubmit()
  }

  const doSubmit = async () => {
    setIsSubmitting(true)
    setSubmitError(null)

    let userId = existingUserId
    // Existing (already logged-in) users completing their profile have a
    // session by definition. New signups only get one if email confirmation
    // turns out not to be required - see below.
    let hasSession = !!existingUserId

    try {
      // 1. Create auth user if new
      if (!userId) {
        const appUrl = typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL || "https://camareroporfavor.com"
        // Deep link for mobile: use the app scheme for verified users
        const emailRedirectTo = `${appUrl}/auth/callback`

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            emailRedirectTo,
            data: {
              display_name: isWorker ? form.fullName : form.companyName,
              user_type: form.userType,
            },
          },
        })

        if (authError) {
          setSubmitError(authError.message.includes("already registered")
            ? "Este correo ya está registrado. Intenta iniciar sesión."
            : authError.message)
          setIsSubmitting(false)
          return
        }

        userId = authData.user?.id

        // Email confirmation is mandatory, so signUp() never returns a
        // session here - don't assume one exists. Try anyway (in case
        // confirmation is ever disabled) but don't rely on it succeeding.
        if (userId) {
          const { data: signInData } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
          hasSession = !!signInData?.session
        }
      }

      if (!userId) { setSubmitError("Error al crear la cuenta"); setIsSubmitting(false); return }

      // 2. Upload avatar via the service-role-backed API route (works even
      // without a session, since the user isn't confirmed/logged in yet).
      let avatarUrl: string | null = null
      if (form.profilePhoto) {
        try {
          const avatarForm = new FormData()
          avatarForm.append("file", form.profilePhoto)
          avatarForm.append("type", "avatar")
          avatarForm.append("userId", userId)
          const avatarRes = await fetch("/api/upload", { method: "POST", body: avatarForm })
          if (avatarRes.ok) {
            const avatarData = await avatarRes.json()
            avatarUrl = avatarData.url
          }
        } catch (e) {
          console.error("Error uploading avatar:", e)
        }
      }

      // 3. Create profile
      if (isWorker) {
        const expYears = form.experience === "10+" ? 10 : form.experience === "5-10" ? 7 : form.experience === "3-5" ? 4 : form.experience === "1-2" ? 1 : 0

        const res = await fetch("/api/profiles/create-worker", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            profileData: {
              id: userId,
              user_type: "worker",
              display_name: form.fullName,
              phone: form.phone,
              location: form.location,
              job_category: form.category,
              job_subcategory: form.subcategory,
              category_id: form.categoryId || null,
              subcategory_id: form.subcategoryId || null,
              custom_subcategory: form.customSubcategory || null,
              experience_years: expYears,
              specialties: form.selectedCategories.flatMap((s) =>
                s.subcategoryNames.length > 0
                  ? s.subcategoryNames.map((n) => `${s.categoryName} - ${n}`)
                  : [s.categoryName]
              ),
              languages: form.languages,
              availability_status: form.availability,
              avatar_url: avatarUrl,
              bio: `${form.subcategory || form.category} con ${form.experience} años de experiencia`,
              is_active: true,
              phone_verified: form.phoneVerified,
              profile_completed: true,
              rol: 2,
              updated_at: new Date().toISOString(),
            },
          }),
        })

        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          setSubmitError(err.error || "Error al crear el perfil")
          setIsSubmitting(false)
          return
        }

        // 4. Upload video to MUX if provided - needs a session (the /api/mux/upload
        // route authenticates the caller), which isn't available until the user
        // confirms their email. If we don't have one yet, skip and let them add
        // the video later from their profile once logged in.
        if (form.videoFile && userId && hasSession) {
          try {
            // Get MUX upload URL
            const muxRes = await fetch("/api/mux/upload", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ profileType: "worker" }),
            })
            if (muxRes.ok) {
              const muxData = await muxRes.json()
              // Upload video directly to MUX
              await fetch(muxData.uploadUrl, {
                method: "PUT",
                body: form.videoFile,
                headers: { "Content-Type": form.videoFile.type },
              })
            }
          } catch (e) {
            console.error("Error uploading video to MUX:", e)
            // Don't block profile creation if video upload fails
          }
        }
        // Worker: go to success page (needs email verification)
        const videoPending = form.videoFile && !hasSession
        router.push(videoPending ? "/auth/sign-up-success?video_pending=1" : "/auth/sign-up-success")

      } else {
        // Business profile
        const res = await fetch("/api/profiles/create-business", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            businessData: {
              id: userId,
              company_name: form.companyName,
              business_type: form.businessType,
              category_id: form.categoryId || null,
              subcategory_id: form.subcategoryId || null,
              custom_subcategory: form.customSubcategory || null,
              website: form.website || null,
              company_description: form.companyDescription || null,
              phone: form.phone,
              city: form.location,
              company_logo_url: avatarUrl,
              verified: false,
              phone_verified: form.phoneVerified,
              updated_at: new Date().toISOString(),
            },
            profileData: {
              id: userId,
              user_type: "business",
              display_name: form.companyName,
              phone: form.phone,
              location: form.location,
              avatar_url: avatarUrl,
              languages: form.languages,
              is_active: true,
              phone_verified: form.phoneVerified,
              profile_completed: true,
              rol: 3,
              updated_at: new Date().toISOString(),
            },
          }),
        })

        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          setSubmitError(err.error || "Error al crear el perfil de empresa")
          setIsSubmitting(false)
          return
        }

        // Business: redirect to subscription page to pay
        router.push("/subscribe?new=1")
      }

    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Error inesperado")
      setIsSubmitting(false)
    }
  }

  // ─── Loading ──────────────────────────────────────────────────────────────────
  if (isLoadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const currentStepIndex = steps.indexOf(step)
  const progress = ((currentStepIndex + 1) / totalSteps) * 100

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-teal-50 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b">
        <div className="container max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <Image src="/logo-cpf.png" alt="CamareroPorFavor" width={120} height={40} style={{ width: "120px", height: "auto" }} />
            <span className="text-sm text-muted-foreground font-medium">
              {existingUserId ? `Paso ${Math.max(1, step - 2)} de ${totalSteps - 2}` : `Paso ${step} de ${totalSteps}`}
            </span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      </div>

      {/* Step dots */}
      <div className="container max-w-2xl mx-auto px-4 pt-4 pb-2">
        <div className="flex justify-center gap-1.5">
          {steps.filter(s => !(existingUserId && s <= 2)).map((s) => (
            <div key={s} className={cn("h-1.5 rounded-full transition-all",
              s === step ? "w-6 bg-primary" : s < step ? "w-1.5 bg-primary/50" : "w-1.5 bg-muted-foreground/20"
            )} />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-2xl mx-auto px-4">
        <Card className="border-0 shadow-xl">
          <CardContent className="p-6 sm:p-8">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
              >
                {/* Step header */}
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold mb-1">{getStepTitle()}</h2>
                  <p className="text-sm text-muted-foreground">{getStepDescription()}</p>
                </div>

                {/* ── STEP 1: Tipo de cuenta ── */}
                {step === 1 && (
                  <RadioGroup value={form.userType} onValueChange={(v) => update("userType", v)} className="grid gap-4">
                    <div>
                      <RadioGroupItem value="worker" id="worker" className="peer sr-only" />
                      <Label htmlFor="worker" className="flex items-center gap-4 rounded-xl border-2 border-muted p-5 cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <span className="font-semibold block">Profesional / Candidato</span>
                          <span className="text-sm text-muted-foreground">Busco empleo</span>
                        </div>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="business" id="business" className="peer sr-only" />
                      <Label htmlFor="business" className="flex items-center gap-4 rounded-xl border-2 border-muted p-5 cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <span className="font-semibold block">Empresa / Establecimiento</span>
                          <span className="text-sm text-muted-foreground">Busco personal</span>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                )}

                {/* ── STEP 2: Credenciales ── */}
                {step === 2 && !existingUserId && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="email">Correo Electrónico *</Label>
                      <Input id="email" type="email" placeholder="tu@email.com" value={form.email} onChange={(e) => update("email", e.target.value)} className="mt-1.5" />
                    </div>
                    <div>
                      <Label htmlFor="password">Contraseña *</Label>
                      <div className="relative mt-1.5">
                        <Input id="password" type={showPassword ? "text" : "password"} placeholder="Mínimo 6 caracteres" value={form.password} onChange={(e) => update("password", e.target.value)} className="pr-10" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="repeatPassword">Repetir Contraseña *</Label>
                      <div className="relative mt-1.5">
                        <Input id="repeatPassword" type={showRepeatPassword ? "text" : "password"} value={form.repeatPassword} onChange={(e) => update("repeatPassword", e.target.value)} className="pr-10" />
                        <button type="button" onClick={() => setShowRepeatPassword(!showRepeatPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          {showRepeatPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {form.password && form.repeatPassword && form.password !== form.repeatPassword && (
                        <p className="text-sm text-destructive mt-1">Las contraseñas no coinciden</p>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Verificarás tu cuenta por SMS en el siguiente paso, con el número de teléfono que introduzcas.
                    </p>
                  </div>
                )}

                {/* ── STEP 3 WORKER: Info personal ── */}
                {step === 3 && isWorker && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="fullName">Nombre Completo *</Label>
                      <Input id="fullName" placeholder="Ej: Juan García López" value={form.fullName} onChange={(e) => update("fullName", e.target.value)} className="mt-1.5" />
                    </div>
                    <div>
                      <Label htmlFor="phone">Teléfono *</Label>
                      <Input id="phone" type="tel" placeholder="+34 600 000 000" value={form.phone} onChange={(e) => { update("phone", e.target.value); update("phoneVerified", false) }} className="mt-1.5" />
                      <div className="mt-2">
                        <PhoneVerification phone={form.phone} verified={form.phoneVerified} onVerified={() => update("phoneVerified", true)} />
                      </div>
                    </div>
                    <div>
                      <Label>Ubicación *</Label>
                      <AddressAutofill value={form.location} onChange={(v) => update("location", v)} placeholder="Ej: Madrid, España" className="mt-1.5" />
                    </div>
                  </div>
                )}

                {/* ── STEP 3 BUSINESS: Info empresa ── */}
                {step === 3 && !isWorker && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="companyName">Nombre de la Empresa *</Label>
                      <Input id="companyName" placeholder="Ej: Restaurante El Molino" value={form.companyName} onChange={(e) => update("companyName", e.target.value)} className="mt-1.5" />
                    </div>
                    <div>
                      <Label>Tipo de Negocio *</Label>
                      <Select value={form.categoryId} onValueChange={(v) => {
                        const cat = dbCategories.find(c => c.id === v)
                        update("categoryId", v)
                        update("businessType", cat?.name || "")
                        update("subcategoryId", "")
                        update("subcategory", "")
                        setFilteredSubcategories(dbSubcategories.filter(s => s.category_id === v))
                      }}>
                        <SelectTrigger className="mt-1.5"><SelectValue placeholder="Selecciona tipo" /></SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {dbCategories.filter((cat) => cat.role_type === "business").map((cat) => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    {form.categoryId && filteredSubcategories.length > 0 && (
                      <div>
                        <Label>Subcategoría</Label>
                        <Select value={form.subcategoryId} onValueChange={(v) => {
                          const sub = filteredSubcategories.find(s => s.id === v)
                          update("subcategoryId", v)
                          update("subcategory", sub?.name || "")
                        }}>
                          <SelectTrigger className="mt-1.5"><SelectValue placeholder="Selecciona subcategoría" /></SelectTrigger>
                          <SelectContent>
                            {filteredSubcategories.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div>
                      <Label htmlFor="bizPhone">Teléfono *</Label>
                      <Input id="bizPhone" type="tel" placeholder="+34 600 000 000" value={form.phone} onChange={(e) => { update("phone", e.target.value); update("phoneVerified", false) }} className="mt-1.5" />
                      <div className="mt-2">
                        <PhoneVerification phone={form.phone} verified={form.phoneVerified} onVerified={() => update("phoneVerified", true)} />
                      </div>
                    </div>
                    <div>
                      <Label>Ciudad *</Label>
                      <AddressAutofill value={form.location} onChange={(v) => update("location", v)} placeholder="Ej: Barcelona, España" className="mt-1.5" />
                    </div>
                    <div>
                      <Label htmlFor="website">Página Web</Label>
                      <Input id="website" placeholder="https://..." value={form.website} onChange={(e) => update("website", e.target.value)} className="mt-1.5" />
                    </div>
                    <div>
                      <Label htmlFor="desc">Descripción</Label>
                      <textarea id="desc" rows={3} className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="Describe brevemente tu negocio..." value={form.companyDescription} onChange={(e) => update("companyDescription", e.target.value)} />
                    </div>
                  </div>
                )}

                {/* ── STEP 4 WORKER: Categorías y experiencia ── */}
                {step === 4 && isWorker && (
                  <div className="space-y-5">
                    <div>
                      <Label className="text-base font-semibold">Categorías Profesionales *</Label>
                      <p className="text-xs text-muted-foreground mt-0.5">Puedes elegir varias si tienes varias habilidades (ej: Cortador de jamón y Camarero de barra)</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3 max-h-[260px] overflow-y-auto p-1">
                        {categoriesLoading ? (
                          <p className="col-span-3 text-center text-muted-foreground py-4">Cargando...</p>
                        ) : dbCategories.filter((cat) => cat.role_type === "candidate").map((cat) => {
                          const isSelected = form.selectedCategories.some((s) => s.categoryId === cat.id)
                          return (
                            <button key={cat.id} type="button" onClick={() => {
                              const next = isSelected
                                ? form.selectedCategories.filter((s) => s.categoryId !== cat.id)
                                : [...form.selectedCategories, { categoryId: cat.id, categoryName: cat.name, subcategoryIds: [], subcategoryNames: [] }]
                              update("selectedCategories", next)
                              // Keep the primary category/subcategory fields in sync with the first selection
                              update("category", next[0]?.categoryName || "")
                              update("categoryId", next[0]?.categoryId || "")
                              update("subcategory", next[0]?.subcategoryNames[0] || "")
                              update("subcategoryId", next[0]?.subcategoryIds[0] || "")
                            }}
                              className={cn("flex items-center justify-center p-3 rounded-xl border-2 transition-all text-center min-h-[60px]",
                                isSelected ? "border-primary bg-primary/10 text-primary" : "border-muted hover:border-primary/40"
                              )}>
                              <span className="text-xs font-medium">{cat.name}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                    {form.selectedCategories.map((sel) => {
                      const subs = dbSubcategories.filter((s) => s.category_id === sel.categoryId)
                      if (subs.length === 0) return null
                      return (
                        <div key={sel.categoryId}>
                          <Label className="text-base font-semibold">Especialidad de {sel.categoryName}</Label>
                          <p className="text-xs text-muted-foreground mt-0.5">Puedes elegir varias (ej: Sala y Barra)</p>
                          <div className="grid grid-cols-2 gap-2 mt-3 max-h-[180px] overflow-y-auto p-1">
                            {[...subs.filter((s) => s.name.toLowerCase() !== "otro"), ...subs.filter((s) => s.name.toLowerCase() === "otro")].map((sub) => {
                              const subSelected = sel.subcategoryIds.includes(sub.id)
                              return (
                              <button key={sub.id} type="button" onClick={() => {
                                const next = form.selectedCategories.map((s) => {
                                  if (s.categoryId !== sel.categoryId) return s
                                  const nowSelected = s.subcategoryIds.includes(sub.id)
                                  return nowSelected
                                    ? {
                                        ...s,
                                        subcategoryIds: s.subcategoryIds.filter((id) => id !== sub.id),
                                        subcategoryNames: s.subcategoryNames.filter((n) => n !== sub.name),
                                      }
                                    : {
                                        ...s,
                                        subcategoryIds: [...s.subcategoryIds, sub.id],
                                        subcategoryNames: [...s.subcategoryNames, sub.name],
                                      }
                                })
                                update("selectedCategories", next)
                                const primary = next[0]
                                if (primary?.categoryId === sel.categoryId) {
                                  update("subcategory", primary.subcategoryNames[0] || "")
                                  update("subcategoryId", primary.subcategoryIds[0] || "")
                                }
                                if (!next.some((s) => s.subcategoryNames.some((n) => n.toLowerCase() === "otro"))) {
                                  update("customSubcategory", "")
                                }
                              }}
                                className={cn("p-3 rounded-xl border-2 transition-all text-center",
                                  subSelected ? "border-primary bg-primary/10 text-primary" : "border-muted hover:border-primary/40"
                                )}>
                                <span className="text-xs font-medium">{sub.name}</span>
                              </button>
                            )})}
                          </div>
                          {sel.subcategoryNames.some((n) => n.toLowerCase() === "otro") && (
                            <div className="mt-3">
                              <Label className="text-sm font-medium">Especifica tu especialidad dentro de {sel.categoryName}</Label>
                              <input
                                type="text"
                                className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                placeholder={"Ej: Especialista en " + sel.categoryName + "..."}
                                value={form.customSubcategory || ""}
                                onChange={(e) => update("customSubcategory", e.target.value)}
                              />
                            </div>
                          )}
                        </div>
                      )
                    })}
                    <div>
                      <Label className="text-base font-semibold">Años de Experiencia *</Label>
                      <div className="grid grid-cols-3 gap-2 mt-3">
                        {[{ v: "0-1", l: "< 1 año" }, { v: "1-2", l: "1-2 años" }, { v: "3-5", l: "3-5 años" }, { v: "5-10", l: "5-10 años" }, { v: "10+", l: "10+ años" }].map(({ v, l }) => (
                          <button key={v} type="button" onClick={() => update("experience", v)}
                            className={cn("p-3 rounded-xl border-2 transition-all text-center",
                              form.experience === v ? "border-primary bg-primary/10 text-primary font-semibold" : "border-muted hover:border-primary/40"
                            )}>
                            <span className="text-sm">{l}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── IDIOMAS (step 5 worker / step 4 business) ── */}
                {((step === 5 && isWorker) || (step === 4 && !isWorker)) && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">El Español está seleccionado por defecto.</p>
                    {languagesOptions.map((lang) => {
                      const sel = form.languages.find(l => l.name === lang.name)
                      const isSpanish = lang.name === "Español"
                      return (
                        <Card key={lang.name} className={cn("border-2", sel ? "border-primary bg-primary/5" : "border-muted")}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Label className="font-semibold">{lang.name}</Label>
                                {isSpanish && <Badge variant="outline" className="text-[10px]">Por defecto</Badge>}
                              </div>
                              {!isSpanish && (
                                <Switch checked={!!sel} onCheckedChange={(checked) => {
                                  if (checked) update("languages", [...form.languages, { name: lang.name, level: "Intermedio" }])
                                  else update("languages", form.languages.filter(l => l.name !== lang.name))
                                }} />
                              )}
                            </div>
                            {sel && (
                              <div className="flex items-center gap-2">
                                <Label className="text-xs text-muted-foreground">Nivel:</Label>
                                <Select value={sel.level} onValueChange={(level) =>
                                  update("languages", form.languages.map(l => l.name === lang.name ? { ...l, level } : l))
                                }>
                                  <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    {lang.levels.map(lv => <SelectItem key={lv} value={lv}>{lv}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}

                {/* ── STEP 6 WORKER: Disponibilidad ── */}
                {step === 6 && isWorker && (
                  <div className="space-y-3">
                    {availabilityOptions.map((opt) => (
                      <Card key={opt} className={cn("cursor-pointer border-2", form.availability === opt ? "border-primary bg-primary/5" : "border-muted")} onClick={() => update("availability", opt)}>
                        <CardContent className="p-4 flex items-center justify-between">
                          <span className="font-medium">{opt}</span>
                          {form.availability === opt && <CheckCircle2 className="w-5 h-5 text-primary" />}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* ── STEP 7 WORKER / STEP 5 BUSINESS: Multimedia ── */}
                {((step === 7 && isWorker) || (step === 5 && !isWorker)) && (
                  <div className="space-y-6">
                    {/* Foto / Logo */}
                    <div>
                      <Label className="text-base font-semibold">{isWorker ? "Foto de Perfil *" : "Logo de Empresa *"}</Label>
                      <div className="flex items-center gap-4 mt-3">
                        <div className="w-24 h-24 rounded-xl bg-muted flex items-center justify-center overflow-hidden border-2 border-dashed border-muted-foreground/30">
                          {form.profilePhoto
                            ? <img src={URL.createObjectURL(form.profilePhoto)} alt="Preview" className="w-full h-full object-cover" />
                            : <Camera className="w-8 h-8 text-muted-foreground" />}
                        </div>
                        <label className="flex items-center gap-2 px-4 py-3 bg-primary/10 text-primary font-medium rounded-xl cursor-pointer hover:bg-primary/20 border border-primary/30">
                          <Upload className="w-4 h-4" />
                          <span>Seleccionar</span>
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) update("profilePhoto", f) }} />
                        </label>
                      </div>
                      {form.profilePhoto && <p className="text-xs text-green-600 mt-2 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />{form.profilePhoto.name}</p>}
                    </div>

                    {/* Vídeos solo para candidatos */}
                    {isWorker && (
                      <div className="space-y-3">
                        <Label className="text-base font-semibold">Vídeos de Presentación * (máx. 3)</Label>
                        {[
                          { key: "videoFile", label: "Vídeo principal *", hint: "Preséntate brevemente", num: 1 },
                          { key: "videoFile2", label: "Vídeo adicional (opcional)", hint: "Muestra tus habilidades", num: 2 },
                          { key: "videoFile3", label: "Vídeo adicional (opcional)", hint: "Experiencia profesional", num: 3 },
                        ].map(({ key, label, hint, num }) => {
                          const file = form[key as keyof typeof form] as File | null
                          return (
                            <div key={key} className={cn("border-2 border-dashed rounded-xl p-4", file ? "border-green-500 bg-green-50" : "border-muted-foreground/30")}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", file ? "bg-green-500 text-white" : "bg-muted")}>
                                    {file ? <CheckCircle2 className="w-5 h-5" /> : <span className="font-bold text-muted-foreground">{num}</span>}
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm">{file ? file.name : label}</p>
                                    <p className="text-xs text-muted-foreground">{hint}</p>
                                  </div>
                                </div>
                                <label className={cn("px-3 py-2 text-sm font-medium rounded-lg cursor-pointer transition-colors", num === 1 ? "bg-primary text-white hover:bg-primary/90" : "bg-muted text-muted-foreground hover:bg-muted/80")}>
                                  {file ? "Cambiar" : "Subir"}
                                  <input type="file" accept="video/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) update(key, f) }} />
                                </label>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* ── STEP 8 WORKER / STEP 6 BUSINESS: Revisión ── */}
                {((step === 8 && isWorker) || (step === 6 && !isWorker)) && (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl p-6 text-center">
                      <CheckCircle2 className="w-14 h-14 text-green-600 mx-auto mb-3" />
                      <h3 className="text-xl font-bold mb-1">¡Casi listo!</h3>
                      <p className="text-sm text-muted-foreground">Revisa tu información antes de continuar</p>
                    </div>
                    <div className="border rounded-xl p-4 space-y-1">
                      <h4 className="font-semibold mb-2">{isWorker ? "Información Personal" : "Datos de Empresa"}</h4>
                      <p className="text-sm text-muted-foreground"><strong>Nombre:</strong> {isWorker ? form.fullName : form.companyName}</p>
                      <p className="text-sm text-muted-foreground"><strong>Teléfono:</strong> {form.phone}</p>
                      <p className="text-sm text-muted-foreground"><strong>Ubicación:</strong> {form.location}</p>
                      {!isWorker && form.businessType && <p className="text-sm text-muted-foreground"><strong>Tipo:</strong> {form.businessType}</p>}
                    </div>
                    {isWorker && form.category && (
                      <div className="border rounded-xl p-4 space-y-1">
                        <h4 className="font-semibold mb-2">Profesional</h4>
                        <p className="text-sm text-muted-foreground"><strong>Categoría:</strong> {form.category}</p>
                        {form.subcategory && <p className="text-sm text-muted-foreground"><strong>Especialidad:</strong> {form.subcategory}</p>}
                        <p className="text-sm text-muted-foreground"><strong>Experiencia:</strong> {form.experience}</p>
                        <p className="text-sm text-muted-foreground"><strong>Disponibilidad:</strong> {form.availability}</p>
                      </div>
                    )}
                    {form.languages.length > 0 && (
                      <div className="border rounded-xl p-4">
                        <h4 className="font-semibold mb-2">Idiomas</h4>
                        <div className="flex flex-wrap gap-2">
                          {form.languages.map(l => <Badge key={l.name} variant="secondary">{l.name} - {l.level}</Badge>)}
                        </div>
                      </div>
                    )}
                    {!isWorker && (
                      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
                        <CreditCard className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-sm">Siguiente paso: Elegir plan</p>
                          <p className="text-xs text-muted-foreground mt-1">Al crear tu cuenta serás redirigido a seleccionar y pagar tu plan de suscripción para poder publicar ofertas.</p>
                        </div>
                      </div>
                    )}
                    {submitError && <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">{submitError}</div>}
                  </div>
                )}

              </motion.div>
            </AnimatePresence>

            {/* Validation error */}
            {validationError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {validationError}
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <Button variant="outline" onClick={goPrev} disabled={step === 1 || (!!existingUserId && step === 3)} className="gap-2 bg-transparent">
                <ChevronLeft className="w-4 h-4" /> Anterior
              </Button>
              <Button onClick={goNext} disabled={isSubmitting} className={cn("gap-2", isLastStep ? "bg-green-600 hover:bg-green-700 text-white" : "bg-primary hover:bg-primary/90 text-white")}>
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Creando cuenta...</>
                ) : isLastStep ? (
                  <>{isWorker ? "Publicar Perfil" : "Crear y Pagar"} <CheckCircle2 className="w-4 h-4" /></>
                ) : (
                  <>Siguiente <ChevronRight className="w-4 h-4" /></>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Legal terms */}
      <LegalTermsDialog open={showLegalTerms} onAccept={handleLegalAccept} onDecline={() => setShowLegalTerms(false)} />
    </div>
  )
}
