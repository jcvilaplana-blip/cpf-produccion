"use client"

import { Badge } from "@/components/ui/badge"
import { MapPin, Star } from "lucide-react"
import Link from "next/link"

interface WorkerVideoCardProps {
  id: string
  name: string
  category: string
  location: string
  rating: number
  avatarUrl?: string | null
  experience: string
}

export function WorkerVideoCard({ id, name, category, location, rating, avatarUrl, experience }: WorkerVideoCardProps) {
  return (
    <Link href={`/profile/${id}`}>
      <div className="relative aspect-[3/4] overflow-hidden rounded-xl shadow-lg bg-black">
        <img
          src={avatarUrl || "/placeholder.svg?height=400&width=300"}
          alt={name}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />

        {/* Gradient overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0.3) 40%, rgba(0,0,0,0))" }}
        />

        {/* Category badge */}
        <div className="absolute top-3 left-3 pointer-events-none">
          <Badge className="bg-primary/90 text-primary-foreground text-[12px] backdrop-blur-sm">{category}</Badge>
        </div>

        {/* Info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3.5 space-y-1.5 pointer-events-none">
          <h3 className="font-bold text-white text-base leading-tight">{name}</h3>
          <p className="text-white/70 text-[12px]">{experience}</p>
          <div className="flex items-center gap-2 text-white/90 text-[13px]">
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold">{rating.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-1 min-w-0 flex-1">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{location}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
