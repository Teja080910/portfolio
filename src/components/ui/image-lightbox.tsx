"use client"

import Image from "next/image"
import { useEffect } from "react"
import { X } from "lucide-react"

type ImageLightboxProps = {
  src: string
  alt: string
  onClose: () => void
}

export default function ImageLightbox({ src, alt, onClose }: ImageLightboxProps) {
  useEffect(() => {
    document.body.style.overflow = "hidden"
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKey)
    return () => {
      document.body.style.overflow = ""
      window.removeEventListener("keydown", handleKey)
    }
  }, [onClose])

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
