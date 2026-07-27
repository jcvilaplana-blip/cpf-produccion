"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button" 
import { ChevronUp } from "lucide-react"

export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    // Immediate scroll to top on route change - no animation
    window.scrollTo(0, 0)
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  }, [pathname])

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    const handleVideoPlay = () => setIsVideoPlaying(true)
    const handleVideoPause = () => setIsVideoPlaying(false)

    window.addEventListener("scroll", toggleVisibility)
    window.addEventListener("video-playing", handleVideoPlay as EventListener)
    window.addEventListener("video-paused", handleVideoPause as EventListener)

    return () => {
      window.removeEventListener("scroll", toggleVisibility)
      window.removeEventListener("video-playing", handleVideoPlay as EventListener)
      window.removeEventListener("video-paused", handleVideoPause as EventListener)
    }
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  return (
    <>
      {isVisible && !isVideoPlaying && (
        <Button
          onClick={scrollToTop}
          size="icon"
          className="fixed bottom-24 right-4 z-50 rounded-full shadow-lg bg-[#01A89E] hover:bg-[#018F86] text-white"
          aria-label="Volver arriba"
        >
          <ChevronUp className="h-5 w-5" />
        </Button>
      )}
    </>
  )
}
