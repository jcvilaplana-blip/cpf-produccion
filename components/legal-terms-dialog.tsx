"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Label } from "@/components/ui/label"
import { Shield, FileText, Lock } from "lucide-react"

interface LegalTermsDialogProps {
  open: boolean
  onAccept: () => void
  onDecline?: () => void
}

export function LegalTermsDialog({ open, onAccept, onDecline }: LegalTermsDialogProps) {
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false)
  const [acceptedCookies, setAcceptedCookies] = useState(false)

  const canAccept = acceptedTerms && acceptedPrivacy && acceptedCookies

  const handleAccept = () => {
    if (canAccept) {
      // Store acceptance in localStorage
      localStorage.setItem("legal_terms_accepted", new Date().toISOString())
      localStorage.setItem("privacy_policy_accepted", new Date().toISOString())
      localStorage.setItem("cookies_accepted", new Date().toISOString())
      onAccept()
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-full bg-[#01A89E]/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-[#01A89E]" />
            </div>
            <div>
              <DialogTitle>Condiciones Legales</DialogTitle>
              <DialogDescription>
                Por favor, lee y acepta nuestras condiciones
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-6">
            {/* Términos y Condiciones */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#01A89E]" />
                <h3 className="font-semibold text-sm">Términos y Condiciones de Uso</h3>
              </div>
              <div className="bg-muted/50 p-3 rounded-lg text-xs text-muted-foreground space-y-2">
                <p>Al utilizar CamareroPorFavor, aceptas los siguientes términos:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Debes tener al menos 18 años para usar esta plataforma.</li>
                  <li>La información proporcionada debe ser veraz y actualizada.</li>
                  <li>Los vídeos subidos no deben contener contenido inapropiado, ofensivo o ilegal.</li>
                  <li>Nos reservamos el derecho de eliminar contenido que viole estas condiciones.</li>
                  <li>El uso indebido de la plataforma puede resultar en la suspensión de la cuenta.</li>
                  <li>Las ofertas de empleo publicadas deben ser reales y legítimas.</li>
                  <li>CamareroPorFavor actúa como intermediario y no es responsable de las contrataciones finales.</li>
                </ul>
                <a href="/legal/terminos" target="_blank" className="text-[#01A89E] hover:underline inline-block mt-2">
                  Leer términos completos
                </a>
              </div>
            </div>

            {/* Política de Privacidad */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#01A89E]" />
                <h3 className="font-semibold text-sm">Política de Privacidad</h3>
              </div>
              <div className="bg-muted/50 p-3 rounded-lg text-xs text-muted-foreground space-y-2">
                <p>Respetamos tu privacidad. Estos son los puntos clave:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Recopilamos datos necesarios para el funcionamiento del servicio (nombre, email, ubicación, vídeos).</li>
                  <li>Tus datos se almacenan de forma segura en servidores europeos.</li>
                  <li>No vendemos tus datos personales a terceros.</li>
                  <li>Puedes solicitar la eliminación de tus datos en cualquier momento.</li>
                  <li>Los vídeos de presentación son visibles para empresas registradas.</li>
                  <li>Utilizamos encriptación para proteger la información sensible.</li>
                </ul>
                <a href="/legal/privacidad" target="_blank" className="text-[#01A89E] hover:underline inline-block mt-2">
                  Leer política completa
                </a>
              </div>
            </div>

            {/* Política de Cookies */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#01A89E]" />
                <h3 className="font-semibold text-sm">Política de Cookies</h3>
              </div>
              <div className="bg-muted/50 p-3 rounded-lg text-xs text-muted-foreground space-y-2">
                <p>Utilizamos cookies para mejorar tu experiencia:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li><strong>Cookies esenciales:</strong> Necesarias para el funcionamiento básico.</li>
                  <li><strong>Cookies de sesión:</strong> Mantienen tu sesión activa.</li>
                  <li><strong>Cookies analíticas:</strong> Nos ayudan a mejorar el servicio.</li>
                </ul>
                <a href="/legal/cookies" target="_blank" className="text-[#01A89E] hover:underline inline-block mt-2">
                  Leer política de cookies
                </a>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Checkboxes de aceptación */}
        <div className="space-y-3 border-t pt-4">
          <div className="flex items-start gap-3">
            <Checkbox 
              id="terms" 
              checked={acceptedTerms} 
              onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
            />
            <Label htmlFor="terms" className="text-xs leading-relaxed cursor-pointer">
              He leído y acepto los <span className="text-[#01A89E] font-medium">Términos y Condiciones</span> de uso de CamareroPorFavor
            </Label>
          </div>
          
          <div className="flex items-start gap-3">
            <Checkbox 
              id="privacy" 
              checked={acceptedPrivacy} 
              onCheckedChange={(checked) => setAcceptedPrivacy(checked === true)}
            />
            <Label htmlFor="privacy" className="text-xs leading-relaxed cursor-pointer">
              He leído y acepto la <span className="text-[#01A89E] font-medium">Política de Privacidad</span> y el tratamiento de mis datos
            </Label>
          </div>
          
          <div className="flex items-start gap-3">
            <Checkbox 
              id="cookies" 
              checked={acceptedCookies} 
              onCheckedChange={(checked) => setAcceptedCookies(checked === true)}
            />
            <Label htmlFor="cookies" className="text-xs leading-relaxed cursor-pointer">
              Acepto el uso de <span className="text-[#01A89E] font-medium">cookies</span> según la política descrita
            </Label>
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-3 pt-2">
          {onDecline && (
            <Button variant="outline" onClick={onDecline} className="flex-1">
              Cancelar
            </Button>
          )}
          <Button 
            onClick={handleAccept} 
            disabled={!canAccept}
            className="flex-1 bg-[#01A89E] hover:bg-[#01A89E]/90"
          >
            Aceptar y Continuar
          </Button>
        </div>

        {!canAccept && (
          <p className="text-[10px] text-center text-muted-foreground">
            Debes aceptar todas las condiciones para continuar
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}
