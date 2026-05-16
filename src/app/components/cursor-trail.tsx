"use client"

import { useTheme } from "next-themes"
import { useCallback, useEffect, useRef } from "react"

export function CursorTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pointsRef = useRef<{ x: number; y: number; age: number }[]>([])
  const rafRef = useRef<number>(0)
  const { resolvedTheme } = useTheme()

  const trailLength = 12

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const isDark = resolvedTheme === "dark"
    const points = pointsRef.current

    for (let i = 0; i < points.length; i++) {
      const p = points[i]
      const progress = p.age / trailLength
      const alpha = 1 - progress
      const size = 6 * (1 - progress * 0.6)

      ctx.beginPath()
      ctx.arc(p.x, p.y, size, 0, Math.PI * 2)
      ctx.fillStyle = isDark ? `rgba(34, 211, 238, ${alpha * 0.5})` : `rgba(6, 182, 212, ${alpha * 0.35})`
      ctx.fill()
    }

    rafRef.current = requestAnimationFrame(draw)
  }, [resolvedTheme])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener("resize", resize)

    const onMove = (e: PointerEvent) => {
      pointsRef.current.push({ x: e.clientX, y: e.clientY, age: 0 })
      if (pointsRef.current.length > trailLength) {
        pointsRef.current = pointsRef.current.slice(-trailLength)
      }
    }

    const onLeave = () => {
      pointsRef.current = []
    }

    const tick = () => {
      for (let i = pointsRef.current.length - 1; i >= 0; i--) {
        pointsRef.current[i].age++
        if (pointsRef.current[i].age > trailLength) {
          pointsRef.current.splice(i, 1)
        }
      }
    }

    const interval = setInterval(tick, 30)
    window.addEventListener("pointermove", onMove)
    document.addEventListener("mouseleave", onLeave)

    rafRef.current = requestAnimationFrame(draw)

    return () => {
      window.removeEventListener("resize", resize)
      window.removeEventListener("pointermove", onMove)
      document.removeEventListener("mouseleave", onLeave)
      clearInterval(interval)
      cancelAnimationFrame(rafRef.current)
    }
  }, [draw])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[100]"
      aria-hidden="true"
    />
  )
}
