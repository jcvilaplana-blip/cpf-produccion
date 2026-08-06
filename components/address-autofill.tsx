"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Input } from "@/components/ui/input" 
import { MapPin } from "lucide-react"
import { getMapboxToken } from "@/lib/mapbox"

interface AddressAutofillProps {
  value: string
  onChange: (value: string, coordinates?: { lat: number; lng: number }) => void
  placeholder?: string
  className?: string
  id?: string
  types?: string // e.g. "address", "place", "locality"
}

export function AddressAutofill({
  value,
  onChange,
  placeholder = "Escribe una direccion...",
  className = "",
  id,
  types = "address,place,locality",
}: AddressAutofillProps) {
  const [query, setQuery] = useState(value)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [mapboxToken, setMapboxToken] = useState<string>("")
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setQuery(value)
  }, [value])
  
  // ALWAYS load Mapbox token from API
  useEffect(() => {
    getMapboxToken().then(token => {
      if (token) setMapboxToken(token)
    })
  }, [])

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const fetchSuggestions = useCallback(
    async (text: string) => {
      if (!text || text.length < 2 || !mapboxToken) {
        setSuggestions([])
        return
      }
      try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(text)}.json?access_token=${mapboxToken}&country=es&types=${types}&language=es&limit=5&autocomplete=true`
        const res = await fetch(url)
        const data = await res.json()
        setSuggestions(data.features || [])
        setShowSuggestions(true)
      } catch {
        setSuggestions([])
      }
    },
    [types, mapboxToken]
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSuggestions(query)
    }, 300)
    return () => clearTimeout(timer)
  }, [query, fetchSuggestions])

  const handleSelect = (feature: any) => {
    const [lng, lat] = feature.center
    setQuery(feature.place_name)
    setShowSuggestions(false)
    setSuggestions([])
    onChange(feature.place_name, { lat, lng })
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          id={id}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            onChange(e.target.value)
          }}
          onFocus={() => {
            if (suggestions.length > 0) setShowSuggestions(true)
          }}
          placeholder={placeholder}
          className={`pl-10 ${className}`}
        />
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div 
          className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto"
          style={{ zIndex: 9999 }}
        >
          {suggestions.map((s: any) => (
            <button
              key={s.id}
              type="button"
              onClick={() => handleSelect(s)}
              className="w-full flex items-center gap-3 px-3 py-3 hover:bg-teal-50 transition-colors text-left border-b last:border-b-0"
            >
              <MapPin className="h-4 w-4 text-[#01A89E] shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{s.text}</p>
                <p className="text-[13px] text-gray-500 truncate">{s.place_name}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
