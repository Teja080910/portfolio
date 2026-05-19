"use client"

import Image from "next/image"
import { useEffect } from "react"
import { X, ChevronLeft, ChevronRight } from "lucide-react"

type ImageLightboxProps = {
  src: string
  alt: string
  onClose: () => void
  photos?: string[]
  currentIndex?: number
  onPrev?: () => void
  onNext?: () => void
}

export default function ImageLightbox({ src, alt, onClose, photos, currentIndex, onPrev, onNext }: ImageLightboxProps) {
  useEffect(() => {
    document.body.style.overflow = "hidden"
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowLeft" && onPrev) onPrev()
      if (e.key === "ArrowRight" && onNext) onNext()
    }
    window.addEventListener("keydown", handleKey)
    return () => {
      document.body.style.overflow = ""
      window.removeEventListener("keydown", handleKey)
    }
  }, [onClose, onPrev, onNext])

  const showNav = photos && photos.length > 1 && currentIndex !== undefined

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-2xl bg-background shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
        >
          <X className="h-4 w-4" />
        </button>

        {showNav && (
          <>
            <button
              type="button"
              onClick={onPrev}
              className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={onNext}
              className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <span className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white">
              {currentIndex! + 1} / {photos.length}
            </span>
          </>
        )}

        <div className="relative h-auto w-auto">
          <Image
            src={src}
            alt={alt}
            width={1200}
            height={900}
            className="max-h-[85vh] w-auto object-contain"
            style={{ width: "auto", height: "auto" }}
            sizes="90vw"
          />
        </div>
      </div>
    </div>
  )
}
