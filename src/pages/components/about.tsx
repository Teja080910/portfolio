"use client"

import { useStore } from "@/lib/store"
import { motion } from "framer-motion"
import { PencilLine, Sparkles } from "lucide-react"
import Link from "next/link"
import AnimatedSectionHeader from "../../app/components/animatedsectionheader"

type AboutProps = {
  isReadOnly?: boolean
}

export default function About({ isReadOnly = false }: AboutProps) {
  const about = useStore((state) => state.about)
  const skills = useStore((state) => state.skills)
  const userId = useStore((state) => state.user.id)
  const username = useStore((state) => state.user.username)
  const editAboutHref = `/u/${encodeURIComponent(username || "me")}/edit-about`

  const aboutPoints = (about.list ?? []).map((item) => item.trim()).filter(Boolean)
  const skillHighlights = skills
    .filter((item) => item.show && (item.skilltype || item.skills.length || item.description))
    .slice(0, 4)
    .map((item) => ({
      title: item.skilltype || "Skill Group",
      description: item.skills.length ? item.skills.join(", ") : item.description || "Update this card from Edit Portfolio Content.",
    }))

  if (isReadOnly && aboutPoints.length === 0 && skillHighlights.length === 0) {
    return null
  }

  return (
    <section id="about" className="section-shell">
      <div className="surface-grid relative z-10">
        {!isReadOnly && userId && (
          <div className="mb-4 flex justify-end">
            <Link
              href={editAboutHref}
              scroll={false}
              className="inline-flex items-center gap-2 rounded-full border border-cyan-300/70 bg-cyan-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-cyan-700 transition-colors hover:bg-cyan-100 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-200 dark:hover:bg-cyan-500/20"
            >
              <PencilLine className="h-3.5 w-3.5" />
              Edit About
            </Link>
          </div>
        )}
        <AnimatedSectionHeader title="About Me" />
        <div className="grid items-center gap-10 lg:grid-cols-2">
          {(aboutPoints.length > 0 || !isReadOnly) && (
            <motion.div
              className="glass-card h-full"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.55 }}
            >
              <span className="accent-chip">Who I Am</span>
              {aboutPoints.length > 0 ? (
                <div className="mt-4 space-y-4">
                  {aboutPoints.map((point, index) => (
                    <p key={`${point}-${index}`} className="break-words text-lg leading-relaxed text-slate-700 [overflow-wrap:anywhere] dark:text-slate-300">
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
          )}
          <motion.div
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 h-full"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.55 }}
          >
            {(skillHighlights.length > 0 ? skillHighlights : !isReadOnly ? [{ title: "No skills yet", description: "Create skills from Edit Portfolio Content." }] : []).map((skill, index) => (
              <div key={index} className="glass-card">
                <Sparkles className="h-7 w-7 text-cyan-600 dark:text-cyan-300" />
                <h3 className="mb-2 mt-4 break-words text-lg font-semibold text-slate-900 [overflow-wrap:anywhere] dark:text-slate-100">{skill.title}</h3>
                <p className="break-words text-sm text-slate-600 [overflow-wrap:anywhere] dark:text-slate-300">{skill.description}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}

