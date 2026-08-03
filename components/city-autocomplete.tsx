"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { MapPin, Loader2 } from "lucide-react"
import { getMapboxToken } from "@/lib/mapbox"

interface CityAutocompleteProps {
  value: string
  onChange: (city: string) => void
  placeholder?: string
  className?: string
  id?: string
}

// Lightweight Mapbox-backed city picker for search/filter fields - unlike
// address-autofill.tsx (built for full street addresses at profile/job
// creation time), this calls back with just the short place name
// (feature.text, e.g. "Madrid") instead of the full formatted place_name
// (e.g. "Madrid, Comunidad de Madrid, España"), since filter code matches
// that value as a plain substring against the city/location already stored
// on profiles/jobs/businesses.
export function CityAutocomplete({
  value,
  onChange,
  placeholder = "Ciudad...",
  className = "",
  id,
}: CityAutocompleteProps) {
  const [query, setQuery] = useState(value)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [mapboxToken, setMapboxToken] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setQuery(value)
  }, [value])

  useEffect(() => {
    getMapboxToken().then((token) => {
      if (token) setMapboxToken(token)
    })
  }, [])

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
      setIsLoading(true)
      try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(text)}.json?access_token=${mapboxToken}&country=es&types=place&language=es&limit=6&autocomplete=true`
        const res = await fetch(url)
        const data = await res.json()
        setSuggestions(data.features || [])
        setShowSuggestions(true)
      } catch {
        setSuggestions([])
      } finally {
        setIsLoading(false)
      }
    },
    [mapboxToken]
  )

  useEffect(() => {
    const timer = setTimeout(() => fetchSuggestions(query), 300)
    return () => clearTimeout(timer)
  }, [query, fetchSuggestions])

  const handleSelect = (feature: any) => {
    const city = feature.text
    setQuery(city)
    setShowSuggestions(false)
    setSuggestions([])
    onChange(city)
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
          autoComplete="off"
        />
        {isLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
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
              className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-teal-50 transition-colors text-left border-b last:border-b-0"
            >
              <MapPin className="h-3.5 w-3.5 text-[#01A89E] shrink-0" />
              <span className="text-sm text-gray-900 truncate">{s.text}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
