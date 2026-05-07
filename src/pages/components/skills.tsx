"use client"

import { useStore } from "@/lib/store"
import { motion } from "framer-motion"
import { PencilLine } from "lucide-react"
import Link from "next/link"
import AnimatedSectionHeader from "../../app/components/animatedsectionheader"

type SkillsProps = {
  isReadOnly?: boolean
}

const skillCategoryIcons: Record<string, string> = {
  frontend: "🎨",
  backend: "⚙️",
  database: "🗄️",
  devops: "🚀",
  tools: "🛠️",
  language: "💻",
  framework: "📦",
  cloud: "☁️",
  mobile: "📱",
  other: "🔧",
}

const getCategoryIcon = (type: string) => {
  const key = Object.entries(skillCategoryIcons).find(([k]) =>
    type?.toLowerCase().includes(k)
  )
  return key ? key[1] : "🔧"
}

export default function Skills({ isReadOnly = false }: SkillsProps) {
  const skillsStore = useStore((state) => state.skills)
  const userId = useStore((state) => state.user.id)
  const username = useStore((state) => state.user.username)
  const editSkillsHref = `/u/${encodeURIComponent(username || "me")}/edit-skills`
  const skills = skillsStore.filter((item) => item.show && (item.skilltype || item.skills.length || item.description))

  if (isReadOnly && skills.length === 0) {
    return null
  }

  const allSkills = skills.flatMap((s) => s.skills)
  const flattenedUniqueSkills = [...new Set(allSkills.map((s) => s.toLowerCase()))].slice(0, 24)

  return (
    <section id="skills" className="section-shell">
      {/* Background */}
      <div className="orb right-[-10%] top-[-5%] h-[30%] w-[30%] bg-purple-500/5 dark:bg-purple-500/10" />
      <div className="orb left-[-5%] bottom-[-5%] h-[25%] w-[25%] bg-primary/5 dark:bg-primary/10" />

      <div className="surface-grid relative z-10">
        {!isReadOnly && userId && (
          <div className="mb-6 flex justify-end">
            <Link
              href={editSkillsHref}
              scroll={false}
              className="inline-flex items-center gap-2 rounded-xl border border-border/50 bg-card/50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:text-primary"
            >
              <PencilLine className="h-3.5 w-3.5" />
              Edit Skills
            </Link>
          </div>
        )}

        <AnimatedSectionHeader title="Skills & Expertise" subtitle="Technologies and tools I work with." />

        {/* Skills cloud */}
        {flattenedUniqueSkills.length > 0 && (
          <motion.div
            className="mb-16 flex flex-wrap justify-center gap-2.5"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            {flattenedUniqueSkills.map((skill, index) => (
              <motion.span
                key={skill}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.03, duration: 0.3 }}
                className="skill-badge cursor-default"
              >
                {skill}
              </motion.span>
            ))}
          </motion.div>
        )}

        {/* Skill categories */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {skills.length > 0 ? (
            skills.map((skill, index) => (
              <motion.div
                key={skill.id || index}
                initial={{ opacity: 0, y: 26 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.35 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="glass-card group h-full">
                  <div className="mb-4 flex items-center gap-3">
                    {/* Category icon */}
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border/50 bg-background/50 text-lg">
                      {getCategoryIcon(skill.skilltype)}
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-foreground transition-colors duration-300 group-hover:text-primary">
                        {skill.skilltype}
                      </h3>
                    </div>
                  </div>

                  {/* Skills tags */}
                  <div className="mb-4 flex flex-wrap gap-1.5">
                    {skill.skills.map((s, i) => (
                      <span
                        key={`${skill.id}-${s}-${i}`}
                        className="skill-badge text-xs"
                      >
                        {s}
                      </span>
                    ))}
                  </div>

                  {/* Description */}
                  {skill.description && (
                    <p className="break-words text-sm leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
                      {skill.description}
                    </p>
                  )}
                </div>
              </motion.div>
            ))
          ) : (
            <div className="glass-card md:col-span-2 lg:col-span-3 text-center text-muted-foreground">
              No skills added yet. Use Edit Skills to showcase your expertise.
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
