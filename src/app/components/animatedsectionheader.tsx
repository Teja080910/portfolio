"use client"

import { sectionViewport } from "@/lib/motion"
import { motion } from "framer-motion"

interface AnimatedSectionHeaderProps {
  title: string
  animateState?: "hidden" | "visible"
}

const headerVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
} as const

const dividerVariants = {
  hidden: { scaleX: 0, opacity: 0 },
  visible: { scaleX: 1, opacity: 1 },
} as const

export default function AnimatedSectionHeader({ title, animateState }: AnimatedSectionHeaderProps) {
  if (animateState) {
    return (
      <motion.div
        className="mb-12 text-center"
        initial={false}
        animate={animateState}
        variants={headerVariants}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <span className="accent-chip">Portfolio</span>
        <h2 className="mt-3 text-3xl font-bold text-slate-900 dark:text-slate-100 md:text-4xl">{title}</h2>
        <motion.div
          className="mx-auto mt-4 h-1 w-24 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500"
          initial={false}
          animate={animateState}
          variants={dividerVariants}
          transition={{ delay: animateState === "visible" ? 0.12 : 0, duration: 0.45 }}
        />
      </motion.div>
    )
  }

  return (
    <motion.div
      className="mb-12 text-center"
      initial="hidden"
      whileInView="visible"
      variants={headerVariants}
      viewport={{ ...sectionViewport, amount: 0.6 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <span className="accent-chip">Portfolio</span>
      <h2 className="mt-3 text-3xl font-bold text-slate-900 dark:text-slate-100 md:text-4xl">{title}</h2>
      <motion.div
        className="mx-auto mt-4 h-1 w-24 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500"
        initial="hidden"
        whileInView="visible"
        variants={dividerVariants}
        viewport={sectionViewport}
        transition={{ delay: 0.12, duration: 0.45 }}
      />
    </motion.div>
  )
}
