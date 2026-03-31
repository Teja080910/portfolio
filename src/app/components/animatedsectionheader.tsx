"use client"

import { motion } from "framer-motion"

interface AnimatedSectionHeaderProps {
  title: string
}

export default function AnimatedSectionHeader({ title }: AnimatedSectionHeaderProps) {
  return (
    <motion.div
      className="mb-12 text-center"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.6 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <span className="accent-chip">Portfolio</span>
      <h2 className="mt-3 text-3xl font-bold text-slate-900 dark:text-slate-100 md:text-4xl">{title}</h2>
      <motion.div
        className="mx-auto mt-4 h-1 w-24 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500"
        initial={{ scaleX: 0, opacity: 0 }}
        whileInView={{ scaleX: 1, opacity: 1 }}
        viewport={{ once: false }}
        transition={{ delay: 0.12, duration: 0.45 }}
      />
    </motion.div>
  )
}

