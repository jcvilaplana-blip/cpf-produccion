"use client"

import { useState, useEffect, useLayoutEffect } from "react"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronUp } from "lucide-react"

export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const pathname = usePathname()

  // The browser's own scroll restoration (history.scrollRestoration, default
  // "auto") races against this app's own reset below on every client-side
  // navigation - the browser sometimes re-applies the PREVIOUS page's scroll
  // offset to the new page's content, which is what made destination pages
  // "arrive" already scrolled down. Taking manual control once, on mount,
  // removes that race entirely instead of just fighting it after the fact.
  useEffect(() => {
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual"
    }
  }, [])

  // useLayoutEffect (synchronous, before the browser paints) instead of
  // useEffect (after paint) - the previous version could still show a brief
  // flash of the new page at the old scroll position before snapping to top.
  useLayoutEffect(() => {
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
