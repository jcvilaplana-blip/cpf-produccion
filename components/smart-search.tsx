"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Search, MapPin, Briefcase, Building2, X, Loader2 } from "lucide-react"
import { getMapboxToken } from "@/lib/mapbox"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

interface SearchResult {
  id: string
  type: "job" | "category" | "city" | "business"
  title: string
  subtitle?: string
  link?: string
}

interface SmartSearchProps {
  onSearch?: (query: string) => void
  placeholder?: string
  className?: string
}

export function SmartSearch({
  onSearch,
  placeholder = "Buscar ofertas, categorias, ciudades...",
  className = "",
}: SmartSearchProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [showResults, setShowResults] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [mapboxToken, setMapboxToken] = useState<string>("")
  const wrapperRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

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
        setShowResults(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const searchAll = useCallback(
    async (text: string) => {
      if (!text || text.length < 2) {
        setResults([])
        return
      }

      setIsLoading(true)
      const searchResults: SearchResult[] = []

      try {
        // 1. Search jobs from database
        const { data: jobs } = await supabase
          .from("jobs")
          .select("id, title, location, category")
          .eq("is_active", true)
          .or(`title.ilike.%${text}%,location.ilike.%${text}%,category.ilike.%${text}%`)
          .limit(5)

        if (jobs) {
          jobs.forEach((job) => {
            searchResults.push({
              id: job.id,
              type: "job",
              title: job.title,
              subtitle: job.location || job.category,
              link: `/jobs/${job.id}`,
            })
          })
        }

        // 2. Search categories from database
        const { data: categories } = await supabase
          .from("categories")
          .select("id, name, slug")
          .ilike("name", `%${text}%`)
          .limit(5)

        if (categories) {
          categories.forEach((cat) => {
            searchResults.push({
              id: cat.id,
              type: "category",
              title: cat.name,
              subtitle: "Categoria profesional",
              link: `/buscar?category=${cat.slug || cat.name}`,
            })
          })
        }

        // 3. Search businesses from database
        const { data: businesses } = await supabase
          .from("business_profiles")
          .select("id, company_name, city")
          .ilike("company_name", `%${text}%`)
          .limit(3)

        if (businesses) {
          businesses.forEach((biz) => {
            searchResults.push({
              id: biz.id,
              type: "business",
              title: biz.company_name,
              subtitle: biz.city || "Empresa",
              link: `/business/${biz.id}`,
            })
          })
        }

        // 4. Search cities via Mapbox
        if (mapboxToken) {
          try {
            const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(text)}.json?access_token=${mapboxToken}&country=es&types=place,locality&language=es&limit=4&autocomplete=true`
            const res = await fetch(url)
            const data = await res.json()
            
            if (data.features) {
              data.features.forEach((feature: any) => {
                searchResults.push({
                  id: feature.id,
                  type: "city",
                  title: feature.text,
                  subtitle: feature.place_name?.replace(feature.text + ", ", "") || "Espana",
                  link: `/buscar?location=${encodeURIComponent(feature.text)}`,
                })
              })
            }
          } catch {
            // Mapbox search failed silently
          }
        }

        setResults(searchResults)
        setShowResults(true)
      } catch {
        setResults([])
      } finally {
        setIsLoading(false)
      }
    },
    [supabase, mapboxToken]
  )

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchAll(query)
    }, 300)
    return () => clearTimeout(timer)
  }, [query, searchAll])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    onSearch?.(value)
  }

  const handleClear = () => {
    setQuery("")
    setResults([])
    setShowResults(false)
    onSearch?.("")
  }

  const getIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "job":
        return <Briefcase className="h-4 w-4 text-[#01A89E]" />
      case "category":
        return <Briefcase className="h-4 w-4 text-[#F48221]" />
      case "city":
        return <MapPin className="h-4 w-4 text-blue-500" />
      case "business":
        return <Building2 className="h-4 w-4 text-purple-500" />
      default:
        return <Search className="h-4 w-4 text-gray-400" />
    }
  }

  const getTypeLabel = (type: SearchResult["type"]) => {
    switch (type) {
      case "job":
        return "Oferta"
      case "category":
        return "Categoria"
      case "city":
        return "Ciudad"
      case "business":
        return "Empresa"
      default:
        return ""
    }
  }

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (results.length > 0) setShowResults(true)
          }}
          placeholder={placeholder}
          className="pl-10 pr-10 h-10 rounded-xl"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
            ) : (
              <X className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        )}
      </div>

      {showResults && results.length > 0 && (
        <div
          className="absolute left-0 right-0 top-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-[70vh] overflow-y-auto"
          style={{ zIndex: 9999 }}
        >
          {results.map((result, index) => (
            <Link
              key={`${result.type}-${result.id}-${index}`}
              href={result.link || "#"}
              onClick={() => setShowResults(false)}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b last:border-b-0"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                {getIcon(result.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{result.title}</p>
                <p className="text-xs text-gray-500 truncate">{result.subtitle}</p>
              </div>
              <span className="text-[10px] text-gray-400 uppercase font-medium">
                {getTypeLabel(result.type)}
              </span>
            </Link>
          ))}
        </div>
      )}

      {showResults && query.length >= 2 && results.length === 0 && !isLoading && (
        <div
          className="absolute left-0 right-0 top-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl p-6 text-center"
          style={{ zIndex: 9999 }}
        >
          <Search className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No se encontraron resultados para "{query}"</p>
          <p className="text-xs text-gray-400 mt-1">Intenta con otros terminos</p>
        </div>
      )}
    </div>
  )
}
