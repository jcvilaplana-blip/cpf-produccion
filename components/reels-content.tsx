"use client"

import { useState, useRef, useEffect } from "react"
import { VideoReelPlayer } from "@/components/video-reel-player"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import type { Profile } from "@/lib/types"

interface ReelsContentProps {
  workers: Profile[]
  hideBottomNav?: boolean
  initialWorkerId?: string
}

export function ReelsContent({ workers, hideBottomNav = false, initialWorkerId }: ReelsContentProps) {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const touchStartY = useRef<number>(0)
  const touchStartTime = useRef<number>(0)

  const initialIndex = initialWorkerId ? workers.findIndex((w) => w.id === initialWorkerId) : 0

  const [currentIndex, setCurrentIndex] = useState(initialIndex >= 0 ? initialIndex : 0)
  const [isScrolling, setIsScrolling] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  useEffect(() => {
    if (hideBottomNav) {
      document.body.classList.add("hide-bottom-nav")
    }
    return () => {
      document.body.classList.remove("hide-bottom-nav")
    }
  }, [hideBottomNav])

  useEffect(() => {
    if (initialWorkerId && containerRef.current) {
      const index = workers.findIndex((w) => w.id === initialWorkerId)
      if (index >= 0) {
        containerRef.current.scrollTo({
          top: index * window.innerHeight,
          behavior: "auto",
        })
        setTimeout(() => setIsInitialLoad(false), 100)
      }
    } else {
      setIsInitialLoad(false)
    }
  }, [initialWorkerId, workers])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let scrollTimeout: NodeJS.Timeout

    const handleScroll = () => {
      setIsScrolling(true)
      clearTimeout(scrollTimeout)

      scrollTimeout = setTimeout(() => {
        setIsScrolling(false)
        const scrollPosition = container.scrollTop
        const windowHeight = window.innerHeight
        const newIndex = Math.round(scrollPosition / windowHeight)
        setCurrentIndex(Math.min(newIndex, workers.length - 1))
      }, 150)
    }

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY
      touchStartTime.current = Date.now()
    }

    const handleTouchEnd = (e: TouchEvent) => {
      const touchEndY = e.changedTouches[0].clientY
      const deltaY = touchEndY - touchStartY.current
      const deltaTime = Date.now() - touchStartTime.current

      if (deltaY > 150 && deltaTime < 300) {
        const currentWorker = workers[currentIndex]
        if (currentWorker) {
          router.push(`/profile/${currentWorker.id}?noVideo=true`)
        }
      }
    }

    container.addEventListener("scroll", handleScroll)
    container.addEventListener("touchstart", handleTouchStart)
    container.addEventListener("touchend", handleTouchEnd)

    return () => {
      container.removeEventListener("scroll", handleScroll)
      container.removeEventListener("touchstart", handleTouchStart)
      container.removeEventListener("touchend", handleTouchEnd)
      clearTimeout(scrollTimeout)
    }
  }, [currentIndex, workers, router])

  const handleVideoEnd = () => {
    if (currentIndex < workers.length - 1) {
      const nextIndex = currentIndex + 1
      setCurrentIndex(nextIndex)
      containerRef.current?.scrollTo({
        top: nextIndex * window.innerHeight,
        behavior: "smooth",
      })
    }
  }

  const handleClose = () => {
    router.back()
  }

  if (workers.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">No hay reels disponibles</h2>
          <p className="text-muted-foreground">{"Aun no hay trabajadores con videos de presentacion."}</p>
          <Button onClick={() => router.back()}>Volver</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black">
      {/* Back Button */}
      <div className="absolute top-4 left-4 z-50">
        <Button
          size="icon"
          variant="ghost"
          className="h-10 w-10 rounded-full text-white bg-black/40 backdrop-blur-md hover:bg-black/60"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      {/* Video counter */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-black/40 backdrop-blur-md rounded-full px-3 py-1">
          <span className="text-white/90 text-xs font-medium">
            {currentIndex + 1} / {workers.length}
          </span>
        </div>
      </div>

      {/* Dot indicators on the right */}
      <div className="absolute right-1.5 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-1">
        {workers.slice(
          Math.max(0, currentIndex - 3),
          Math.min(workers.length, currentIndex + 4)
        ).map((_, idx) => {
          const realIdx = Math.max(0, currentIndex - 3) + idx
          return (
            <div
              key={realIdx}
              className={`rounded-full transition-all duration-300 ${
                realIdx === currentIndex
                  ? "w-1.5 h-4 bg-primary"
                  : Math.abs(realIdx - currentIndex) === 1
                  ? "w-1 h-1.5 bg-white/50"
                  : "w-1 h-1 bg-white/25"
              }`}
            />
          )
        })}
      </div>

      {/* Video Container */}
      <div
        ref={containerRef}
        className="h-screen overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
        style={{ scrollSnapType: "y mandatory" }}
      >
        {workers.map((worker, index) => {
          // Only render MuxPlayer for current, previous, and next video (3 max)
          // Other slots render a lightweight placeholder to maintain scroll position
          const isNearby = Math.abs(index - currentIndex) <= 1

          if (!isNearby) {
            return (
              <div
                key={worker.id}
                className="h-screen w-full snap-start snap-always bg-black"
              />
            )
          }

          return (
            <VideoReelPlayer
              key={worker.id}
              profile={worker}
              videoUrl=""
              isActive={currentIndex === index && (!isScrolling || isInitialLoad)}
              onVideoEnd={handleVideoEnd}
              onClose={handleClose}
            />
          )
        })}
      </div>
    </div>
  )
}
