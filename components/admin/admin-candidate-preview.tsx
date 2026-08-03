"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  X, MapPin, Star, Briefcase, MessageCircle, Heart,
  Clock, CheckCircle, Award, Globe, Image as ImageIcon, ExternalLink
} from "lucide-react"

interface CandidatePreviewProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  candidate: any
}

export function AdminCandidatePreview({ open, onOpenChange, candidate }: CandidatePreviewProps) {
  const [liked, setLiked] = useState(false)
  const [activeImage, setActiveImage] = useState<string | null>(null)

  if (!candidate) return null

  const c = candidate
  const specialties = (() => {
    try {
      if (Array.isArray(c.specialties)) return c.specialties
      if (typeof c.specialties === "string") return JSON.parse(c.specialties)
      return []
    } catch { return [] }
  })()
  const languages = (() => {
    try {
      let raw = c.languages
      if (typeof raw === "string") raw = JSON.parse(raw)
      if (!Array.isArray(raw)) return []
      return raw.map((l: any) =>
        typeof l === "string" ? l : [l.name || l.language, l.level].filter(Boolean).join(" - ")
      )
    } catch { return [] }
  })()
  const contractTypes = (() => {
    try {
      if (Array.isArray(c.contract_type_sought)) return c.contract_type_sought
      if (typeof c.contract_type_sought === "string") return JSON.parse(c.contract_type_sought)
      return []
    } catch { return [] }
  })()
  const portfolioImages = Array.isArray(c.portfolio_images) ? c.portfolio_images : []
  const availabilityMap: Record<string, { label: string; color: string }> = {
    available: { label: "Disponible", color: "bg-emerald-100 text-emerald-700" },
    busy: { label: "Ocupado", color: "bg-amber-100 text-amber-700" },
    not_looking: { label: "No busca empleo", color: "bg-slate-100 text-slate-600" },
  }
  const avail = availabilityMap[c.availability_status] || { label: c.availability_status || "No indicado", color: "bg-slate-100 text-slate-600" }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl max-h-[92vh] overflow-y-auto bg-background">
          {/* Hero section - avatar */}
          <div className="relative w-full aspect-[9/12] max-h-[45vh] bg-black overflow-hidden">
            {c.avatar_url ? (
              <img src={c.avatar_url} alt={c.display_name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#01A89E]/20 to-[#01A89E]/5 flex items-center justify-center">
                <div className="h-24 w-24 rounded-full bg-white/80 flex items-center justify-center text-3xl font-bold text-[#01A89E]">
                  {(c.display_name || "?")[0]?.toUpperCase()}
                </div>
              </div>
            )}

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 pointer-events-none" />

            {/* Close button */}
            <button
              onClick={() => onOpenChange(false)}
              className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors z-10"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Like button */}
            <button
              onClick={() => setLiked(!liked)}
              className={`absolute top-3 left-3 h-8 w-8 rounded-full flex items-center justify-center transition-colors z-10 ${liked ? "bg-red-500 text-white" : "bg-black/40 text-white hover:bg-black/60"}`}
            >
              <Heart className={`h-4 w-4 ${liked ? "fill-white" : ""}`} />
            </button>

            {/* Status badges */}
            <div className="absolute top-12 left-3 flex flex-col gap-1.5 z-10">
              {c.is_premium && (
                <Badge className="bg-[#F5A623]/90 text-white border-0 text-[10px] px-2 py-0.5">
                  <Award className="h-3 w-3 mr-1" /> Premium
                </Badge>
              )}
            </div>

            {/* Name overlay */}
            <div className="absolute bottom-3 left-3 right-3 z-10">
              <h1 className="text-xl font-bold text-white leading-tight">{c.display_name || "Sin nombre"}</h1>
              <p className="text-white/80 text-sm mt-0.5">{c.job_category || "Sin categoría"}</p>
            </div>
          </div>

          {/* Content */}
          <div className="px-4 py-4 space-y-4">
            {/* Quick stats */}
            <div className="flex items-center gap-3 flex-wrap">
              <Badge className={`${avail.color} border-0 text-xs px-2.5 py-1`}>
                <CheckCircle className="h-3 w-3 mr-1" /> {avail.label}
              </Badge>
              {c.rating > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-bold text-sm">{c.rating}</span>
                </div>
              )}
              {c.location && (
                <div className="flex items-center gap-1 text-muted-foreground text-xs">
                  <MapPin className="h-3 w-3" /> {c.location}
                </div>
              )}
              {c.experience_years > 0 && (
                <div className="flex items-center gap-1 text-muted-foreground text-xs">
                  <Briefcase className="h-3 w-3" /> {c.experience_years} años
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 h-11 rounded-xl font-semibold text-sm">
                <MessageCircle className="h-4 w-4 mr-1.5" /> Contactar
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-11 w-11 rounded-xl shrink-0"
                onClick={() => window.open(`/profile/${c.id}`, '_blank')}
                title="Abrir perfil público"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>

            {/* Bio */}
            {c.bio && (
              <Card className="border-slate-200/80">
                <CardContent className="p-3.5">
                  <h3 className="font-semibold text-sm mb-1.5 text-foreground">Sobre mí</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{c.bio}</p>
                </CardContent>
              </Card>
            )}

            {/* Specialties */}
            {specialties.length > 0 && (
              <Card className="border-slate-200/80">
                <CardContent className="p-3.5">
                  <h3 className="font-semibold text-sm mb-2 text-foreground">Especialidades</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {specialties.map((s: string, i: number) => (
                      <Badge key={i} variant="secondary" className="rounded-full px-2.5 py-0.5 text-[11px] bg-[#01A89E]/10 text-[#01A89E] border-0">{s}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Details grid */}
            <Card className="border-slate-200/80">
              <CardContent className="p-3.5">
                <h3 className="font-semibold text-sm mb-2 text-foreground">Detalles</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                  <DetailItem label="Categoría" value={c.job_category} />
                  <DetailItem label="Experiencia" value={c.experience_years ? `${c.experience_years} años` : null} />
                  <DetailItem label="Ubicación" value={c.location} />
                  <DetailItem label="Nivel" value={c.level ? `Nivel ${c.level}` : null} />
                  <DetailItem label="Puntos" value={c.points ? `${c.points} pts` : null} />
                  <DetailItem label="Valoración" value={c.rating ? `${c.rating}/5` : null} icon={<Star className="h-3 w-3 fill-yellow-400 text-yellow-400 inline ml-0.5" />} />
                  <DetailItem label="Email" value={c.email} />
                  <DetailItem label="Teléfono" value={c.phone} />
                </div>
              </CardContent>
            </Card>

            {/* Languages */}
            {languages.length > 0 && (
              <Card className="border-slate-200/80">
                <CardContent className="p-3.5">
                  <h3 className="font-semibold text-sm mb-2 flex items-center gap-1.5 text-foreground">
                    <Globe className="h-3.5 w-3.5 text-[#01A89E]" /> Idiomas
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {languages.map((l: string, i: number) => (
                      <Badge key={i} variant="outline" className="rounded-full text-[11px] px-2.5 py-0.5">{l}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Contract types */}
            {contractTypes.length > 0 && (
              <Card className="border-slate-200/80">
                <CardContent className="p-3.5">
                  <h3 className="font-semibold text-sm mb-2 flex items-center gap-1.5 text-foreground">
                    <Clock className="h-3.5 w-3.5 text-[#01A89E]" /> Tipo de contrato buscado
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {contractTypes.map((ct: string, i: number) => (
                      <Badge key={i} variant="secondary" className="rounded-full text-[11px] px-2.5 py-0.5">{ct}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Portfolio images */}
            {portfolioImages.length > 0 && (
              <Card className="border-slate-200/80">
                <CardContent className="p-3.5">
                  <h3 className="font-semibold text-sm mb-2 flex items-center gap-1.5 text-foreground">
                    <ImageIcon className="h-3.5 w-3.5 text-[#01A89E]" /> Portfolio ({portfolioImages.length}/3)
                  </h3>
                  <div className="grid grid-cols-3 gap-1.5">
                    {portfolioImages.map((img: string, i: number) => (
                      <button
                        key={i}
                        onClick={() => setActiveImage(img)}
                        className="aspect-square rounded-lg overflow-hidden border bg-slate-50 hover:opacity-80 transition-opacity"
                      >
                        <img src={img} alt={`Portfolio ${i + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Status badges */}
            <div className="flex flex-wrap gap-1.5 pt-1 pb-2">
              {c.is_active && <Badge className="bg-emerald-50 text-emerald-700 border-0 text-[10px]">Activo</Badge>}
              {c.is_premium && <Badge className="bg-[#F5A623]/10 text-[#F5A623] border-0 text-[10px]">Premium</Badge>}
              {c.is_admin && <Badge className="bg-red-50 text-red-600 border-0 text-[10px]">Admin</Badge>}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Full image lightbox */}
      {activeImage && (
        <Dialog open={!!activeImage} onOpenChange={() => setActiveImage(null)}>
          <DialogContent className="max-w-lg p-1 bg-black border-0">
            <button onClick={() => setActiveImage(null)} className="absolute top-2 right-2 z-50 h-8 w-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80">
              <X className="h-4 w-4" />
            </button>
            <img src={activeImage} alt="Portfolio" className="w-full rounded-lg" />
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

function DetailItem({ label, value, icon }: { label: string; value: any; icon?: React.ReactNode }) {
  if (!value) return <div />
  return (
    <div>
      <span className="text-muted-foreground text-[10px] block leading-tight">{label}</span>
      <span className="font-medium text-xs text-foreground">{value}{icon}</span>
    </div>
  )
}
