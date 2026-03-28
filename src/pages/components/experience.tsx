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
      <div className="surface-grid relative z-10">
        {!isReadOnly && userId && (
          <div className="mb-4 flex justify-end">
            <Link
              href={editExperienceHref}
              scroll={false}
              className="inline-flex items-center gap-2 rounded-full border border-cyan-300/70 bg-cyan-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-cyan-700 transition-colors hover:bg-cyan-100 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-200 dark:hover:bg-cyan-500/20"
            >
              <PencilLine className="h-3.5 w-3.5" />
              Edit Experience
            </Link>
          </div>
        )}
        <AnimatedSectionHeader title="Professional Experience" />
        <div className="space-y-8">
          {experiences.length > 0 ? experiences.map((exp, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="glass-card relative overflow-hidden"
            >
              <div
                className="absolute right-0 top-0 h-28 w-28 rounded-bl-full bg-cyan-200/60 opacity-70 transition-transform duration-500 group-hover:scale-110 dark:bg-cyan-700/40"
              ></div>
              <div className="relative z-10">
                <h3 className="mb-2 flex items-center text-2xl font-semibold text-slate-900 dark:text-slate-100">
                  {(exp.type || "").toLowerCase() === "freelance" ? <Globe className="mr-2 h-6 w-6 text-cyan-500" /> : null}
                  {exp.type}
                </h3>
                <p className="mb-2 flex items-center text-slate-600 dark:text-slate-300">
                  <MapPin className="mr-2 h-4 w-4" />
                  {exp.location}
                </p>
                <p className="mb-4 flex items-center text-slate-600 dark:text-slate-300">
                  <Calendar className="mr-2 h-4 w-4" />
                  {exp.duration}
                </p>
                <p className="mb-4 flex items-center text-xl font-medium text-slate-700 dark:text-slate-200">
                  <Briefcase className="mr-2 h-5 w-5" />
                  {exp.role}
                </p>
                <ul className="list-none space-y-2">
                  {(exp.decription || "")
                    .split(/\n|\.|•/)
                    .map((line) => line.trim())
                    .filter(Boolean)
                    .map((resp, idx) => (
                    <li key={idx} className="flex items-start text-slate-700 dark:text-slate-300">
                      <span className="mr-2 text-cyan-500">•</span>
                      {resp}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )) : (
            <div className="glass-card text-center text-slate-600 dark:text-slate-300">
              No experience entries yet. Use Edit Experience to add your work history.
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
