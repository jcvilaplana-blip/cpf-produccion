"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel"

interface PortfolioImageViewerProps {
  images: string[]
}

export function PortfolioImageViewer({ images = [] }: PortfolioImageViewerProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const items = Array.isArray(images) ? images.filter(Boolean) : []

  if (items.length === 0) return null

  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {items.map((url, index) => (
          <button
            key={index}
            type="button"
            onClick={() => setActiveIndex(index)}
            className="relative aspect-square rounded-lg overflow-hidden bg-gray-100"
          >
            <img src={url} alt={`Portfolio ${index + 1}`} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>

      {activeIndex !== null && (
        <div className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center">
          <button
            type="button"
            onClick={() => setActiveIndex(null)}
            className="absolute top-4 right-4 z-10 bg-white/10 hover:bg-white/20 rounded-full p-2 text-white transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-6 h-6" />
          </button>
          <Carousel opts={{ startIndex: activeIndex, loop: true }} className="w-full max-w-2xl px-4">
            <CarouselContent>
              {items.map((url, index) => (
                <CarouselItem key={index} className="flex items-center justify-center">
                  <img
                    src={url}
                    alt={`Portfolio ${index + 1}`}
                    className="max-h-[85vh] w-full object-contain rounded-lg"
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
            {items.length > 1 && (
              <>
                <CarouselPrevious className="left-2 text-black" />
                <CarouselNext className="right-2 text-black" />
              </>
            )}
          </Carousel>
        </div>
      )}
    </>
  )
}
