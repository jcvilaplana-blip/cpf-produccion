"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Building2, User, CheckCircle, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import Image from "next/image"

interface Category {
  id: string
  name: string
  slug: string
}

interface Subcategory {
  id: string
  name: string
  category_id: string
}

export default function CompleteProfilePage() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const supabase = createClient()
  
  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [saving, setSaving] = useState(false)
  const [step, setStep] = useState(1)
  
  // Worker fields
  const [workerData, setWorkerData] = useState({
    phone: "",
    location: "",
    bio: "",
    category_id: "",
    subcategory_id: "",
  })
  
  // Business fields
  const [businessData, setBusinessData] = useState({
    company_name: "",
    company_description: "",
    phone: "",
    address: "",
    city: "",
    website: "",
    category_id: "",
    subcategory_id: "",
  })

  useEffect(() => {
    // Load categories
    const loadCategories = async () => {
      const { data } = await supabase.from("categories").select("*").order("name")
      if (data) setCategories(data)
    }
    loadCategories()
  }, [supabase])

  useEffect(() => {
    // Load subcategories when category changes
    const categoryId = user?.userType === "business" ? businessData.category_id : workerData.category_id
    if (!categoryId) {
      setSubcategories([])
      return
    }
    const loadSubcategories = async () => {
      const { data } = await supabase.from("subcategories").select("*").eq("category_id", categoryId).order("name")
      if (data) setSubcategories(data)
    }
    loadSubcategories()
  }, [businessData.category_id, workerData.category_id, user?.userType, supabase])

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login")
    }
  }, [isLoading, isAuthenticated, router])

  const handleWorkerSubmit = async () => {
    if (!user) return
    setSaving(true)
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          phone: workerData.phone,
          location: workerData.location,
          bio: workerData.bio,
          category_id: workerData.category_id || null,
          subcategory_id: workerData.subcategory_id || null,
          profile_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (error) throw error
      
      toast.success("Perfil completado")
      router.push("/dashboard")
    } catch {
      toast.error("Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  const handleBusinessSubmit = async () => {
    if (!user) return
    if (!businessData.company_name) {
      toast.error("El nombre de la empresa es requerido")
      return
    }
    setSaving(true)
    try {
      // Update profile
      await supabase
        .from("profiles")
        .update({
          phone: businessData.phone,
          location: businessData.city,
          profile_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      // Upsert business_profiles
      const { error } = await supabase
        .from("business_profiles")
        .upsert({
          id: user.id,
          company_name: businessData.company_name,
          company_description: businessData.company_description,
          phone: businessData.phone,
          address: businessData.address,
          city: businessData.city,
          website: businessData.website,
          category_id: businessData.category_id || null,
          subcategory_id: businessData.subcategory_id || null,
          updated_at: new Date().toISOString(),
        })

      if (error) throw error
      
      toast.success("Perfil de empresa completado")
      router.push("/business-dashboard")
    } catch (err) {
      console.error(err)
      toast.error("Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#01A89E]" />
      </div>
    )
  }

  const isWorker = user?.userType === "worker"
  const isBusiness = user?.userType === "business"

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary p-4 md:p-8">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-8">
          <Image src="/logo-cpf.png" alt="CamareroPorFavor" width={140} height={46} className="mx-auto mb-4" />
          <h1 className="text-2xl font-bold">Completa tu Perfil</h1>
          <p className="text-muted-foreground">
            {isWorker ? "Ayuda a las empresas a encontrarte" : "Presenta tu empresa a los candidatos"}
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className={`h-2 w-16 rounded-full ${step >= 1 ? "bg-[#01A89E]" : "bg-gray-200"}`} />
          <div className={`h-2 w-16 rounded-full ${step >= 2 ? "bg-[#01A89E]" : "bg-gray-200"}`} />
        </div>

        {isWorker && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-[#01A89E]" />
                Informacion del Candidato
              </CardTitle>
              <CardDescription>Paso {step} de 2</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {step === 1 && (
                <>
                  <div className="space-y-2">
                    <Label>Teléfono</Label>
                    <Input
                      placeholder="+34 600 000 000"
                      value={workerData.phone}
                      onChange={(e) => setWorkerData({ ...workerData, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ubicación</Label>
                    <Input
                      placeholder="Madrid, España"
                      value={workerData.location}
                      onChange={(e) => setWorkerData({ ...workerData, location: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Sobre ti</Label>
                    <Textarea
                      placeholder="Cuéntanos sobre tu experiencia y habilidades..."
                      value={workerData.bio}
                      onChange={(e) => setWorkerData({ ...workerData, bio: e.target.value })}
                      rows={4}
                    />
                  </div>
                  <Button onClick={() => setStep(2)} className="w-full bg-[#01A89E] hover:bg-[#018F86]">
                    Siguiente <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </>
              )}
              {step === 2 && (
                <>
                  <div className="space-y-2">
                    <Label>Categoría Profesional</Label>
                    <Select value={workerData.category_id} onValueChange={(v) => setWorkerData({ ...workerData, category_id: v, subcategory_id: "" })}>
                      <SelectTrigger><SelectValue placeholder="Selecciona categoría" /></SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {subcategories.length > 0 && (
                    <div className="space-y-2">
                      <Label>Subcategoría</Label>
                      <Select value={workerData.subcategory_id} onValueChange={(v) => setWorkerData({ ...workerData, subcategory_id: v })}>
                        <SelectTrigger><SelectValue placeholder="Selecciona subcategoría" /></SelectTrigger>
                        <SelectContent>
                          {subcategories.map((sub) => (
                            <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Atrás</Button>
                    <Button onClick={handleWorkerSubmit} disabled={saving} className="flex-1 bg-[#01A89E] hover:bg-[#018F86]">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle className="mr-2 h-4 w-4" /> Completar</>}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {isBusiness && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-[#01A89E]" />
                Información de la Empresa
              </CardTitle>
              <CardDescription>Paso {step} de 2</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {step === 1 && (
                <>
                  <div className="space-y-2">
                    <Label>Nombre de la Empresa *</Label>
                    <Input
                      placeholder="Mi Restaurante S.L."
                      value={businessData.company_name}
                      onChange={(e) => setBusinessData({ ...businessData, company_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Descripción</Label>
                    <Textarea
                      placeholder="Cuéntanos sobre tu empresa, qué tipo de negocio es..."
                      value={businessData.company_description}
                      onChange={(e) => setBusinessData({ ...businessData, company_description: e.target.value })}
                      rows={4}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Teléfono</Label>
                      <Input
                        placeholder="+34 900 000 000"
                        value={businessData.phone}
                        onChange={(e) => setBusinessData({ ...businessData, phone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Ciudad</Label>
                      <Input
                        placeholder="Madrid"
                        value={businessData.city}
                        onChange={(e) => setBusinessData({ ...businessData, city: e.target.value })}
                      />
                    </div>
                  </div>
                  <Button onClick={() => setStep(2)} className="w-full bg-[#01A89E] hover:bg-[#018F86]" disabled={!businessData.company_name}>
                    Siguiente <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </>
              )}
              {step === 2 && (
                <>
                  <div className="space-y-2">
                    <Label>Dirección</Label>
                    <Input
                      placeholder="Calle Mayor 1, 28001"
                      value={businessData.address}
                      onChange={(e) => setBusinessData({ ...businessData, address: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Sitio Web</Label>
                    <Input
                      placeholder="https://www.miempresa.com"
                      value={businessData.website}
                      onChange={(e) => setBusinessData({ ...businessData, website: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Categoría de Negocio</Label>
                    <Select value={businessData.category_id} onValueChange={(v) => setBusinessData({ ...businessData, category_id: v, subcategory_id: "" })}>
                      <SelectTrigger><SelectValue placeholder="Selecciona categoría" /></SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {subcategories.length > 0 && (
                    <div className="space-y-2">
                      <Label>Subcategoría</Label>
                      <Select value={businessData.subcategory_id} onValueChange={(v) => setBusinessData({ ...businessData, subcategory_id: v })}>
                        <SelectTrigger><SelectValue placeholder="Selecciona subcategoría" /></SelectTrigger>
                        <SelectContent>
                          {subcategories.map((sub) => (
                            <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Atrás</Button>
                    <Button onClick={handleBusinessSubmit} disabled={saving} className="flex-1 bg-[#01A89E] hover:bg-[#018F86]">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle className="mr-2 h-4 w-4" /> Completar</>}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        <p className="text-center text-xs text-muted-foreground mt-6">
          Puedes actualizar esta información más tarde desde tu perfil
        </p>
      </div>
    </div>
  )
}
