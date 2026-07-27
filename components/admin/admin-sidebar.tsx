"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard, Users, Building2, FolderTree, MapPin, Crown, Globe,
  Languages, CreditCard, Settings, Video, Star, MessageCircle, Briefcase,
  ChevronDown, ChevronRight, Zap, Map, DollarSign, Plug, X, LogOut, Bell,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export type AdminSection =
  | "dashboard"
  | "candidates" | "businesses"
  | "jobs" | "flash"
  | "categories"
  | "videos" | "ratings"
  | "messages"
  | "notifications"
  | "map"
  | "plans"
  | "countries" | "cities"
  | "languages"
  | "payment-methods"
  | "apis"
  | "settings"

interface MenuGroup {
  label: string
  items: { id: AdminSection; label: string; icon: any }[]
}

const menuGroups: MenuGroup[] = [
  {
    label: "",
    items: [{ id: "dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Usuarios",
    items: [
      { id: "candidates", label: "Candidatos", icon: Users },
      { id: "businesses", label: "Empresas", icon: Building2 },
    ],
  },
  {
    label: "Ofertas",
    items: [
      { id: "jobs", label: "Empleos", icon: Briefcase },
      { id: "flash", label: "Ofertas Flash", icon: Zap },
    ],
  },
  {
    label: "Contenido",
    items: [
      { id: "categories", label: "Categorías", icon: FolderTree },
      { id: "videos", label: "Vídeos / Reels", icon: Video },
      { id: "ratings", label: "Reseñas", icon: Star },
      { id: "messages", label: "Mensajes", icon: MessageCircle },
      { id: "notifications", label: "Notificaciones", icon: Bell },
    ],
  },
  {
    label: "Mapa",
    items: [
      { id: "map", label: "Vista en Tiempo Real", icon: Map },
    ],
  },
  {
    label: "Suscripciones",
    items: [
      { id: "plans", label: "Ver Planes", icon: Crown },
    ],
  },
  {
    label: "Localización",
    items: [
      { id: "countries", label: "Países", icon: Globe },
      { id: "cities", label: "Ciudades / Provincias", icon: MapPin },
      { id: "languages", label: "Idiomas", icon: Languages },
    ],
  },
  {
    label: "Pagos",
    items: [
      { id: "payment-methods", label: "Métodos de Pago", icon: CreditCard },
    ],
  },
  {
    label: "Sistema",
    items: [
      { id: "apis", label: "APIs", icon: Plug },
      { id: "settings", label: "Configuración", icon: Settings },
    ],
  },
]

interface Props {
  active: AdminSection
  onSelect: (s: AdminSection) => void
  onLogout: () => void
  stats?: any
  mobile?: boolean
  onCloseMobile?: () => void
}

export function AdminSidebar({ active, onSelect, onLogout, stats, mobile, onCloseMobile }: Props) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const toggle = (label: string) => {
    setCollapsed(p => ({ ...p, [label]: !p[label] }))
  }

  const handleSelect = (id: AdminSection) => {
    onSelect(id)
    onCloseMobile?.()
  }

  return (
    <aside className={cn(
      "flex flex-col bg-[#028d84] text-white h-full",
      mobile ? "w-full" : "w-60 shrink-0"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-[#F5A623] flex items-center justify-center">
            <span className="text-sm font-bold text-white">V</span>
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight text-white">CamareroPorFavor</p>
            <p className="text-[10px] text-white/70">Panel Admin</p>
          </div>
        </div>
        {mobile && (
          <button onClick={onCloseMobile} className="p-1 rounded hover:bg-[#03afa4]">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5 scrollbar-hide">
        {menuGroups.map((group) => {
          const isGroupCollapsed = collapsed[group.label]
          const hasLabel = group.label !== ""
          return (
            <div key={group.label || "root"} className={hasLabel ? "mt-3" : ""}>
              {hasLabel && (
                <button
                  onClick={() => toggle(group.label)}
                  className="flex items-center justify-between w-full px-2 py-1.5 text-[10px] font-semibold text-white/60 uppercase tracking-wider hover:text-white transition-colors"
                >
                  <span>{group.label}</span>
                  {isGroupCollapsed ? (
                    <ChevronRight className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </button>
              )}
              {!isGroupCollapsed && group.items.map((item) => {
                const isActive = active === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={cn(
                      "flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-white transition-all",
                      isActive
                        ? "bg-[#F5A623] font-medium shadow-lg shadow-[#F5A623]/20"
                        : "hover:bg-[#03afa4]"
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                )
              })}
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-white/10">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-[#F5A623] text-white text-xs">A</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate text-white">Admin</p>
            <p className="text-[10px] text-white/70 truncate">soporte@camareroporfavor.com</p>
          </div>
          <button onClick={onLogout} className="p-1.5 rounded-md hover:bg-[#03afa4] transition-colors" title="Cerrar sesión">
            <LogOut className="h-4 w-4 text-white/80" />
          </button>
        </div>
      </div>
    </aside>
  )
}
