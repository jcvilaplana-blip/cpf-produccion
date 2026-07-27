"use client"

import { useRef, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { FolderTree, Pencil, Trash2, Plus, ChevronDown, ChevronRight, Upload, X } from "lucide-react"
import { mutate } from "swr"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

function CategoryIcon({ url, className }: { url?: string; className?: string }) {
  if (url) return <img src={url} alt="" className={cn("object-contain", className)} />
  return <FolderTree className={cn("text-teal-600", className)} />
}

// ===== Icon upload widget shared by category and subcategory forms =====
function IconUploadField({ value, onChange }: { value?: string; onChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) { toast.error("Selecciona una imagen"); return }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", "icon")
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      if (!res.ok) throw new Error("Upload failed")
      const data = await res.json()
      onChange(data.url)
      toast.success("Icono actualizado")
    } catch {
      toast.error("Error al subir el icono")
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <div>
      <Label className="text-xs">Icono</Label>
      <div className="mt-1.5 flex items-center gap-3">
        <div className="h-12 w-12 rounded-lg bg-teal-50 border flex items-center justify-center shrink-0 overflow-hidden">
          <CategoryIcon url={value} className="h-7 w-7" />
        </div>
        <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={() => inputRef.current?.click()} disabled={uploading}>
          <Upload className="h-3 w-3 mr-1" /> {uploading ? "Subiendo..." : "Subir icono"}
        </Button>
        {value && (
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onChange("")} title="Quitar icono">
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
      <p className="text-[10px] text-slate-400 mt-1">PNG, JPG o WebP. Se muestra en la home, en /categorias y en el registro.</p>
    </div>
  )
}

interface Props {
  categories: any[]
  swrKey: string
}

export function AdminCategories({ categories, swrKey }: Props) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [formData, setFormData] = useState<any>({})
  const [formType, setFormType] = useState<"category" | "subcategory">("category")
  const [isNew, setIsNew] = useState(false)
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const openCreateCategory = () => {
    setFormData({ name: "", slug: "", icon: "", sort_order: 0, role_type: "candidate" })
    setFormType("category")
    setIsNew(true)
    setEditOpen(true)
  }

  const openCreateSubcategory = (categoryId: string) => {
    setFormData({ name: "", slug: "", icon: "", sort_order: 0, category_id: categoryId })
    setFormType("subcategory")
    setIsNew(true)
    setEditOpen(true)
  }

  const openEdit = (item: any, type: "category" | "subcategory") => {
    // Strip nested/joined fields (e.g. `subcategories`) that aren't real
    // columns - sending them to Supabase makes the whole update fail.
    const { subcategories, ...rest } = item
    setFormData({ ...rest })
    setFormType(type)
    setIsNew(false)
    setEditOpen(true)
  }

  const openDelete = (item: any, type: "category" | "subcategory") => {
    setFormData(item)
    setFormType(type)
    setDeleteOpen(true)
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const method = isNew ? "POST" : "PATCH"
      const body = { ...formData, type: formType }
      const res = await fetch("/api/admin/categories", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || "Error al guardar")
        return
      }
      mutate(swrKey)
      toast.success("Guardado correctamente")
      setEditOpen(false)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setLoading(true)
    try {
      await fetch("/api/admin/categories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: formData.id, type: formType }),
      })
      mutate(swrKey)
      setDeleteOpen(false)
    } finally {
      setLoading(false)
    }
  }

  const totalSubs = categories.reduce((acc: number, cat: any) => acc + (cat.subcategories?.length || 0), 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FolderTree className="h-5 w-5 text-teal-600" />
          <h2 className="text-lg font-bold text-slate-800">Categorias</h2>
          <Badge variant="secondary" className="text-xs">{categories.length} cat, {totalSubs} sub</Badge>
        </div>
        <Button onClick={openCreateCategory} size="sm" className="h-8 bg-[#F48221] hover:bg-[#e0751f] text-white">
          <Plus className="h-3.5 w-3.5 mr-1" /> Crear Categoría
        </Button>
      </div>

      {categories.length === 0 ? (
        <Card className="bg-white">
          <CardContent className="p-10 text-center">
            <FolderTree className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No hay categorías</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {categories.map((cat: any) => {
            const subs = cat.subcategories || []
            const isExpanded = expanded.has(cat.id)
            return (
              <Card key={cat.id} className="bg-white hover:shadow-sm transition-shadow">
                <CardContent className="p-0">
                  <div className="flex items-center gap-3 p-3">
                    <button
                      onClick={() => toggleExpand(cat.id)}
                      className="h-7 w-7 rounded flex items-center justify-center hover:bg-slate-100 shrink-0"
                    >
                      {isExpanded ? <ChevronDown className="h-4 w-4 text-slate-500" /> : <ChevronRight className="h-4 w-4 text-slate-500" />}
                    </button>
                    <div className="h-8 w-8 rounded-lg bg-teal-100 flex items-center justify-center shrink-0 overflow-hidden">
                      <CategoryIcon url={cat.icon} className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold truncate max-w-[200px]" title={cat.name}>{cat.name}</span>
                        <Badge className="text-[9px] px-1.5 py-0 bg-teal-50 text-teal-700 border-0 shrink-0">{subs.length} sub</Badge>
                        <Badge className={cn(
                          "text-[9px] px-1.5 py-0 border-0 shrink-0",
                          cat.role_type === "business" ? "bg-orange-50 text-orange-700" : "bg-blue-50 text-blue-700"
                        )}>
                          {cat.role_type === "business" ? "Empresa" : "Candidato"}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-teal-600" onClick={() => openCreateSubcategory(cat.id)} title="Crear subcategoría">
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(cat, "category")}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => openDelete(cat, "category")}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  {isExpanded && subs.length > 0 && (
                    <div className="border-t px-3 pb-3 pt-2 ml-10 space-y-1">
                      {subs.map((sub: any) => (
                        <div key={sub.id} className="flex items-center justify-between py-1.5 px-3 rounded-md bg-slate-50 hover:bg-slate-100 transition-colors">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="h-6 w-6 rounded bg-white border flex items-center justify-center shrink-0 overflow-hidden">
                              <CategoryIcon url={sub.icon} className="h-3.5 w-3.5" />
                            </div>
                            <span className="text-xs font-medium truncate max-w-[220px]" title={sub.name}>{sub.name}</span>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEdit(sub, "subcategory")}>
                              <Pencil className="h-2.5 w-2.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => openDelete(sub, "subcategory")}>
                              <Trash2 className="h-2.5 w-2.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Edit / Create Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isNew ? "Crear" : "Editar"} {formType === "category" ? "categoría" : "subcategoría"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs">Nombre</Label>
              <Input value={formData.name || ""} onChange={e => setFormData((p: any) => ({ ...p, name: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Slug</Label>
              <Input value={formData.slug || ""} onChange={e => setFormData((p: any) => ({ ...p, slug: e.target.value }))} className="mt-1" placeholder="ej: hosteleria" />
            </div>
            {formType === "category" && (
              <div>
                <Label className="text-xs">Tipo</Label>
                <select
                  value={formData.role_type || "candidate"}
                  onChange={e => setFormData((p: any) => ({ ...p, role_type: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="candidate">Candidato</option>
                  <option value="business">Empresa</option>
                </select>
              </div>
            )}
            <IconUploadField value={formData.icon} onChange={(url) => setFormData((p: any) => ({ ...p, icon: url }))} />
            <div>
              <Label className="text-xs">Orden</Label>
              <Input type="number" value={formData.sort_order ?? 0} onChange={e => setFormData((p: any) => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))} className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} size="sm">Cancelar</Button>
            <Button onClick={handleSave} disabled={loading} size="sm" className="bg-[#F48221] hover:bg-[#e0751f] text-white">
              {loading ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar {formType === "category" ? "categoría" : "subcategoría"}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            {formType === "category"
              ? "Se eliminarán también todas las subcategorías asociadas. Esta acción no se puede deshacer."
              : "Esta acción no se puede deshacer."}
          </p>
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
