"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Loader2, Save, FileText, Shield, Settings, ExternalLink } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface SiteSetting {
  key: string
  value: string | null
}

export function AdminSettingsSection() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [settings, setSettings] = useState<Record<string, string>>({
    app_name: "CamareroPorFavor",
    contact_email: "soporte@camareroporfavor.com",
    maintenance_mode: "false",
    terms_content: "",
    privacy_content: "",
  })
  const [activeTab, setActiveTab] = useState("general")

  const supabase = createClient()

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("key, value")
      
      if (error) throw error
      
      if (data) {
        const settingsMap: Record<string, string> = {}
        data.forEach((item: SiteSetting) => {
          settingsMap[item.key] = item.value || ""
        })
        setSettings(prev => ({ ...prev, ...settingsMap }))
      }
    } catch (err) {
      console.error("Error loading settings:", err)
      toast.error("Error al cargar la configuración")
    } finally {
      setIsLoading(false)
    }
  }

  const saveSetting = async (key: string, value: string) => {
    setIsSaving(true)
    try {
      const { error } = await supabase
        .from("site_settings")
        .upsert({ 
          key, 
          value, 
          updated_at: new Date().toISOString() 
        }, { 
          onConflict: "key" 
        })
      
      if (error) throw error
      
      setSettings(prev => ({ ...prev, [key]: value }))
      toast.success("Configuración guardada")
    } catch (err) {
      console.error("Error saving setting:", err)
      toast.error("Error al guardar la configuración")
    } finally {
      setIsSaving(false)
    }
  }

  const saveAllGeneral = async () => {
    setIsSaving(true)
    try {
      const generalSettings = ["app_name", "contact_email", "maintenance_mode"]
      for (const key of generalSettings) {
        await supabase
          .from("site_settings")
          .upsert({ 
            key, 
            value: settings[key], 
            updated_at: new Date().toISOString() 
          }, { 
            onConflict: "key" 
          })
      }
      toast.success("Configuración general guardada")
    } catch (err) {
      console.error("Error saving settings:", err)
      toast.error("Error al guardar la configuración")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-[#F5A623]" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="general" className="text-xs gap-1.5">
            <Settings className="w-3.5 h-3.5" />
            General
          </TabsTrigger>
          <TabsTrigger value="terms" className="text-xs gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            Términos
          </TabsTrigger>
          <TabsTrigger value="privacy" className="text-xs gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            Privacidad
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card className="bg-white">
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold mb-4">Configuración General</h3>
              <div className="space-y-4">
                <div>
                  <Label className="text-xs">Nombre de la App</Label>
                  <Input 
                    value={settings.app_name} 
                    onChange={(e) => setSettings(prev => ({ ...prev, app_name: e.target.value }))}
                    className="mt-1" 
                  />
                </div>
                <div>
                  <Label className="text-xs">URL del sitio</Label>
                  <Input 
                    defaultValue="https://camareroporfavor.com" 
                    className="mt-1" 
                    disabled 
                  />
                </div>
                <div>
                  <Label className="text-xs">Email de contacto</Label>
                  <Input 
                    value={settings.contact_email}
                    onChange={(e) => setSettings(prev => ({ ...prev, contact_email: e.target.value }))}
                    className="mt-1" 
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Modo mantenimiento</Label>
                  <Switch 
                    checked={settings.maintenance_mode === "true"}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, maintenance_mode: checked ? "true" : "false" }))}
                  />
                </div>
              </div>
              <Button 
                className="mt-4 bg-[#F5A623] hover:bg-[#e0951f] text-white" 
                size="sm"
                onClick={saveAllGeneral}
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Guardar cambios
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Terms & Conditions */}
        <TabsContent value="terms">
          <Card className="bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold">Términos y Condiciones</h3>
                <a 
                  href="/terms" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-[#F5A623] hover:underline flex items-center gap-1"
                >
                  Ver página <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Edita el contenido HTML de los términos y condiciones. Puedes usar etiquetas como &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;.
              </p>
              <Textarea 
                value={settings.terms_content}
                onChange={(e) => setSettings(prev => ({ ...prev, terms_content: e.target.value }))}
                className="min-h-[400px] font-mono text-xs"
                placeholder="<h2>1. Aceptación de los Términos</h2>
<p>Al acceder y utilizar la plataforma...</p>"
              />
              <div className="flex items-center gap-2 mt-4">
                <Button 
                  className="bg-[#F5A623] hover:bg-[#e0951f] text-white" 
                  size="sm"
                  onClick={() => saveSetting("terms_content", settings.terms_content)}
                  disabled={isSaving}
                >
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Guardar Términos
                </Button>
                <p className="text-[10px] text-muted-foreground">
                  Si dejas vacío, se usará el texto por defecto
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy Policy */}
        <TabsContent value="privacy">
          <Card className="bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold">Política de Privacidad</h3>
                <a 
                  href="/privacy" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-[#F5A623] hover:underline flex items-center gap-1"
                >
                  Ver página <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Edita el contenido HTML de la política de privacidad. Puedes usar etiquetas como &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;.
              </p>
              <Textarea 
                value={settings.privacy_content}
                onChange={(e) => setSettings(prev => ({ ...prev, privacy_content: e.target.value }))}
                className="min-h-[400px] font-mono text-xs"
                placeholder="<h2>1. Información que Recopilamos</h2>
<p>En CamareroPorFavor recopilamos diferentes tipos de información...</p>"
              />
              <div className="flex items-center gap-2 mt-4">
                <Button 
                  className="bg-[#F5A623] hover:bg-[#e0951f] text-white" 
                  size="sm"
                  onClick={() => saveSetting("privacy_content", settings.privacy_content)}
                  disabled={isSaving}
                >
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Guardar Política
                </Button>
                <p className="text-[10px] text-muted-foreground">
                  Si dejas vacío, se usará el texto por defecto
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
