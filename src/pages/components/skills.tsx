"use client"

import { useStore } from "@/lib/store"
import { motion } from "framer-motion"
import type { LucideIcon } from "lucide-react"
import { Layers } from "lucide-react"
import AnimatedSectionHeader from "../../app/components/animatedsectionheader"

const SkillIcon = ({ icon: Icon, color }: { icon: LucideIcon; color: string }) => (
  <div className="rounded-xl border border-slate-200/70 bg-white/80 p-2.5 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/60">
    <Icon className={`h-5 w-5 ${color}`} />
  </div>
)

export default function Skills() {
  const skills = useStore((state) => state.skills.filter((item) => item.show && (item.skilltype || item.skills.length)))

  if (skills.length === 0) {
    return null
  }

  return (
    <section id="skills" className="section-shell">
      <div className="absolute inset-0 bg-gradient-to-b from-cyan-50/50 to-transparent dark:from-cyan-950/20 dark:to-transparent"></div>

      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="skill-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <circle cx="50" cy="50" r="20" fill="none" stroke="currentColor" strokeWidth="2" />
              <path d="M50 30 L50 70 M30 50 L70 50" stroke="currentColor" strokeWidth="2" />
            </pattern>
          </defs>
          <rect x="0" y="0" width="100%" height="100%" fill="url(#skill-pattern)" />
        </svg>
      </div>

      <div className="surface-grid relative z-10">
        <AnimatedSectionHeader title="Skills & Expertise" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {skills.map((skill, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 26 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="glass-card group h-full">
                <div className="flex items-center mb-4">
                  <SkillIcon icon={Layers as LucideIcon} color="text-cyan-500" />
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-slate-900 transition-colors duration-300 group-hover:text-cyan-600 dark:text-slate-100 dark:group-hover:text-cyan-300">
                      {skill.skilltype}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{skill.skills.join(", ")}</p>
                  </div>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300">{skill.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

