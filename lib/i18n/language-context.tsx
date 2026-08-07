"use client"

import type React from "react"
import { createContext, useContext } from "react"
import { es } from "./es"

/**
 * La aplicación es sólo en español.
 *
 * Se conserva `t()` porque lo usan 87 ficheros: quitarlo obligaría a tocar
 * cada texto de la interfaz sin que el usuario notara diferencia alguna. Lo
 * que desaparece es la posibilidad de cambiar de idioma — ya no hay selectores
 * ni traducciones alternativas, y `t()` resuelve siempre contra `es`.
 *
 * Si algún día se retoma el multiidioma, aquí es donde vuelve: añadir el mapa
 * de traducciones y un estado. El resto de la aplicación no se entera.
 */
type Language = "es"

interface LanguageContextType {
  language: Language
  /** Se mantiene en la interfaz para no romper a quien la llame; no hace nada. */
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const t = (key: string): string => {
    const keys = key.split(".")
    let value: any = es

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k]
      } else {
        return key // Sin traducción, se devuelve la clave.
      }
    }

    return typeof value === "string" ? value : key
  }

  return (
    <LanguageContext.Provider value={{ language: "es", setLanguage: () => {}, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
