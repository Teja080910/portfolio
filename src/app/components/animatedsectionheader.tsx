"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"

interface AnimatedSectionHeaderProps {
  title: string
  subtitle?: string
  animateState?: "hidden" | "visible"
}

const headerVariants = {
  hidden: { opacity: 0, y: 26 },
  visible: { opacity: 1, y: 0 },
} as const

export default function AnimatedSectionHeader({ title, subtitle, animateState }: AnimatedSectionHeaderProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, amount: 0.15 })

  const headerContent = (
    <>
      {/* Section label */}
      <span className="accent-chip">
        <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
        Portfolio
      </span>

      {/* Title */}
      <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground md:text-4xl lg:text-5xl">
        {title}
      </h2>

      {/* Optional subtitle */}
      {subtitle && (
        <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">
          {subtitle}
        </p>
      )}

      {/* Decorative underline */}
      <div className="mt-6 flex items-center justify-center gap-1.5">
        <span className="inline-block h-1 w-8 rounded-full bg-primary/60" />
        <span className="inline-block h-1 w-16 rounded-full bg-gradient-to-r from-primary via-purple-500 to-pink-500" />
        <span className="inline-block h-1 w-8 rounded-full bg-pink-500/60" />
      </div>
    </>
  )

  if (animateState) {
    return (
      <motion.div
        ref={ref}
        className="mb-16 text-center"
        initial={false}
        animate={animateState}
        variants={headerVariants}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {headerContent}
      </motion.div>
    )
  }

  return (
    <motion.div
      ref={ref}
      className="mb-16 text-center"
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={headerVariants}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {headerContent}
    </motion.div>
  )
}
