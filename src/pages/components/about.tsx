"use client"

import { useStore } from "@/lib/store"
import { motion } from "framer-motion"
import { Sparkles } from "lucide-react"
import Image from "next/image"
import AnimatedSectionHeader from "../../app/components/animatedsectionheader"

export default function About() {
  const about = useStore((state) => state.about)
  const skills = useStore((state) => state.skills)

  const aboutPoints = (about.list ?? []).map((item) => item.trim()).filter(Boolean)
  const skillHighlights = skills
    .filter((item) => item.show)
    .slice(0, 4)
    .map((item) => ({
      title: item.skilltype || "Skill Group",
      description: item.skills.length ? item.skills.join(", ") : item.description || "Update this card from Edit Portfolio Content.",
    }))

  return (
    <section id="about" className="section-shell">
      <div className="surface-grid relative z-10">
        <AnimatedSectionHeader title="About Me" />
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <motion.div
            className="glass-card"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.55 }}
          >
            <span className="accent-chip">Who I Am</span>
            {aboutPoints.length > 0 ? (
              <div className="mt-4 space-y-4">
                {aboutPoints.map((point, index) => (
                  <p key={`${point}-${index}`} className="text-lg leading-relaxed text-slate-700 dark:text-slate-300">
                    {point}
                  </p>
                ))}
              </div>
            ) : (
              <p className="mb-2 mt-4 text-lg leading-relaxed text-slate-700 dark:text-slate-300">
                Add your about details from <strong>Edit Portfolio Content</strong> to replace this empty state.
              </p>
            )}
          </motion.div>
          <motion.div
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.55 }}
          >
            {(skillHighlights.length > 0 ? skillHighlights : [{ title: "No skills yet", description: "Create skills from Edit Portfolio Content." }]).map((skill, index) => (
              <div key={index} className="glass-card">
                <Sparkles className="h-7 w-7 text-cyan-600 dark:text-cyan-300" />
                <h3 className="mb-2 mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">{skill.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">{skill.description}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
      <div className="pointer-events-none absolute bottom-8 right-8 h-40 w-40 opacity-20">
        <Image src="/placeholder.svg?height=160&width=160" alt="" width={160} height={160} />
      </div>
    </section>
  )
}

