"use client"

import { useEffect, useMemo, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  Loader2, ArrowLeft, Save, Building2, MapPin, Globe, Phone,
  Camera, Image as ImageIcon, Upload, X, Video, Plus, CheckCircle, Play
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import type { BusinessProfile } from "@/lib/types"

interface Category {
  id: string
  name: string
}

interface Subcategory {
  id: string
  name: string
  category_id: string
}

export function EditBusinessProfileContent({ userId }: { userId: string }) {
  const router = useRouter()
  // createClient() returns a new client instance every call - memoize so it
  // doesn't destabilize effect dependency arrays that include `supabase`.
  const supabase = useMemo(() => createClient(), [])

  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form data
  const [formData, setFormData] = useState({
    company_name: "",
    company_description: "",
    phone: "",
    address: "",
    city: "",
    website: "",
    category_id: "",
    subcategory_id: "",
    company_logo_url: "",
    photos: [] as string[],
    email: "",
  })

  // Media states
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [videoStatus, setVideoStatus] = useState("none")
  const [muxPlaybackId, setMuxPlaybackId] = useState<string | null>(null)
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [videoProgress, setVideoProgress] = useState(0)

  const logoInputRef = useRef<HTMLInputElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)

      // Load categories
      const { data: cats } = await supabase.from("categories").select("*").order("name")
      if (cats) setCategories(cats)

      // Load business profile
      const { data: bp } = await supabase.from("business_profiles").select("*").eq("id", userId).single()
      if (bp) {
        setBusinessProfile(bp)
        setFormData({
          company_name: bp.company_name || "",
          company_description: bp.company_description || "",
          phone: bp.phone || "",
          address: bp.address || "",
          city: bp.city || "",
          website: bp.website || "",
          category_id: bp.category_id || "",
          subcategory_id: bp.subcategory_id || "",
          company_logo_url: bp.company_logo_url || "",
          photos: bp.photos || [],
          email: bp.email || "",
        })
        setVideoStatus(bp.video_status || "none")
        setMuxPlaybackId(bp.mux_playback_id || null)

        // Load subcategories if category exists
        if (bp.category_id) {
          const { data: subs } = await supabase.from("subcategories").select("*").eq("category_id", bp.category_id).order("name")
          if (subs) setSubcategories(subs)
        }
      }

      setLoading(false)
    }
    loadData()
  }, [userId, supabase])

  useEffect(() => {
    // Load subcategories when category changes
    const loadSubs = async () => {
      if (!formData.category_id) {
        setSubcategories([])
        return
      }
      const { data } = await supabase.from("subcategories").select("*").eq("category_id", formData.category_id).order("name")
      if (data) setSubcategories(data)
    }
    loadSubs()
  }, [formData.category_id, supabase])

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten imagenes")
      return
    }
    setUploadingLogo(true)
    try {
      const formDataUpload = new FormData()
      formDataUpload.append("file", file)
      formDataUpload.append("type", "business-logo")
      const res = await fetch("/api/upload", { method: "POST", body: formDataUpload })
      if (!res.ok) throw new Error()
      const { url } = await res.json()
      setFormData({ ...formData, company_logo_url: url })
      toast.success("Logo subido")
    } catch {
      toast.error("Error al subir logo")
    } finally {
      setUploadingLogo(false)
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    if (formData.photos.length + files.length > 5) {
      toast.error("Maximo 5 fotos")
      return
    }
    setUploadingPhoto(true)
    const newUrls: string[] = []
    for (const file of files) {
      if (!file.type.startsWith("image/")) continue
      try {
        const formDataUpload = new FormData()
        formDataUpload.append("file", file)
        formDataUpload.append("type", "business-photo")
        const res = await fetch("/api/upload", { method: "POST", body: formDataUpload })
        if (res.ok) {
          const { url } = await res.json()
          newUrls.push(url)
        }
      } catch {}
    }
    if (newUrls.length) {
      setFormData({ ...formData, photos: [...formData.photos, ...newUrls] })
      toast.success(`${newUrls.length} foto(s) subida(s)`)
    }
    setUploadingPhoto(false)
    if (photoInputRef.current) photoInputRef.current.value = ""
  }

  const removePhoto = (index: number) => {
    setFormData({ ...formData, photos: formData.photos.filter((_, i) => i !== index) })
  }

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("video/")) {
      toast.error("Solo se permiten videos")
      return
    }
    if (file.size > 200 * 1024 * 1024) {
      toast.error("Maximo 200MB")
      return
    }
    setUploadingVideo(true)
    setVideoProgress(0)
    setVideoStatus("uploading")
    try {
      const res = await fetch("/api/mux/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileType: "business" }),
      })
      if (!res.ok) throw new Error()
      const { uploadUrl } = await res.json()

      const xhr = new XMLHttpRequest()
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          setVideoProgress(Math.round((event.loaded / event.total) * 100))
        }
      })
      await new Promise<void>((resolve, reject) => {
        xhr.addEventListener("load", () => xhr.status >= 200 && xhr.status < 300 ? resolve() : reject())
        xhr.addEventListener("error", reject)
        xhr.open("PUT", uploadUrl)
        xhr.send(file)
      })
      setVideoStatus("processing")
      toast.success("Video subido. Procesando...")

      // Poll for status
      for (let i = 0; i < 60; i++) {
        await new Promise(r => setTimeout(r, 3000))
        const statusRes = await fetch("/api/mux/status?type=business")
        const statusData = await statusRes.json()
        if (statusData.status === "ready" && statusData.playbackId) {
          setVideoStatus("ready")
          setMuxPlaybackId(statusData.playbackId)
          toast.success("Video listo")
          break
        }
      }
    } catch {
      toast.error("Error al subir video")
      setVideoStatus("error")
    } finally {
      setUploadingVideo(false)
      if (videoInputRef.current) videoInputRef.current.value = ""
    }
  }

  const handleSave = async () => {
    if (!formData.company_name) {
      toast.error("El nombre de la empresa es requerido")
      return
    }
    setSaving(true)
    try {
      // Update business_profiles
      const { error } = await supabase
        .from("business_profiles")
        .upsert({
          id: userId,
          company_name: formData.company_name,
          company_description: formData.company_description,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          website: formData.website,
          category_id: formData.category_id || null,
          subcategory_id: formData.subcategory_id || null,
          company_logo_url: formData.company_logo_url || null,
          photos: formData.photos,
          email: formData.email || null,
          updated_at: new Date().toISOString(),
        })

      if (error) throw error

      // Update profile location/phone
      await supabase.from("profiles").update({
        phone: formData.phone,
        location: formData.city,
        updated_at: new Date().toISOString(),
      }).eq("id", userId)

      toast.success("Perfil guardado correctamente")
    } catch (err) {
      console.error(err)
      toast.error("Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#01A89E]" />
      </div>
    )
  }

  const videoThumbnail = muxPlaybackId
    ? `https://image.mux.com/${muxPlaybackId}/thumbnail.webp?width=480&height=270`
    : null

  return (
    <div className="min-h-screen bg-gray-50 pb-28 md:pt-14">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-gray-900 flex-1">Editar Perfil de Empresa</h1>
          <Button onClick={handleSave} disabled={saving} size="sm" className="bg-[#01A89E] hover:bg-[#018F86] text-white gap-1.5">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-5 max-w-2xl space-y-5">
        {/* Logo & Basic Info */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-[#01A89E]/10 to-transparent pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#01A89E]" />
              Informacion de la Empresa
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {/* Logo */}
            <div className="flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadingLogo}
                className="relative w-24 h-24 rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 hover:border-[#01A89E] transition-colors overflow-hidden group"
              >
                {formData.company_logo_url ? (
                  <img src={formData.company_logo_url} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    {uploadingLogo ? <Loader2 className="w-6 h-6 text-[#01A89E] animate-spin" /> : <Camera className="w-6 h-6 text-gray-400" />}
                    <span className="text-[10px] text-gray-400 mt-1">Logo</span>
                  </div>
                )}
              </button>
              <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            </div>

            <div className="space-y-2">
              <Label>Nombre de la Empresa *</Label>
              <Input
                placeholder="Mi Restaurante S.L."
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Descripcion</Label>
              <Textarea
                placeholder="Describe tu empresa..."
                value={formData.company_description}
                onChange={(e) => setFormData({ ...formData, company_description: e.target.value })}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><Phone className="w-3 h-3" /> Teléfono</Label>
                <Input
                  placeholder="+34 900 000 000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><MapPin className="w-3 h-3" /> Ciudad</Label>
                <Input
                  placeholder="Madrid"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Dirección</Label>
              <Input
                placeholder="Calle Mayor 1, 28001"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1"><Globe className="w-3 h-3" /> Sitio Web</Label>
              <Input
                placeholder="https://www.miempresa.com"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Category */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-[#01A89E]/10 to-transparent pb-3">
            <CardTitle className="text-base">Categoría de Negocio</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select value={formData.category_id} onValueChange={(v) => setFormData({ ...formData, category_id: v, subcategory_id: "" })}>
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
                <Select value={formData.subcategory_id} onValueChange={(v) => setFormData({ ...formData, subcategory_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecciona subcategoría" /></SelectTrigger>
                  <SelectContent>
                    {subcategories.map((sub) => (
                      <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Photos */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-[#01A89E]/10 to-transparent pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-[#01A89E]" />
              Fotos del Negocio ({formData.photos.length}/5)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-3 gap-3">
              {formData.photos.map((url, index) => (
                <div key={index} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group">
                  <img src={url} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute top-1.5 right-1.5 bg-black/60 hover:bg-black/80 p-1 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {formData.photos.length < 5 && (
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="aspect-square border-2 border-dashed border-gray-300 hover:border-[#01A89E] rounded-xl flex flex-col items-center justify-center gap-1 transition-colors"
                >
                  {uploadingPhoto ? <Loader2 className="w-5 h-5 text-[#01A89E] animate-spin" /> : <Plus className="w-5 h-5 text-gray-400" />}
                  <span className="text-[10px] text-gray-400">Añadir</span>
                </button>
              )}
            </div>
            <input ref={photoInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />
          </CardContent>
        </Card>

        {/* Video */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-[#01A89E]/10 to-transparent pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Video className="w-4 h-4 text-[#01A89E]" />
              Video de Presentacion
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {videoStatus === "ready" && videoThumbnail && (
              <div className="relative rounded-xl overflow-hidden bg-black">
                <img src={videoThumbnail} alt="Video" className="w-full max-h-56 object-cover" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-black/40 rounded-full p-3">
                    <Play className="w-6 h-6 text-white" fill="white" />
                  </div>
                </div>
                <div className="absolute bottom-2 left-2 bg-emerald-500 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Listo
                </div>
              </div>
            )}

            {videoStatus === "processing" && (
              <div className="border-2 border-dashed border-[#01A89E]/50 rounded-xl py-10 flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-[#01A89E] animate-spin" />
                <span className="text-sm text-gray-600">Procesando video...</span>
              </div>
            )}

            {videoStatus === "uploading" && uploadingVideo && (
              <div className="border-2 border-dashed border-[#01A89E]/50 rounded-xl py-10 flex flex-col items-center gap-3 px-6">
                <Upload className="w-8 h-8 text-[#01A89E]" />
                <span className="text-sm text-gray-600">Subiendo... {videoProgress}%</span>
                <Progress value={videoProgress} className="h-2 w-full max-w-xs" />
              </div>
            )}

            {(videoStatus === "none" || videoStatus === "error") && !uploadingVideo && (
              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-300 hover:border-[#01A89E] rounded-xl py-10 flex flex-col items-center gap-2 transition-colors group"
              >
                <Upload className="w-5 h-5 text-gray-400 group-hover:text-[#01A89E]" />
                <span className="text-sm text-gray-600">Subir video de presentacion</span>
                <span className="text-xs text-gray-400">MP4, MOV, WebM. Max 200MB</span>
              </button>
            )}
            <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="pt-2 pb-4">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-12 bg-[#01A89E] hover:bg-[#018F86] text-white font-semibold text-base gap-2 rounded-xl shadow-lg"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Guardar Perfil de Empresa
          </Button>
        </div>
      </div>
    </div>
  )
}
