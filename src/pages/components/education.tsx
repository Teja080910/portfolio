"use client"

import { useStore } from "@/lib/store"
import { motion } from "framer-motion"
import { Award, Calendar, GraduationCap, PencilLine } from "lucide-react"
import Image from "next/image"
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
              className="inline-flex items-center gap-2 rounded-full border border-cyan-300/70 bg-cyan-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-cyan-700 transition-colors hover:bg-cyan-100 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-200 dark:hover:bg-cyan-500/20"
            >
              <PencilLine className="h-3.5 w-3.5" />
              Edit Education
            </Link>
          </div>
        )}
        <AnimatedSectionHeader title="Education" />
        <div className="max-w-3xl mx-auto">
          {education.length > 0 ? education.map((edu, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.55 }}
              className="glass-card relative overflow-hidden p-8"
            >
              <div className="absolute left-0 top-0 h-28 w-28 rounded-br-full bg-cyan-200/60 opacity-80 dark:bg-cyan-700/35"></div>
              <div className="relative z-10">
                <h3 className="mb-2 flex items-center text-2xl font-semibold text-slate-900 dark:text-slate-100">
                  <GraduationCap className="mr-2 h-6 w-6" />
                  {edu.course || edu.name}
                </h3>
                <p className="mb-4 text-xl text-slate-600 dark:text-slate-300">{edu.name}</p>
                <p className="mb-4 flex items-center text-slate-600 dark:text-slate-300">
                  <Calendar className="mr-2 h-4 w-4" />
                  {edu.duration}
                </p>
                {edu.branch && <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">{edu.branch}</p>}
                <h4 className="mb-2 flex items-center text-lg font-medium text-slate-700 dark:text-slate-200">
                  <Award className="mr-2 h-5 w-5" />
                  Key Achievements:
                </h4>
                <ul className="list-disc list-inside space-y-2">
                  {(edu.keyachivements || "")
                    .split(/\n|\.|•/)
                    .map((line) => line.trim())
                    .filter(Boolean)
                    .map((achievement, idx) => (
                    <li key={idx} className="text-slate-700 dark:text-slate-300">
                      {achievement}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )) : (
            <div className="glass-card text-center text-slate-600 dark:text-slate-300">
              No education entries yet. Use Edit Education to add your academic background.
            </div>
          )}
        </div>
      </div>
      <div className="pointer-events-none absolute top-8 left-8 h-40 w-40 opacity-20">
        <Image src="/placeholder.svg?height=160&width=160" alt="" width={160} height={160} />
      </div>
    </section>
  )
}
