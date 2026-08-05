"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation" 
import { ArrowLeft, Save, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { updateProfileAction } from "@/lib/actions"
import { createClient } from "@/lib/supabase/client"
import type { Profile } from "@/lib/types"
import {
  generateId, parseJsonField,
  type WorkExperience, type Education, type LanguageEntry,
} from "@/lib/profile-constants"

import { MediaSection } from "@/components/edit-profile/media-section"
import { PersonalSection } from "@/components/edit-profile/personal-section"
import { ProfessionalSection } from "@/components/edit-profile/professional-section"
import { SkillsSection } from "@/components/edit-profile/skills-section"
import { DestrezasSection } from "@/components/edit-profile/destrezas-section"
import { LanguagesSection } from "@/components/edit-profile/languages-section"
import { ExperienceSection } from "@/components/edit-profile/experience-section"
import { EducationSection } from "@/components/edit-profile/education-section"
import { CvSection } from "@/components/edit-profile/cv-section"
import { PortfolioSection } from "@/components/edit-profile/portfolio-section"
import { PortfolioVideosSection } from "@/components/edit-profile/portfolio-videos-section"
import { PremiumFeaturesCard } from "@/components/premium-features-card"
import { ReferralCard } from "@/components/edit-profile/referral-card"

interface EditProfileContentProps {
  profile: Profile | null
  userEmail: string
}

export function EditProfileContent({ profile, userEmail }: EditProfileContentProps) {
  const router = useRouter()

  // --- profile visibility ---
  const [isActive, setIsActive] = useState(true)
  
  // --- personal ---
  const [displayName, setDisplayName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [dateOfBirth, setDateOfBirth] = useState("")
  const [location, setLocation] = useState("")
  const [bio, setBio] = useState("")

  // --- professional ---
  const [jobCategory, setJobCategory] = useState("")
  const [subcategory, setSubcategory] = useState("")
  const [customSubcategory, setCustomSubcategory] = useState("")
  const [experienceYears, setExperienceYears] = useState("")
  const [currentPosition, setCurrentPosition] = useState("")
  const [availability, setAvailability] = useState("")
  const [contractTypes, setContractTypes] = useState<string[]>([])
  const [salaryMin, setSalaryMin] = useState("")
  const [salaryMax, setSalaryMax] = useState("")
  const [matchAlertThreshold, setMatchAlertThreshold] = useState(100)

  // --- lists ---
  const [skills, setSkills] = useState<string[]>([])
  const [destrezas, setDestrezas] = useState<string[]>([])
  const [languages, setLanguages] = useState<LanguageEntry[]>([])
  const [workExperience, setWorkExperience] = useState<WorkExperience[]>([])
  const [education, setEducation] = useState<Education[]>([])

  // --- files ---
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [cvFileName, setCvFileName] = useState("")
  const [cvUrl, setCvUrl] = useState("")
  const [portfolioImages, setPortfolioImages] = useState<string[]>([])
  const [portfolioVideos, setPortfolioVideos] = useState<string[]>([])

  // --- save ---
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState("")

  // --- init from profile ---
  useEffect(() => {
    if (!profile) return

    setIsActive(profile.is_active !== false) // Default to active if undefined
    setDisplayName(profile.display_name || "")
    setEmail(userEmail || "")
    setPhone(profile.phone || "")
    setDateOfBirth(profile.date_of_birth || "")
    setLocation(profile.location || "")
    setBio(profile.bio || "")
    setJobCategory(profile.job_category || "")
    setSubcategory(profile.job_subcategory || "")
    // Sin esto se quedaba vacía y, como el guardado escribe
    // `custom_subcategory: customSubcategory || null`, cada vez que alguien
    // editaba su perfil se borraba la especialidad que había puesto al
    // registrarse.
    setCustomSubcategory((profile as any).custom_subcategory || "")
    setCustomSubcategory((profile as any).custom_subcategory || "")
    setExperienceYears(String(profile.experience_years || ""))
    setAvailability(profile.availability_status || "")

    if (profile.avatar_url) {
      setAvatarPreview(profile.avatar_url)
      setAvatarUrl(profile.avatar_url)
    }
    
    // CV
    if (profile.cv_url) setCvUrl(profile.cv_url)
    if (profile.cv_filename) setCvFileName(profile.cv_filename)
    
    // Portfolio images
    if (profile.portfolio_images && Array.isArray(profile.portfolio_images)) {
      setPortfolioImages(profile.portfolio_images.filter(Boolean))
    }
    
    // Portfolio videos
    if (profile.portfolio_videos && Array.isArray(profile.portfolio_videos)) {
      setPortfolioVideos(profile.portfolio_videos.filter(Boolean))
    }

    const rawSkills = profile.specialties
    if (rawSkills) setSkills(Array.isArray(rawSkills) ? rawSkills : [])

    if (profile.skills) setDestrezas(Array.isArray(profile.skills) ? profile.skills : [])

    const rawLangs = profile.languages
    if (rawLangs && Array.isArray(rawLangs)) {
      setLanguages(
        rawLangs.map((l: any) =>
          typeof l === "string"
            ? { id: generateId(), language: l, level: "intermediate" }
            : { id: generateId(), language: l.language || l, level: l.level || "intermediate" }
        )
      )
    }

    // work_experience is its own column now (post-025 migration); certificates
    // holds only education. Still tolerate old-shaped entries in either field
    // in case a row wasn't backfilled.
    const rawWorkExperience = parseJsonField((profile as any).work_experience)
    const rawCerts = parseJsonField(profile.certificates)
    const exp: WorkExperience[] = rawWorkExperience.map((c: any) => ({
      id: generateId(), company: c.company || "", position: c.position || "", startDate: c.startDate || "", endDate: c.endDate || "", current: c.current || false, description: c.description || "",
    }))
    const edu: Education[] = []
    rawCerts.forEach((c: any) => {
      if (c.company || c.position) {
        exp.push({ id: generateId(), company: c.company || "", position: c.position || "", startDate: c.startDate || "", endDate: c.endDate || "", current: c.current || false, description: c.description || "" })
      } else if (c.institution || c.title) {
        edu.push({ id: generateId(), institution: c.institution || "", title: c.title || "", year: c.year || "" })
      }
    })
    if (exp.length) setWorkExperience(exp)
    if (edu.length) setEducation(edu)

    // El tipo declara string[], pero Supabase devuelve estas columnas a veces
    // como texto (JSON o separado por comas), de ahí la comprobación en
    // ejecución. Se lee como `unknown` para que TypeScript no dé por imposible
    // la rama de cadena y la reduzca a `never`.
    const rawContract: unknown = profile.contract_type_sought
    if (rawContract) {
      let parsed: string[] = []
      if (Array.isArray(rawContract)) {
        parsed = rawContract.filter((value): value is string => typeof value === "string")
      } else if (typeof rawContract === "string") {
        try {
          const fromJson = JSON.parse(rawContract)
          parsed = Array.isArray(fromJson)
            ? fromJson.filter((value): value is string => typeof value === "string")
            : rawContract.split(",")
        } catch {
          parsed = rawContract.split(",")
        }
      }
      setContractTypes(parsed.map((value) => value.trim()).filter(Boolean))
    }

    if (typeof profile.match_alert_threshold === "number") {
      setMatchAlertThreshold(profile.match_alert_threshold)
    }
  }, [profile, userEmail])

  // --- media handlers ---
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleCvUploaded = (url: string, filename: string) => {
    setCvUrl(url)
    setCvFileName(filename)
  }
  
  const handleRemoveCv = () => {
    setCvUrl("")
    setCvFileName("")
  }

  // --- list helpers ---
  const addSkill = (s: string) => {
    const trimmed = s.trim()
    if (trimmed && !skills.includes(trimmed)) setSkills([...skills, trimmed])
  }
  const removeSkill = (s: string) => setSkills(skills.filter((x) => x !== s))

  const addLanguage = () => setLanguages([...languages, { id: generateId(), language: "", level: "basic" }])
  const removeLanguage = (id: string) => setLanguages(languages.filter((l) => l.id !== id))
  const updateLanguage = (id: string, field: string, value: string) => setLanguages(languages.map((l) => l.id === id ? { ...l, [field]: value } : l))

  const addExperience = () => setWorkExperience([...workExperience, { id: generateId(), company: "", position: "", startDate: "", endDate: "", current: false, description: "" }])
  const removeExperience = (id: string) => setWorkExperience(workExperience.filter((e) => e.id !== id))
  const updateExperience = (id: string, field: string, value: any) => setWorkExperience(workExperience.map((e) => e.id === id ? { ...e, [field]: value } : e))

  const addEducation = () => setEducation([...education, { id: generateId(), institution: "", title: "", year: "" }])
  const removeEducation = (id: string) => setEducation(education.filter((e) => e.id !== id))
  const updateEducation = (id: string, field: string, value: string) => setEducation(education.map((e) => e.id === id ? { ...e, [field]: value } : e))

  const toggleContractType = (val: string) => {
    setContractTypes(contractTypes.includes(val) ? contractTypes.filter((c) => c !== val) : [...contractTypes, val])
  }

  const toggleDestreza = (val: string) => {
    setDestrezas(destrezas.includes(val) ? destrezas.filter((d) => d !== val) : [...destrezas, val])
  }

  // --- save ---
  const handleSave = async () => {
    setSaving(true)
    setSaveSuccess(false)
    setSaveError("")

    try {
      const supabase = createClient()
      let finalAvatarUrl = avatarUrl
      
      // Upload avatar if new file selected
      if (avatarFile) {
        const { data: { session } } = await supabase.auth.getSession()
        const user = session?.user
        if (user) {
          const fileExt = avatarFile.name.split('.').pop()
          const fileName = `${user.id}/avatar.${fileExt}`
          
          const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(fileName, avatarFile, { upsert: true })
          
          if (uploadError) {
            setSaveError("Error al subir la imagen de perfil")
            setSaving(false)
            return
          }
          
          const { data: urlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName)
          
          finalAvatarUrl = urlData.publicUrl
          setAvatarUrl(finalAvatarUrl)
        }
      }

      const updates: Record<string, unknown> = {
        is_active: isActive,
        display_name: displayName,
        phone,
        date_of_birth: dateOfBirth || null,
        location,
        bio,
        avatar_url: finalAvatarUrl,
        job_category: jobCategory,
        job_subcategory: subcategory,
        custom_subcategory: customSubcategory || null,
        experience_years: experienceYears ? Number(experienceYears) : null,
        availability_status: availability,
        contract_type_sought: contractTypes,
        match_alert_threshold: matchAlertThreshold,
        specialties: skills,
        skills: destrezas,
        languages: languages.filter((l) => l.language).map((l) => ({ language: l.language, level: l.level })),
        // Work history now lives in its own column (see profile-detail-content.tsx
        // "Experiencia" card) - certificates keeps only education entries.
        work_experience: workExperience.map((e) => ({ company: e.company, position: e.position, startDate: e.startDate, endDate: e.endDate, current: e.current, description: e.description })),
        certificates: education.map((e) => ({ institution: e.institution, title: e.title, year: e.year })),
        // CV fields
        cv_url: cvUrl || null,
        cv_filename: cvFileName || null,
        // Portfolio images
        portfolio_images: portfolioImages,
        // Portfolio videos
        portfolio_videos: portfolioVideos,
      }

      const result = await updateProfileAction(updates)

      // A server action that fails to reach the server (deploy skew, expired
      // session, proxy error) can resolve to null/undefined - reading .error
      // off it used to throw and surface as the opaque "Error inesperado".
      if (!result) {
        setSaveError(
          "No se pudo contactar con el servidor. Recarga la página e inténtalo de nuevo."
        )
      } else if (result.error) {
        // Translate common errors to Spanish
        const errorMsg = result.error
          .replace("Could not find", "No se encontro")
          .replace("column", "columna")
          .replace("in the schema cache", "en la base de datos")
        setSaveError(errorMsg)
      } else {
        setSaveSuccess(true)
        setAvatarFile(null) // Clear file after successful save
        setTimeout(() => setSaveSuccess(false), 3000)
      }
    } catch (err) {
      // Never swallow the cause: without it this screen is undebuggable.
      console.error("handleSave failed:", err)
      const detail = err instanceof Error ? err.message : String(err)
      setSaveError(`Error al guardar el perfil: ${detail}`)
    }
    setSaving(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-28 md:pt-14">
      {/* Sticky header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-gray-900 flex-1">Editar Perfil</h1>
          <Button onClick={handleSave} disabled={saving} size="sm" className="bg-[#01A89E] hover:bg-[#018F86] text-white gap-1.5">
            {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar
          </Button>
        </div>
      </div>

      {saveSuccess && (
        <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2.5 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span className="text-sm text-emerald-700 font-medium">Perfil guardado correctamente</span>
        </div>
      )}
      {saveError && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2.5 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <span className="text-sm text-red-700 font-medium">{saveError}</span>
        </div>
      )}

      <div className="container mx-auto px-4 py-5 max-w-2xl space-y-5">
        {/* Profile Visibility Toggle */}
        <Card className={isActive ? "border-[#01A89E]/30 bg-[#01A89E]/5" : "border-red-300 bg-red-50"}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isActive ? (
                  <div className="w-10 h-10 rounded-full bg-[#01A89E]/10 flex items-center justify-center">
                    <Eye className="w-5 h-5 text-[#01A89E]" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                    <EyeOff className="w-5 h-5 text-red-500" />
                  </div>
                )}
                <div>
                  <Label className="text-sm font-semibold">
                    {isActive ? "Perfil visible" : "Perfil oculto"}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isActive 
                      ? "Las empresas pueden ver tu perfil y contactarte" 
                      : "Tu perfil está oculto. No recibirás ofertas de empleo"}
                  </p>
                </div>
              </div>
              <Switch
                checked={isActive}
                onCheckedChange={setIsActive}
                className="data-[state=checked]:bg-[#01A89E]"
              />
            </div>
            {!isActive && (
              <div className="mt-3 p-2 bg-red-100 rounded-lg">
                <p className="text-xs text-red-700">
                  Actualmente no estás buscando empleo. Activa tu perfil cuando quieras volver a recibir ofertas.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <MediaSection
          avatarPreview={avatarPreview}
          onAvatarChange={handleAvatarChange}
        />

        <PersonalSection
          displayName={displayName} setDisplayName={setDisplayName}
          email={email}
          phone={phone} setPhone={setPhone}
          dateOfBirth={dateOfBirth} setDateOfBirth={setDateOfBirth}
          location={location} setLocation={setLocation}
          bio={bio} setBio={setBio}
        />

        <ProfessionalSection
          jobCategory={jobCategory} setJobCategory={setJobCategory}
          subcategory={subcategory} setSubcategory={setSubcategory}
          customSubcategory={customSubcategory} setCustomSubcategory={setCustomSubcategory}
          experienceYears={experienceYears} setExperienceYears={setExperienceYears}
          currentPosition={currentPosition} setCurrentPosition={setCurrentPosition}
          availability={availability} setAvailability={setAvailability}
          contractTypes={contractTypes} toggleContractType={toggleContractType}
          salaryMin={salaryMin} setSalaryMin={setSalaryMin}
          salaryMax={salaryMax} setSalaryMax={setSalaryMax}
          matchAlertThreshold={matchAlertThreshold} setMatchAlertThreshold={setMatchAlertThreshold}
          isPremium={!!profile?.is_premium}
        />

        <SkillsSection skills={skills} addSkill={addSkill} removeSkill={removeSkill} />

        <DestrezasSection skills={destrezas} toggleSkill={toggleDestreza} />

        <LanguagesSection
          languages={languages}
          addLanguage={addLanguage}
          removeLanguage={removeLanguage}
          updateLanguage={updateLanguage}
        />

        <ExperienceSection
          workExperience={workExperience}
          addExperience={addExperience}
          removeExperience={removeExperience}
          updateExperience={updateExperience}
        />

        <EducationSection
          education={education}
          addEducation={addEducation}
          removeEducation={removeEducation}
          updateEducation={updateEducation}
        />

        {/* 6 imágenes: es lo que muestra la galería del perfil público
            (ver profile-detail-content.tsx). */}
        <PortfolioSection
          images={portfolioImages}
          onImagesChange={setPortfolioImages}
          maxImages={6}
        />

        <PortfolioVideosSection
          videos={portfolioVideos}
          onVideosChange={setPortfolioVideos}
          maxVideos={3}
        />

        <CvSection
          cvFileName={cvFileName}
          cvUrl={cvUrl}
          onCvUploaded={handleCvUploaded}
          onRemoveCv={handleRemoveCv}
        />

        <ReferralCard referralCode={profile?.referral_code} />

        {/* Premium Features - Highlight profile & View matches */}
        <PremiumFeaturesCard />

        <div className="pt-2 pb-4">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-12 bg-[#01A89E] hover:bg-[#018F86] text-white font-semibold text-base gap-2 rounded-xl shadow-lg"
          >
            {saving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
            Guardar Perfil Completo
          </Button>
        </div>
      </div>
    </div>
  )
}
