"use client"

import { useStore } from "@/lib/store"
import { motion } from "framer-motion"
import { Award, Calendar, GraduationCap, PencilLine } from "lucide-react"
import Link from "next/link"
import AnimatedSectionHeader from "../../app/components/animatedsectionheader"

type EducationProps = {
  isReadOnly?: boolean
}

export default function Education({ isReadOnly = false }: EducationProps) {
  const educationStore = useStore((state) => state.education)
  const userId = useStore((state) => state.user.id)
  const username = useStore((state) => state.user.username)
  const editEducationHref = `/u/${encodeURIComponent(username || "me")}/edit-education`
  const education = educationStore.filter((item) => item.show && (item.name || item.course || item.branch || item.keyachivements))

  if (isReadOnly && education.length === 0) {
    return null
  }

  return (
    <section id="education" className="section-shell">
      {/* Background */}
      <div className="orb left-[-10%] top-[-5%] h-[30%] w-[30%] bg-purple-500/5 dark:bg-purple-500/10" />
      <div className="orb right-[-5%] bottom-[-5%] h-[25%] w-[25%] bg-primary/5 dark:bg-primary/10" />

      <div className="surface-grid relative z-10">
        {!isReadOnly && userId && (
          <div className="mb-6 flex justify-end">
            <Link
              href={editEducationHref}
              scroll={false}
              className="inline-flex items-center gap-2 rounded-xl border border-border/50 bg-card/50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:text-primary"
            >
              <PencilLine className="h-3.5 w-3.5" />
              Edit Education
            </Link>
          </div>
        )}

        <AnimatedSectionHeader title="Education" subtitle="My academic background and qualifications." />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {education.length > 0 ? (
            education.map((edu, index) => (
              <motion.div
                key={edu.id || index}
                initial={{ opacity: 0, y: 26 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.35 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="glass-card group relative h-full overflow-hidden">
                  {/* Top accent bar */}
                  <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-primary via-purple-500 to-pink-500 opacity-60" />

                  <div className="relative z-10 flex flex-col">
                    {/* Header */}
                    <div className="mb-4 flex items-start gap-3">
                      <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-background/50">
                        <GraduationCap className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="break-words text-lg font-bold text-foreground [overflow-wrap:anywhere]">
                          {edu.course || edu.name}
                        </h3>
                        {edu.name && edu.course && (
                          <p className="mt-0.5 break-words text-sm text-muted-foreground [overflow-wrap:anywhere]">{edu.name}</p>
                        )}
                      </div>
                    </div>

                    {/* Duration */}
                    {edu.duration && (
                      <p className="mb-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        {edu.duration}
                      </p>
                    )}

                    {/* Branch */}
                    {edu.branch && (
                      <span className="mb-4 inline-flex max-w-full self-start rounded-lg border border-border/50 bg-secondary/50 px-2.5 py-1 text-xs font-medium text-muted-foreground">
                        <span className="break-words [overflow-wrap:anywhere]">{edu.branch}</span>
                      </span>
                    )}

                    {/* Achievements */}
                    {edu.keyachivements && (
                      <div className="mt-auto">
                        <h4 className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-foreground/80">
                          <Award className="h-4 w-4 text-primary" />
                          Key Achievements
                        </h4>
                        <ul className="space-y-2">
                          {(edu.keyachivements || "")
                            .split(/\n|\.|•/)
                            .map((line) => line.trim())
                            .filter(Boolean)
                            .map((achievement, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary/60" />
                                <span className="break-words [overflow-wrap:anywhere]">{achievement}</span>
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="glass-card md:col-span-2 text-center text-muted-foreground">
              No education entries yet. Use Edit Education to add your academic background.
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
