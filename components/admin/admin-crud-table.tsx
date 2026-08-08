"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import {
  Pencil, Trash2, Plus, Search, Upload, Video, Image as ImageIcon,
  X, Loader2, CheckCircle, AlertCircle, User, Play, Eye
} from "lucide-react"
import { mutate } from "swr"
import { toast } from "sonner"

export interface ColumnDef {
  key: string
  label: string
  type?: "text" | "number" | "boolean" | "textarea" | "select" | "json" | "badge" | "category" | "subcategories" | "avatar" | "video" | "images" | "password"
  options?: { value: string; label: string }[]
  editable?: boolean
  render?: (value: any, row: any) => React.ReactNode
  width?: string
  createOnly?: boolean
  maxImages?: number
  videoConfig?: { profileType: "worker" | "business", playbackIdKey?: string, statusKey?: string }
}

// Shared categories cache
let categoriesCache: any[] | null = null
function useCategories() {
  const [cats, setCats] = useState<any[]>(categoriesCache || [])
  useEffect(() => {
    if (categoriesCache) return
    fetch("/api/categories").then(r => r.json()).then(d => {
      const loaded: any[] = d.data || []
      categoriesCache = loaded
      setCats(loaded)
    }).catch(() => {})
  }, [])
  return cats
}

// ===== Avatar Upload Field =====
function AvatarField({ value, onChange, userId }: { value: string, onChange: (url: string) => void, userId?: string }) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) { toast.error("Selecciona una imagen"); return }
    if (file.size > 5 * 1024 * 1024) { toast.error("Max 5MB"); return }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", "avatar")
      if (userId) formData.append("userId", userId)
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      if (!res.ok) throw new Error("Upload failed")
      const { url } = await res.json()
      onChange(url)
      toast.success("Avatar actualizado")
    } catch {
      toast.error("Error al subir la imagen")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div className="relative h-16 w-16 rounded-full bg-slate-100 overflow-hidden border-2 border-slate-200 flex items-center justify-center shrink-0">
          {value ? (
            <img src={value} alt="Avatar" className="h-full w-full object-cover" />
          ) : (
            <User className="h-6 w-6 text-slate-400" />
          )}
          {uploading && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Loader2 className="h-5 w-5 text-white animate-spin" />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={() => inputRef.current?.click()} disabled={uploading}>
            <Upload className="h-3 w-3 mr-1" /> Cambiar foto
          </Button>
          {value && (
            <Button type="button" variant="ghost" size="sm" className="h-7 text-xs text-destructive" onClick={() => onChange("")}>
              <X className="h-3 w-3 mr-1" /> Eliminar
            </Button>
          )}
        </div>
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
      <Input type="text" value={value || ""} onChange={e => onChange(e.target.value)} placeholder="O pega una URL..." className="text-xs h-7" />
    </div>
  )
}

// ===== Video Upload Field =====
function VideoField({ value, onChange, playbackId, videoStatus, profileType, userId }: {
  value: string, onChange: (url: string) => void, playbackId?: string, videoStatus?: string,
  profileType: "worker" | "business", userId?: string
}) {
  const [status, setStatus] = useState(videoStatus || "none")
  const [currentPlaybackId, setCurrentPlaybackId] = useState(playbackId || "")
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const pollRef = useRef<NodeJS.Timeout | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (status !== "processing") return
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/mux/status?type=${profileType}${userId ? `&userId=${userId}` : ""}`)
        const data = await res.json()
        if (data.status === "ready" && data.playbackId) {
          setStatus("ready")
          setCurrentPlaybackId(data.playbackId)
          onChange(`https://stream.mux.com/${data.playbackId}.m3u8`)
          toast.success("Video procesado")
          if (pollRef.current) clearInterval(pollRef.current)
        } else if (data.status === "error") {
          setStatus("error")
          if (pollRef.current) clearInterval(pollRef.current)
        }
      } catch {}
    }, 3000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [status, profileType, userId, onChange])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("video/")) { toast.error("Selecciona un video"); return }
    if (file.size > 200 * 1024 * 1024) { toast.error("Max 200MB"); return }

    setUploading(true); setProgress(0); setStatus("uploading")
    try {
      const res = await fetch("/api/mux/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileType, targetUserId: userId }),
      })
      if (!res.ok) throw new Error("Upload init failed")
      const { uploadUrl } = await res.json()

      const xhr = new XMLHttpRequest()
      xhr.upload.addEventListener("progress", (ev) => {
        if (ev.lengthComputable) setProgress(Math.round((ev.loaded / ev.total) * 100))
      })
      await new Promise<void>((resolve, reject) => {
        xhr.addEventListener("load", () => xhr.status < 300 ? resolve() : reject())
        xhr.addEventListener("error", () => reject())
        xhr.open("PUT", uploadUrl)
        xhr.send(file)
      })
      setStatus("processing")
      setUploading(false)
      toast.success("Video subido, procesando...")
    } catch {
      toast.error("Error al subir el video")
      setStatus("error"); setUploading(false)
    }
  }

  const thumbnail = currentPlaybackId
    ? `https://image.mux.com/${currentPlaybackId}/thumbnail.webp?width=320&height=180&fit_mode=smartcrop`
    : null

  return (
    <div className="space-y-2">
      {/* Ready - show thumbnail */}
      {status === "ready" && thumbnail && (
        <div className="relative rounded-lg overflow-hidden bg-black aspect-video max-w-[280px]">
          <img src={thumbnail} alt="Video" className="w-full h-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
              <Play className="h-5 w-5 text-white" fill="white" />
            </div>
          </div>
          <Badge className="absolute top-1.5 left-1.5 bg-emerald-500 text-white text-[9px] border-0">
            <CheckCircle className="h-2.5 w-2.5 mr-0.5" /> Listo
          </Badge>
          <Button size="icon" variant="destructive" className="absolute top-1.5 right-1.5 h-5 w-5" onClick={() => { setStatus("none"); setCurrentPlaybackId(""); onChange("") }}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Processing */}
      {status === "processing" && (
        <div className="border-2 border-dashed rounded-lg p-4 text-center bg-amber-50/50">
          <Loader2 className="h-6 w-6 text-amber-600 animate-spin mx-auto mb-2" />
          <p className="text-xs font-medium text-amber-700">Procesando video con Mux...</p>
          <p className="text-[10px] text-amber-600">1-2 minutos</p>
        </div>
      )}

      {/* Uploading */}
      {status === "uploading" && uploading && (
        <div className="border-2 border-dashed rounded-lg p-4 text-center bg-blue-50/50">
          <Upload className="h-6 w-6 text-blue-600 mx-auto mb-2" />
          <p className="text-xs font-medium text-blue-700">Subiendo... {progress}%</p>
          <Progress value={progress} className="h-1.5 mt-2 max-w-[200px] mx-auto" />
        </div>
      )}

      {/* Empty / Error */}
      {(status === "none" || status === "error") && !uploading && (
        <div
          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-slate-50 transition-colors ${status === "error" ? "border-red-300 bg-red-50/50" : "border-slate-200"}`}
          onClick={() => inputRef.current?.click()}
        >
          {status === "error" ? (
            <AlertCircle className="h-6 w-6 text-red-500 mx-auto mb-1" />
          ) : (
            <Video className="h-6 w-6 text-slate-400 mx-auto mb-1" />
          )}
          <p className="text-xs font-medium">{status === "error" ? "Error - Reintentar" : "Subir Video Reel"}</p>
          <p className="text-[10px] text-slate-400">MP4, MOV, WebM (max 200MB)</p>
        </div>
      )}

      <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={handleUpload} />
      <Input type="text" value={value || ""} onChange={e => onChange(e.target.value)} placeholder="O pega URL de video..." className="text-xs h-7" />
    </div>
  )
}

// ===== Portfolio Images Field =====
function ImagesField({ value, onChange, maxImages = 5, userId }: {
  value: string[], onChange: (urls: string[]) => void, maxImages?: number, userId?: string
}) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const images = Array.isArray(value) ? value.filter(Boolean) : []

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (images.length + files.length > maxImages) {
      toast.error(`Maximo ${maxImages} imagenes`)
      return
    }
    setUploading(true)
    const newUrls: string[] = []
    for (const file of files) {
      if (!file.type.startsWith("image/")) continue
      if (file.size > 5 * 1024 * 1024) continue
      try {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("type", "portfolio")
        if (userId) formData.append("userId", userId)
        const res = await fetch("/api/upload", { method: "POST", body: formData })
        if (res.ok) {
          const { url } = await res.json()
          newUrls.push(url)
        }
      } catch {}
    }
    if (newUrls.length > 0) {
      onChange([...images, ...newUrls])
      toast.success(`${newUrls.length} imagen(es) subida(s)`)
    }
    setUploading(false)
    if (inputRef.current) inputRef.current.value = ""
  }

  const removeImage = (idx: number) => {
    onChange(images.filter((_, i) => i !== idx))
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        {images.map((url, idx) => (
          <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-slate-100 border group">
            <img src={url} alt={`Portfolio ${idx + 1}`} className="h-full w-full object-cover" />
            <Button size="icon" variant="destructive" className="absolute top-0.5 right-0.5 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeImage(idx)}>
              <X className="h-3 w-3" />
            </Button>
            <Badge className="absolute bottom-0.5 left-0.5 bg-black/60 text-white text-[8px] border-0">{idx + 1}/{maxImages}</Badge>
          </div>
        ))}
        {images.length < maxImages && (
          <div
            className="aspect-square rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors"
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 text-slate-400 animate-spin" />
            ) : (
              <>
                <ImageIcon className="h-5 w-5 text-slate-400 mb-1" />
                <span className="text-[9px] text-slate-400">Anadir</span>
              </>
            )}
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
      <p className="text-[10px] text-slate-400">{images.length}/{maxImages} imagenes (max 5MB cada una)</p>
    </div>
  )
}


// ===== MAIN COMPONENT =====
interface Props {
  title: string
  icon: React.ReactNode
  data: any[]
  columns: ColumnDef[]
  /**
   * Columnas de la vista de tabla (escritorio). Sin esto la sección se lista
   * como tarjetas apiladas, que en un panel de administración cuesta comparar:
   * la tabla enseña los mismos registros en filas y columnas.
   *
   * En móvil se siguen usando las tarjetas: una tabla de ocho columnas en una
   * pantalla de teléfono no se lee.
   */
  tableColumns?: { key: string; label: string; render?: (value: any, row: any) => React.ReactNode }[]
  endpoint: string
  swrKey: string
  searchPlaceholder?: string
  search?: string
  onSearchChange?: (v: string) => void
  emptyIcon?: React.ReactNode
  emptyText?: string
  canCreate?: boolean
  createDefaults?: Record<string, any>
  onPreview?: (row: any) => void
}

export function AdminCrudTable({
  tableColumns,
  title, icon, data, columns, endpoint, swrKey,
  searchPlaceholder = "Buscar...", search, onSearchChange,
  emptyIcon, emptyText = "No hay datos", canCreate = true, createDefaults = {},
  onPreview,
}: Props) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [formData, setFormData] = useState<any>({})
  const [isNew, setIsNew] = useState(false)
  const [loading, setLoading] = useState(false)
  const hasCategory = columns.some(c => c.type === "category")
  const dbCategories = useCategories()
  void hasCategory

  const editableColumns = columns.filter(c => c.editable !== false)
  // Columns to show in dialog (includes read-only fields like email)
  const dialogColumns = columns.filter(c => c.editable !== undefined)

  const openCreate = () => {
    const defaults: any = { ...createDefaults }
    editableColumns.forEach(c => {
      if (!(c.key in defaults)) {
        defaults[c.key] = c.type === "boolean" ? true : c.type === "number" ? 0 : c.type === "images" ? [] : ""
      }
    })
    setFormData(defaults)
    setIsNew(true)
    setEditOpen(true)
  }

  const openEdit = (row: any) => {
    setFormData({ ...row })
    setIsNew(false)
    setEditOpen(true)
  }

  const openDelete = (row: any) => {
    setFormData(row)
    setDeleteOpen(true)
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const method = isNew ? "POST" : "PATCH"
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      const result = await res.json()
      if (!res.ok || result.error) {
        toast.error(result.error || "Error al guardar")
        return
      }
      toast.success(isNew ? "Creado correctamente" : "Guardado correctamente")
      mutate(swrKey)
      setEditOpen(false)
    } catch (err) {
      toast.error("Error de conexion")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setLoading(true)
    try {
      await fetch(endpoint, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: formData.id }),
      })
      mutate(swrKey)
      setDeleteOpen(false)
    } finally {
      setLoading(false)
    }
  }

  const updateField = (key: string, value: any) => {
    setFormData((p: any) => ({ ...p, [key]: value }))
  }

  // Build a visual row preview with avatar/video thumbnail
  const renderRowPreview = (row: any) => {
    const avatarCol = columns.find(c => c.type === "avatar")
    const videoCol = columns.find(c => c.type === "video")
    const imagesCol = columns.find(c => c.type === "images")
    const avatarUrl = avatarCol ? row[avatarCol.key] : null
    const playbackIdKey = videoCol?.videoConfig?.playbackIdKey || "mux_playback_id"
    const playbackId = row[playbackIdKey]
    const portfolioImages = imagesCol ? row[imagesCol.key] : null
    const videoThumbnail = playbackId
      ? `https://image.mux.com/${playbackId}/thumbnail.webp?width=80&height=80&fit_mode=smartcrop`
      : null

    return (
      <div className="flex items-center gap-2.5">
        {/* Avatar */}
        {avatarCol && (
          <div className="h-9 w-9 rounded-full bg-slate-100 overflow-hidden border flex items-center justify-center shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <User className="h-4 w-4 text-slate-300" />
            )}
          </div>
        )}

        {/* Name + key info */}
        <div className="flex-1 min-w-0 overflow-hidden">
          {/* Line 1: Name from render columns */}
          <div className="flex items-center gap-1.5">
            {columns.filter(col => col.render && col.type !== "avatar" && col.type !== "video" && col.type !== "images").slice(0, 1).map(col => (
              <span key={col.key} className="truncate">{col.render!(row[col.key], row)}</span>
            ))}
            {/* Key info: email or location */}
            {row.email && <span className="text-[11px] text-slate-400 truncate hidden sm:inline">{row.email}</span>}
          </div>
          {/* Line 2: Status badges - max 3 visible */}
          <div className="flex items-center gap-1 mt-0.5 overflow-hidden">
            {columns.filter(col => col.type === "boolean" && row[col.key]).slice(0, 3).map(col => (
              <Badge key={col.key} className="text-[9px] px-1.5 py-0 bg-emerald-50 text-emerald-700 border-0 shrink-0">{col.label}</Badge>
            ))}
            {row.job_category && <Badge className="text-[9px] px-1.5 py-0 bg-amber-50 text-amber-700 border-0 shrink-0 truncate max-w-[120px]">{row.job_category}</Badge>}
            {row.subscription_plan && <Badge className="text-[9px] px-1.5 py-0 bg-blue-50 text-blue-700 border-0 shrink-0">{row.subscription_plan}</Badge>}
          </div>
        </div>

        {/* Video mini thumbnail */}
        {videoThumbnail && (
          <div className="h-9 w-9 rounded-md bg-black overflow-hidden border shrink-0 relative">
            <img src={videoThumbnail} alt="Video" className="h-full w-full object-cover" />
            <Play className="h-2.5 w-2.5 text-white absolute bottom-0.5 right-0.5" fill="white" />
          </div>
        )}

        {/* Portfolio mini */}
        {Array.isArray(portfolioImages) && portfolioImages.length > 0 && (
          <div className="flex -space-x-1">
            {portfolioImages.slice(0, 3).map((img: string, i: number) => (
              <div key={i} className="h-7 w-7 rounded border-2 border-white overflow-hidden bg-slate-100">
                <img src={img} alt="" className="h-full w-full object-cover" />
              </div>
            ))}
            {portfolioImages.length > 3 && (
              <div className="h-7 w-7 rounded border-2 border-white bg-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-500">+{portfolioImages.length - 3}</div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-lg font-bold text-slate-800">{title}</h2>
          <Badge variant="secondary" className="text-xs">{data.length}</Badge>
        </div>
        <div className="flex items-center gap-2">
          {onSearchChange && (
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input value={search} onChange={e => onSearchChange(e.target.value)} placeholder={searchPlaceholder} className="pl-8 h-8 w-48 text-xs" />
            </div>
          )}
          {canCreate && (
            <Button onClick={openCreate} size="sm" className="h-8 bg-[#F5A623] hover:bg-[#e0951f] text-white">
              <Plus className="h-3.5 w-3.5 mr-1" /> Crear
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      {data.length === 0 ? (
        <Card className="bg-white">
          <CardContent className="p-10 text-center">
            {emptyIcon}
            <p className="text-sm text-slate-500 mt-2">{emptyText}</p>
          </CardContent>
        </Card>
      ) : (
        <>
        {/* Tabla, sólo en escritorio. */}
        {tableColumns && tableColumns.length > 0 && (
          <div className="hidden md:block overflow-x-auto rounded-lg border bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50">
                  {tableColumns.map((c) => (
                    <th key={c.key} className="px-3 py-2.5 text-left text-[12px] font-semibold uppercase tracking-wide text-slate-500">
                      {c.label}
                    </th>
                  ))}
                  <th className="px-3 py-2.5 text-right text-[12px] font-semibold uppercase tracking-wide text-slate-500">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.map((row: any) => (
                  <tr key={row.id} className="border-b last:border-0 hover:bg-slate-50/60">
                    {tableColumns.map((c) => (
                      <td key={c.key} className="px-3 py-2.5 align-middle text-slate-700">
                        {c.render ? c.render(row[c.key], row) : (row[c.key] ?? "—")}
                      </td>
                    ))}
                    <td className="px-3 py-2.5 text-right whitespace-nowrap">
                      {onPreview && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-[#01A89E]" onClick={() => onPreview(row)} title="Ver ficha">
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(row)} title="Editar"><Pencil className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => openDelete(row)} title="Eliminar"><Trash2 className="h-3 w-3" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className={`space-y-2 ${tableColumns && tableColumns.length > 0 ? "md:hidden" : ""}`}>
          {data.map((row: any) => (
            <Card key={row.id} className="bg-white hover:shadow-sm transition-shadow">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">{renderRowPreview(row)}</div>
                  <div className="flex items-center gap-1 shrink-0">
                    {onPreview && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-[#01A89E] hover:text-[#018F86] hover:bg-[#01A89E]/10" onClick={() => onPreview(row)} title="Ver perfil">
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(row)}><Pencil className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => openDelete(row)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        </>
      )}

      {/* Edit / Create Dialog - wider for media */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isNew ? "Crear" : "Editar"} {title.toLowerCase()}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {dialogColumns.map(col => {
              if (!isNew && col.createOnly) return null
              
              // Read-only field (editable: false) - show as text during edit
              if (col.editable === false && !isNew) {
                return (
                  <div key={col.key}>
                    <Label className="text-xs text-muted-foreground">{col.label}</Label>
                    <div className="mt-1 px-3 py-2 bg-muted/50 rounded-md text-sm">
                      {formData[col.key] || <span className="text-muted-foreground italic">Sin datos</span>}
                    </div>
                  </div>
                )
              }

              // Avatar upload
              if (col.type === "avatar") {
                return (
                  <div key={col.key}>
                    <Label className="text-xs font-semibold mb-1.5 block">{col.label}</Label>
                    <AvatarField value={formData[col.key] || ""} onChange={v => updateField(col.key, v)} userId={formData.id} />
                  </div>
                )
              }

              // Video upload with Mux
              if (col.type === "video") {
                const cfg = col.videoConfig || { profileType: "worker" as const }
                return (
                  <div key={col.key}>
                    <Label className="text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                      <Video className="h-3.5 w-3.5 text-rose-500" /> {col.label}
                    </Label>
                    <VideoField
                      value={formData[col.key] || ""}
                      onChange={v => updateField(col.key, v)}
                      playbackId={formData[cfg.playbackIdKey || "mux_playback_id"]}
                      videoStatus={formData[cfg.statusKey || "video_status"]}
                      profileType={cfg.profileType}
                      userId={formData.id}
                    />
                  </div>
                )
              }

              // Portfolio images
              if (col.type === "images") {
                return (
                  <div key={col.key}>
                    <Label className="text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                      <ImageIcon className="h-3.5 w-3.5 text-blue-500" /> {col.label}
                    </Label>
                    <ImagesField
                      value={formData[col.key] || []}
                      onChange={v => updateField(col.key, v)}
                      maxImages={col.maxImages || 5}
                      userId={formData.id}
                    />
                  </div>
                )
              }

              if (col.type === "boolean") {
                return (
                  <div key={col.key} className="flex items-center justify-between">
                    <Label className="text-xs">{col.label}</Label>
                    <Switch checked={!!formData[col.key]} onCheckedChange={v => updateField(col.key, v)} />
                  </div>
                )
              }
              if (col.type === "select" && col.options) {
                return (
                  <div key={col.key}>
                    <Label className="text-xs">{col.label}</Label>
                    <Select value={formData[col.key] || ""} onValueChange={v => updateField(col.key, v)}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {col.options.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )
              }
              if (col.type === "category") {
                return (
                  <div key={col.key}>
                    <Label className="text-xs">{col.label}</Label>
                    <Select value={formData[col.key] || ""} onValueChange={v => updateField(col.key, v)}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                      <SelectContent className="max-h-64">
                        {dbCategories.map((cat: any) => (
                          <SelectGroup key={cat.id}>
                            <SelectLabel className="text-xs font-bold text-slate-700">{cat.name}</SelectLabel>
                            {(cat.subcategories || []).map((sub: any) => (
                              <SelectItem key={sub.id} value={sub.name}>{sub.name}</SelectItem>
                            ))}
                          </SelectGroup>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )
              }
              // Subcategories - shows subcategories based on selected job_category
              if (col.type === "subcategories") {
                const selectedCategory = formData.job_category || ""
                const matchedCat = dbCategories.find((cat: any) => cat.name === selectedCategory)
                const availableSubs = matchedCat?.subcategories || []
                const currentSpecs = Array.isArray(formData[col.key]) ? formData[col.key] : 
                  (typeof formData[col.key] === "string" && formData[col.key].startsWith("[") ? 
                    JSON.parse(formData[col.key]) : [])
                
                return (
                  <div key={col.key}>
                    <Label className="text-xs">{col.label}</Label>
                    {!selectedCategory ? (
                      <p className="text-xs text-slate-400 mt-1 italic">Selecciona primero una categoría profesional</p>
                    ) : availableSubs.length === 0 ? (
                      <p className="text-xs text-slate-400 mt-1 italic">No hay subcategorías para esta categoría</p>
                    ) : (
                      <div className="mt-2 space-y-1.5 max-h-40 overflow-y-auto border rounded-md p-2">
                        {availableSubs.map((sub: any) => {
                          const isSelected = currentSpecs.includes(sub.name)
                          return (
                            <label key={sub.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  const newSpecs = e.target.checked
                                    ? [...currentSpecs, sub.name]
                                    : currentSpecs.filter((s: string) => s !== sub.name)
                                  updateField(col.key, newSpecs)
                                }}
                                className="rounded border-slate-300"
                              />
                              <span className="text-xs">{sub.name}</span>
                            </label>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              }
              if (col.type === "textarea") {
                return (
                  <div key={col.key}>
                    <Label className="text-xs">{col.label}</Label>
                    <Textarea value={formData[col.key] || ""} onChange={e => updateField(col.key, e.target.value)} className="mt-1" rows={3} />
                  </div>
                )
              }
              if (col.type === "json") {
                return (
                  <div key={col.key}>
                    <Label className="text-xs">{col.label}</Label>
                    <Textarea
                      value={typeof formData[col.key] === "string" ? formData[col.key] : JSON.stringify(formData[col.key], null, 2)}
                      onChange={e => updateField(col.key, e.target.value)}
                      className="mt-1 font-mono text-xs" rows={3}
                    />
                  </div>
                )
              }
              return (
                <div key={col.key}>
                  <Label className="text-xs">{col.label}</Label>
                  <Input
                    type={col.type === "number" ? "number" : col.type === "password" ? "password" : "text"}
                    value={formData[col.key] ?? ""}
                    onChange={e => updateField(col.key, col.type === "number" ? parseFloat(e.target.value) || 0 : e.target.value)}
                    className="mt-1"
                    placeholder={col.type === "password" ? "Dejar vacío para no cambiar" : undefined}
                  />
                  {col.type === "password" && !isNew && (
                    <p className="text-[10px] text-muted-foreground mt-1">Solo rellena si deseas cambiar la contraseña</p>
                  )}
                </div>
              )
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} size="sm">Cancelar</Button>
            <Button onClick={handleSave} disabled={loading} size="sm" className="bg-[#F5A623] hover:bg-[#e0951f] text-white">
              {loading ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar registro</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">{"Esta accion no se puede deshacer."}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} size="sm">Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading} size="sm">
              {loading ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
