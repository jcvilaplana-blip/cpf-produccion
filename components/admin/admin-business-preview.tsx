"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Building2, CheckCircle, Globe, Mail, MapPin, Phone, Star } from "lucide-react"
import { formatLocation } from "@/lib/format-location"

/**
 * Ficha de un establecimiento para el panel de administración.
 *
 * La sección de Empresas tenía botón de editar y de borrar, pero no de ver: un
 * administrador que quisiera comprobar los datos de un local tenía que abrir el
 * formulario de edición, con el riesgo de guardar algo sin querer. Esta ficha
 * enseña lo mismo que el perfil público del establecimiento, en sólo lectura.
 */

interface BusinessPreviewProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  business: any | null
}

function lista(valor: any): any[] {
  if (Array.isArray(valor)) return valor
  if (typeof valor === "string") {
    try {
      const parsed = JSON.parse(valor)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

const PLANES: Record<string, string> = {
  "standard-business": "Plan Standard",
  "premium-business": "Plan Premium",
}

export function AdminBusinessPreview({ open, onOpenChange, business }: BusinessPreviewProps) {
  if (!business) return null
  const b = business
  const fotos = lista(b.photos)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">Ficha del establecimiento</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* Cabecera */}
          <Card className="border-slate-200/80">
            <CardContent className="flex items-center gap-3 p-3.5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-slate-100">
                {b.company_logo_url ? (
                  <img src={b.company_logo_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Building2 className="h-6 w-6 text-slate-300" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold">{b.company_name || "Sin nombre"}</p>
                <p className="truncate text-[13px] text-muted-foreground">{b.business_type || "Sin tipo"}</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {b.verified && (
                    <Badge className="bg-emerald-100 text-emerald-700 text-[11px]">
                      <CheckCircle className="mr-1 h-3 w-3" /> Verificada
                    </Badge>
                  )}
                  {b.is_premium && <Badge className="bg-amber-100 text-amber-700 text-[11px]">Premium</Badge>}
                  {b.subscription_plan && (
                    <Badge variant="outline" className="text-[11px]">
                      {PLANES[b.subscription_plan] || b.subscription_plan}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {b.company_description && (
            <Card className="border-slate-200/80">
              <CardContent className="p-3.5">
                <h3 className="mb-1.5 text-sm font-semibold">Descripción</h3>
                <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-muted-foreground">
                  {b.company_description}
                </p>
              </CardContent>
            </Card>
          )}

          {b.service_description && (
            <Card className="border-slate-200/80">
              <CardContent className="p-3.5">
                <h3 className="mb-1.5 text-sm font-semibold">Servicio</h3>
                <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-muted-foreground">
                  {b.service_description}
                </p>
              </CardContent>
            </Card>
          )}

          <Card className="border-slate-200/80">
            <CardContent className="p-3.5">
              <h3 className="mb-2 text-sm font-semibold">Datos</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                <Dato label="Email" value={b.email} icon={<Mail className="mr-1 inline h-3 w-3" />} />
                <Dato label="Teléfono" value={b.phone} icon={<Phone className="mr-1 inline h-3 w-3" />} />
                <Dato label="Web" value={b.website} icon={<Globe className="mr-1 inline h-3 w-3" />} />
                <Dato label="Ciudad" value={b.city} icon={<MapPin className="mr-1 inline h-3 w-3" />} />
                <Dato label="Dirección" value={formatLocation(b.address) || b.address} />
                <Dato label="Valoración" value={b.rating ? `${Number(b.rating).toFixed(1)}/5` : null} icon={<Star className="mr-1 inline h-3 w-3 fill-yellow-400 text-yellow-400" />} />
                <Dato label="Puntos" value={b.points != null ? `${b.points} ptos` : null} />
                <Dato label="Nivel" value={b.level ? `Nivel ${b.level}` : null} />
                <Dato label="Créditos Flash" value={b.flash_credits != null ? String(b.flash_credits) : null} />
                <Dato label="Créditos Destacar" value={b.highlight_credits != null ? String(b.highlight_credits) : null} />
                <Dato
                  label="Suscripción hasta"
                  value={b.subscription_expires_at ? new Date(b.subscription_expires_at).toLocaleDateString("es-ES") : null}
                />
                <Dato label="Fotos" value={fotos.length ? String(fotos.length) : null} />
              </div>
            </CardContent>
          </Card>

          {fotos.length > 0 && (
            <Card className="border-slate-200/80">
              <CardContent className="p-3.5">
                <h3 className="mb-2 text-sm font-semibold">Fotos del negocio</h3>
                <div className="grid grid-cols-3 gap-2">
                  {fotos.slice(0, 6).map((url: string, i: number) => (
                    <img key={i} src={url} alt="" className="aspect-square w-full rounded-lg object-cover" />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {b.video_url && (
            <Card className="border-slate-200/80">
              <CardContent className="p-3.5">
                <h3 className="mb-2 text-sm font-semibold">Vídeo</h3>
                {/* `#t=0.1` fuerza a pintar el primer fotograma como portada. */}
                <video
                  src={`${b.video_url}#t=0.1`}
                  controls
                  playsInline
                  preload="metadata"
                  className="aspect-video w-full rounded-lg bg-black"
                />
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Dato({ label, value, icon }: { label: string; value: any; icon?: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <span className="block text-[10px] leading-tight text-muted-foreground">{label}</span>
      <span className="block truncate text-[13px] text-foreground">
        {icon}
        {value || "—"}
      </span>
    </div>
  )
}
