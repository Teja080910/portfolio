"use client"

import { useStore } from "@/lib/store"
import { motion } from "framer-motion"
import { Compass, PencilLine, Rocket, Sparkles, Users } from "lucide-react"
import Link from "next/link"
import { useRef } from "react"
import AnimatedSectionHeader from "../../app/components/animatedsectionheader"

type AboutProps = {
  isReadOnly?: boolean
}

const fallbackAboutPoints = [
  "I build fast, scalable web experiences with a product-first mindset and clean engineering standards.",
  "My workflow is AI-assisted, API-driven, and focused on shipping value in short feedback loops.",
  "I care about performance, accessibility, and interfaces that feel modern on both desktop and mobile.",
]

const looksLikeNoise = (text: string) => {
  const normalized = text.toLowerCase().replace(/[^a-z]/g, "")
  if (normalized.length < 24) {
    return false
  }

  const vowels = (normalized.match(/[aeiou]/g) ?? []).length
  const vowelRatio = vowels / normalized.length
  const longTokens = text.split(/\s+/).filter((token) => token.length > 18).length

  // Very long random-looking tokens and unusually low vowel ratio are good gibberish indicators.
  return vowelRatio < 0.23 || longTokens >= 2
}

const highlightIcons = {
  compass: Compass,
  rocket: Rocket,
  users: Users,
  sparkles: Sparkles,
} as const

export default function About({ isReadOnly = false }: AboutProps) {
  const about = useStore((state) => state.about)
  const user = useStore((state) => state.user)
  const projects = useStore((state) => state.projects)
  const experiences = useStore((state) => state.experience)
  const education = useStore((state) => state.education)
  const userId = useStore((state) => state.user.id)
  const username = useStore((state) => state.user.username)
  const editAboutHref = `/u/${encodeURIComponent(username || "me")}/edit-about`
  const sectionRef = useRef<HTMLElement | null>(null)

  const aboutPoints = (about.list ?? []).map((item) => item.trim()).filter(Boolean)
  const hasReadableAbout = aboutPoints.some((point) => !looksLikeNoise(point))
  const displayAboutPoints = hasReadableAbout ? aboutPoints : fallbackAboutPoints
  const visibleProjectsList = projects.filter((item) => item.show && (item.name || item.description))
  const visibleExperienceList = experiences.filter((item) => item.show && (item.type || item.role || item.decription))
  const visibleEducationList = education.filter((item) => item.show && (item.name || item.course))
  const visibleProjects = visibleProjectsList.length
  const visibleExperience = visibleExperienceList.length
  const visibleEducation = visibleEducationList.length

  const aboutHeading = about.type?.trim()
  const roleLabel = user.role?.trim()
  const primaryProject = visibleProjectsList.find((item) => item.name?.trim())?.name?.trim()
  const primaryExperience = visibleExperienceList.find((item) => item.role?.trim() || item.type?.trim())
  const primaryExperienceLabel = primaryExperience?.role?.trim() || primaryExperience?.type?.trim()
  const primaryEducation = visibleEducationList.find((item) => item.course?.trim() || item.name?.trim())
  const primaryEducationLabel = primaryEducation?.course?.trim() || primaryEducation?.name?.trim()
  const customHighlights = (about.highlights ?? [])
    .filter((item) => item.show && (item.title?.trim() || item.description?.trim()))
    .slice(0, 4)
    .map((item) => {
      const iconName = item.icon?.toLowerCase() as keyof typeof highlightIcons
      return {
        ...item,
        icon: highlightIcons[iconName] || Compass,
      }
    })

  const trendSignals = [
    user.role?.trim() || "Open to opportunities",
    visibleProjects > 0 ? `${visibleProjects} live project${visibleProjects === 1 ? "" : "s"}` : "Projects in progress",
    visibleExperience > 0 ? `${visibleExperience} experience entr${visibleExperience === 1 ? "y" : "ies"}` : "Experience building",
    visibleEducation > 0 ? `${visibleEducation} education entr${visibleEducation === 1 ? "y" : "ies"}` : "Continuous learning",
  ]
    .filter(Boolean)
    .slice(0, 3)

  const portfolioHighlights = [
    {
      id: "default-highlight-focus",
      title: aboutHeading || roleLabel || "Current Focus",
      description: user.role?.trim()
        ? `Working as ${user.role.trim()} and building with a modern product + engineering mindset.`
        : "Focused on shipping modern digital products with strong UX and reliable engineering.",
      icon: Compass,
    },
    {
      id: "default-highlight-project",
      title: primaryProject ? `Project: ${primaryProject}` : `${visibleProjects || 0} Project${visibleProjects === 1 ? "" : "s"}`,
      description:
        visibleProjects > 0
          ? `${visibleProjects} portfolio project${visibleProjects === 1 ? "" : "s"} published, with iterative improvements and measurable outcomes.`
          : "Actively building and refining projects with short feedback loops.",
      icon: Rocket,
    },
    {
      id: "default-highlight-growth",
      title: primaryExperienceLabel
        ? `Role: ${primaryExperienceLabel}`
        : primaryEducationLabel
          ? `Learning: ${primaryEducationLabel}`
          : "Growth Path",
      description:
        visibleExperience > 0 || visibleEducation > 0
          ? `Showcasing ${visibleExperience} experience entr${visibleExperience === 1 ? "y" : "ies"} and ${visibleEducation} education entr${visibleEducation === 1 ? "y" : "ies"}.`
          : "Growing through practical work, continuous learning, and collaboration.",
      icon: Users,
    },
  ]
  const renderedHighlights = customHighlights.length > 0 ? customHighlights : portfolioHighlights

  const hasHighlightContent = Boolean(user.role?.trim()) || visibleProjects > 0 || visibleExperience > 0 || visibleEducation > 0
  const aboutChipLabel = aboutHeading || roleLabel || "Who I Am Now"

  if (isReadOnly && aboutPoints.length === 0 && !hasHighlightContent) {
    return null
  }

  return (
    <section id="about" className="section-shell" ref={sectionRef}>
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
              className="glass-card relative h-full min-h-[280px] overflow-hidden"
              initial={{ opacity: 0, x: -80, scale: 0.96 }}
              whileInView={{ opacity: 1, x: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.25, margin: "-40px" }}
              transition={{ duration: 0.7, ease: "easeOut", delay: 0.25 }}
            >
              <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-cyan-400/20 blur-3xl dark:bg-cyan-300/20" />
              <span className="accent-chip">{aboutChipLabel}</span>
              {displayAboutPoints.length > 0 ? (
                <div className="mt-5 space-y-4">
                  {displayAboutPoints.map((point, index) => (
                    <p key={`${point}-${index}`} className="break-words text-base leading-relaxed text-slate-700 [overflow-wrap:anywhere] md:text-lg dark:text-slate-300">
                      {point}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="mb-2 mt-4 text-lg leading-relaxed text-slate-700 dark:text-slate-300">
                  Add your about details from <strong>Edit Portfolio Content</strong> to replace this empty state.
                </p>
              )}

              <div className="mt-6 flex flex-wrap gap-2">
                {trendSignals.map((signal) => (
                  <span
                    key={signal}
                    className="rounded-full border border-cyan-300/60 bg-cyan-50/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-700 dark:border-cyan-500/40 dark:bg-cyan-500/15 dark:text-cyan-200"
                  >
                    {signal}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
          <motion.div
            className="grid h-full grid-cols-1 gap-4 sm:grid-cols-2"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false, margin: "-50px" }}
            transition={{ duration: 0.55 }}
          >
            {renderedHighlights.map((item, index) => (
              <motion.div
                key={item.id || index}
                className="glass-card group relative"
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.4, delay: 0.08 * index }}
              >
                <div className="pointer-events-none absolute right-4 top-4 text-xs font-semibold tracking-[0.12em] text-cyan-600/70 dark:text-cyan-300/70">
                  0{index + 1}
                </div>
                <item.icon className="h-7 w-7 text-cyan-600 transition-transform duration-300 group-hover:scale-110 dark:text-cyan-300" />
                <h3 className="mb-2 mt-4 break-words text-lg font-semibold text-slate-900 [overflow-wrap:anywhere] dark:text-slate-100">{item.title}</h3>
                <p className="break-words text-sm leading-relaxed text-slate-600 [overflow-wrap:anywhere] dark:text-slate-300">{item.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}

