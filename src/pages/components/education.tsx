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
      <div className="surface-grid relative z-10">
        {!isReadOnly && userId && (
          <div className="mb-4 flex justify-end">
            <Link
              href={editEducationHref}
              scroll={false}
              className="inline-flex items-center gap-2 rounded-full border border-cyan-300/70 bg-cyan-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-cyan-700 transition-colors hover:bg-cyan-100 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-200 dark:hover:bg-cyan-500/20"
            >
              <PencilLine className="h-3.5 w-3.5" />
              Edit Education
            </Link>
          </div>
        )}
        <AnimatedSectionHeader title="Education" />
        <div className="mx-auto grid w-full max-w-6xl gap-6 md:grid-cols-2">
          {education.length > 0 ? education.map((edu, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.35 }}
              transition={{ duration: 0.55 }}
              className="glass-card relative flex h-full overflow-hidden p-7"
            >
              <div className="absolute left-0 top-0 h-24 w-24 rounded-br-[2.5rem] bg-cyan-200/55 opacity-80 dark:bg-cyan-700/30" />
              <div className="relative z-10 flex w-full flex-col">
                <h3 className="mb-2 flex items-start gap-2 text-xl font-semibold leading-tight text-slate-900 dark:text-slate-100">
                  <GraduationCap className="mt-0.5 h-5 w-5 shrink-0" />
                  {edu.course || edu.name}
                </h3>
                <p className="mb-4 text-lg leading-snug text-slate-600 dark:text-slate-300">{edu.name}</p>
                <p className="mb-4 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <Calendar className="h-4 w-4 shrink-0" />
                  {edu.duration}
                </p>
                {edu.branch && <p className="mb-5 text-sm leading-6 text-slate-600 dark:text-slate-300">{edu.branch}</p>}
                <h4 className="mb-3 flex items-center gap-2 text-base font-medium text-slate-700 dark:text-slate-200">
                  <Award className="h-4.5 w-4.5 shrink-0" />
                  Key Achievements:
                </h4>
                <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700 dark:text-slate-300">
                  {(edu.keyachivements || "")
                    .split(/\n|\.|•/)
                    .map((line) => line.trim())
                    .filter(Boolean)
                    .map((achievement, idx) => (
                    <li key={idx}>
                      {achievement}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )) : (
            <div className="glass-card md:col-span-2 text-center text-slate-600 dark:text-slate-300">
              No education entries yet. Use Edit Education to add your academic background.
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
