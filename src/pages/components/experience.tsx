"use client"

import { useStore } from "@/lib/store"
import { motion } from "framer-motion"
import { Briefcase, Calendar, Globe, MapPin, PencilLine } from "lucide-react"
import Link from "next/link"
import AnimatedSectionHeader from "../../app/components/animatedsectionheader"

type ExperienceProps = {
  isReadOnly?: boolean
}

export default function Experience({ isReadOnly = false }: ExperienceProps) {
  const experienceStore = useStore((state) => state.experience)
  const userId = useStore((state) => state.user.id)
  const username = useStore((state) => state.user.username)
  const editExperienceHref = `/u/${encodeURIComponent(username || "me")}/edit-experience`
  const experiences = experienceStore.filter((item) => item.show && (item.type || item.role || item.decription))

  if (isReadOnly && experiences.length === 0) {
    return null
  }

  return (
    <section id="experience" className="section-shell">
      {/* Background */}
      <div className="orb right-[-10%] top-[-5%] h-[30%] w-[30%] bg-primary/5 dark:bg-primary/10" />
      <div className="orb left-[-5%] bottom-[-5%] h-[25%] w-[25%] bg-purple-500/5 dark:bg-purple-500/10" />

      <div className="surface-grid relative z-10">
        {!isReadOnly && userId && (
          <div className="mb-6 flex justify-end">
            <Link
              href={editExperienceHref}
              scroll={false}
              className="inline-flex items-center gap-2 rounded-xl border border-border/50 bg-card/50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:text-primary"
            >
              <PencilLine className="h-3.5 w-3.5" />
              Edit Experience
            </Link>
          </div>
        )}

        <AnimatedSectionHeader title="Experience" subtitle="My professional journey and work history." />

        <div className="relative mx-auto max-w-4xl">
          {experiences.length > 0 ? (
            <div className="relative space-y-8 before:absolute before:left-[23px] before:top-0 before:h-full before:w-[2px] before:bg-gradient-to-b before:from-primary/40 before:via-purple-500/20 before:to-transparent">
              {experiences.map((exp, index) => (
                <motion.div
                  key={exp.id || index}
                  initial={{ opacity: 0, y: 26 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false, amount: 0.35 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="relative flex gap-6"
                >
                  {/* Timeline dot */}
                  <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-primary/30 bg-background shadow-sm transition-all duration-300 group-hover:border-primary group-hover:bg-primary/10">
                    {exp.type?.toLowerCase() === "freelance" ? (
                      <Globe className="h-5 w-5 text-primary" />
                    ) : (
                      <Briefcase className="h-5 w-5 text-primary" />
                    )}
                  </div>

                  {/* Content card */}
                  <div className="glass-card group min-w-0 flex-1">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <h3 className="break-words text-lg font-bold text-foreground [overflow-wrap:anywhere]">
                          {exp.type}
                        </h3>
                        {exp.role && (
                          <p className="mt-1 break-words text-base font-medium text-primary [overflow-wrap:anywhere]">
                            {exp.role}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Meta info */}
                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
                      {exp.location && (
                        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" />
                          {exp.location}
                        </span>
                      )}
                      {exp.duration && (
                        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          {exp.duration}
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    {exp.decription && (
                      <ul className="mt-4 space-y-2">
                        {(exp.decription || "")
                          .split(/\n|\.|•/)
                          .map((line) => line.trim())
                          .filter(Boolean)
                          .map((resp, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary/60" />
                              <span className="break-words [overflow-wrap:anywhere]">{resp}</span>
                            </li>
                          ))}
                      </ul>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="glass-card text-center text-muted-foreground">
              No experience entries yet. Use Edit Experience to add your work history.
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
