"use client"

import { getDeviceLocation } from "@/lib/capacitor/permissions"

export interface Coordinates {
  latitude: number
  longitude: number
}

export interface LocationResult {
  coordinates: Coordinates
  address?: string
  city?: string
  error?: string
}

// Obtener ubicacion actual del usuario (usa Capacitor GPS en APK, navigator.geolocation en web)
export async function getCurrentLocation(): Promise<LocationResult> {
  try {
    const loc = await getDeviceLocation()
    if (loc) {
      const coordinates = { latitude: loc.lat, longitude: loc.lng }
      try {
        const address = await reverseGeocode(coordinates)
        return { coordinates, ...address }
      } catch {
        return { coordinates }
      }
    }
  } catch {
    // fallback below
  }

  return {
    coordinates: { latitude: 40.4168, longitude: -3.7038 }, // Madrid por defecto
    error: "No se pudo obtener la ubicacion",
  }
}

// Reverse geocoding usando Nominatim (OpenStreetMap)
async function reverseGeocode(coords: Coordinates): Promise<{ address?: string; city?: string }> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}&zoom=18&addressdetails=1`,
      {
        headers: {
          "User-Agent": "CamareroPorFavor/1.0",
        },
      },
    )

    if (!response.ok) throw new Error("Geocoding failed")

    const data = await response.json()
    return {
      address: data.display_name,
      city: data.address?.city || data.address?.town || data.address?.village,
    }
  } catch (error) {
    console.error("Error en reverse geocoding:", error)
    return {}
  }
}

// Geocoding: convertir dirección a coordenadas
export async function geocodeAddress(address: string): Promise<Coordinates | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
      {
        headers: {
          "User-Agent": "CamareroPorFavor/1.0",
        },
      },
    )

    if (!response.ok) throw new Error("Geocoding failed")

    const data = await response.json()
    if (data.length === 0) return null

    return {
      latitude: Number.parseFloat(data[0].lat),
      longitude: Number.parseFloat(data[0].lon),
    }
  } catch (error) {
    console.error("Error en geocoding:", error)
    return null
  }
}

// Calcular distancia entre dos puntos (fórmula de Haversine)
export function calculateDistance(coords1: Coordinates, coords2: Coordinates): number {
  const R = 6371 // Radio de la Tierra en km
  const dLat = toRad(coords2.latitude - coords1.latitude)
  const dLon = toRad(coords2.longitude - coords1.longitude)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coords1.latitude)) * Math.cos(toRad(coords2.latitude)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c

  return Math.round(distance * 10) / 10 // Redondear a 1 decimal
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180)
}

// Formatear distancia para mostrar
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`
  }
  return `${km}km`
}

// Ciudades principales de España para sugerencias
export const SPANISH_CITIES = [
  "Madrid",
  "Barcelona",
  "Valencia",
  "Sevilla",
  "Zaragoza",
  "Málaga",
  "Murcia",
  "Palma de Mallorca",
  "Las Palmas de Gran Canaria",
  "Bilbao",
  "Alicante",
  "Córdoba",
  "Valladolid",
  "Vigo",
  "Gijón",
  "Granada",
  "Vitoria",
  "Elche",
  "Oviedo",
  "Badalona",
]
