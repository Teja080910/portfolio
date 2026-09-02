"use client"

import { useStore } from "@/lib/store"
import { motion } from "framer-motion"
import { Compass, PencilLine, Rocket, Sparkles, Users, Tv, TrendingUp } from "lucide-react"
import Link from "next/link"
import AnimatedSectionHeader from "../../app/components/animatedsectionheader"

type AboutProps = {
  isReadOnly?: boolean
}

const looksLikeNoise = (text: string) => {
  const normalized = text.toLowerCase().replace(/[^a-z]/g, "")
  if (normalized.length < 24) {
    return false
  }

  const vowels = (normalized.match(/[aeiou]/g) ?? []).length
  const vowelRatio = vowels / normalized.length
  const longTokens = text.split(/\s+/).filter((token) => token.length > 18).length

  return vowelRatio < 0.23 || longTokens >= 2
}

const highlightIcons = {
  compass: Compass,
  rocket: Rocket,
  users: Users,
  sparkles: Sparkles,
  tv: Tv,
  trendingup: TrendingUp,
} as const

const highlightColors = [
  "from-primary/20 to-purple-500/20 border-primary/30",
  "from-purple-500/20 to-pink-500/20 border-purple-500/30",
  "from-pink-500/20 to-rose-500/20 border-pink-500/30",
  "from-cyan-500/20 to-primary/20 border-cyan-500/30",
  "from-amber-500/20 to-orange-500/20 border-amber-500/30",
  "from-emerald-500/20 to-teal-500/20 border-emerald-500/30",
]

export default function About({ isReadOnly = false }: AboutProps) {
  const about = useStore((state) => state.about)
  const user = useStore((state) => state.user)
  const projects = useStore((state) => state.projects)
  const experiences = useStore((state) => state.experience)
  const education = useStore((state) => state.education)
  const contentWorks = useStore((state) => state.contentWorks)
  const contentChannels = useStore((state) => state.contentChannels)
  const collaborations = useStore((state) => state.collaborations)
  const creatorTools = useStore((state) => state.creatorTools)
  const userId = useStore((state) => state.user.id)
  const username = useStore((state) => state.user.username)
  const editAboutHref = `/u/${encodeURIComponent(username || "me")}/edit-about`

  const template = user.template || "software"
  const isCreator = template === "content_creator"
  const isMarketer = template === "marketer"

  const aboutPoints = (about.list ?? []).map((item) => item.trim()).filter(Boolean)
  const hasReadableAbout = aboutPoints.some((point) => !looksLikeNoise(point))
  const displayAboutPoints = hasReadableAbout ? aboutPoints : []
  const visibleProjectsList = projects.filter((item) => item.show && (item.name || item.description))
  const visibleExperienceList = experiences.filter((item) => item.show && (item.type || item.role || item.decription))
  const visibleEducationList = education.filter((item) => item.show && (item.name || item.course))
  const visibleProjects = visibleProjectsList.length
  const visibleExperience = visibleExperienceList.length
  const visibleEducation = visibleEducationList.length
  const visibleContentWorks = contentWorks.filter((item) => item.show && (item.title || item.url)).length
  const visibleChannels = contentChannels.filter((item) => item.show && (item.platform || item.handle)).length
  const visibleCollabs = collaborations.filter((item) => item.show && (item.brand)).length
  const visibleTools = creatorTools.filter((item) => item.show && (item.name)).length

  const aboutHeading = about.type?.trim()
  const roleLabel = user.role?.trim()
  const primaryProject = visibleProjectsList.find((item) => item.name?.trim())?.name?.trim()
  const primaryExperience = visibleExperienceList.find((item) => item.role?.trim() || item.type?.trim())
  const primaryExperienceLabel = primaryExperience?.role?.trim() || primaryExperience?.type?.trim()
  const primaryEducation = visibleEducationList.find((item) => item.course?.trim() || item.name?.trim())
  const primaryEducationLabel = primaryEducation?.course?.trim() || primaryEducation?.name?.trim()
  const customHighlights = (about.highlights ?? [])
    .filter((item) => item.show && (item.title?.trim() || item.description?.trim()))
    .map((item) => {
      const iconName = item.icon?.toLowerCase() as keyof typeof highlightIcons
      return {
        ...item,
        icon: highlightIcons[iconName] || Compass,
      }
    })

  const trendSignals = isCreator
    ? [
        user.role?.trim() || "Open to opportunities",
        visibleChannels > 0 ? `${visibleChannels} channel${visibleChannels === 1 ? "" : "s"}` : "Building channels",
        visibleContentWorks > 0 ? `${visibleContentWorks} content piece${visibleContentWorks === 1 ? "" : "s"}` : "Creating content",
      ]
    : isMarketer
      ? [
          user.role?.trim() || "Open to opportunities",
          visibleCollabs > 0 ? `${visibleCollabs} collaboratio${visibleCollabs === 1 ? "n" : "ns"}` : "Building partnerships",
          visibleProjects > 0 ? `${visibleProjects} campaign${visibleProjects === 1 ? "" : "s"}` : "Running campaigns",
        ]
      : [
          user.role?.trim() || "Open to opportunities",
          visibleProjects > 0 ? `${visibleProjects} live project${visibleProjects === 1 ? "" : "s"}` : "Projects in progress",
          visibleExperience > 0 ? `${visibleExperience} experience entr${visibleExperience === 1 ? "y" : "ies"}` : "Experience building",
        ]

  const portfolioHighlights = isCreator
    ? [
        {
          id: "default-creator-role",
          title: aboutHeading || roleLabel || "Current Focus",
          description: user.role?.trim()
            ? `Working as ${user.role.trim()} and creating impactful digital content.`
            : "Creating content that connects, inspires, and grows communities.",
          icon: Tv,
        },
        {
          id: "default-creator-content",
          title: `${visibleContentWorks || 0} Content Piece${visibleContentWorks === 1 ? "" : "s"}`,
          description:
            visibleContentWorks > 0
              ? `${visibleContentWorks} content piece${visibleContentWorks === 1 ? "" : "s"} published, with growing engagement and reach.`
              : "Crafting engaging content across platforms with consistent quality.",
          icon: Sparkles,
        },
        {
          id: "default-creator-channels",
          title: `${visibleChannels || 0} Channel${visibleChannels === 1 ? "" : "s"}`,
          description:
            visibleChannels > 0
              ? `Active on ${visibleChannels} platform${visibleChannels === 1 ? "" : "s"}, building a loyal audience.`
              : "Expanding presence across multiple content platforms.",
          icon: Users,
        },
      ]
    : isMarketer
      ? [
          {
            id: "default-marketer-role",
            title: aboutHeading || roleLabel || "Current Focus",
            description: user.role?.trim()
              ? `Working as ${user.role.trim()} and driving growth through data-driven strategies.`
              : "Driving growth through data-driven marketing strategies.",
            icon: Compass,
          },
          {
            id: "default-marketer-campaigns",
            title: `${visibleProjects || 0} Campaign${visibleProjects === 1 ? "" : "s"}`,
            description:
              visibleProjects > 0
                ? `${visibleProjects} campaign${visibleProjects === 1 ? "" : "s"} delivered with measurable results.`
                : "Building and optimizing campaigns that deliver measurable outcomes.",
            icon: Rocket,
          },
          {
            id: "default-marketer-collabs",
            title: `${visibleCollabs || 0} Collaboratio${visibleCollabs === 1 ? "n" : "ns"}`,
            description:
              visibleCollabs > 0
                ? `Partnered with ${visibleCollabs} brand${visibleCollabs === 1 ? "" : "s"} on successful campaigns.`
                : "Growing partnerships and brand relationships.",
            icon: Users,
          },
        ]
      : [
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

  const hasHighlightContent = Boolean(user.role?.trim()) || visibleProjects > 0 || visibleExperience > 0 || visibleEducation > 0 || visibleContentWorks > 0 || visibleChannels > 0
  const aboutChipLabel = aboutHeading || roleLabel || "Who I Am Now"

  if (isReadOnly && aboutPoints.length === 0 && !hasHighlightContent) {
    return null
  }

  return (
    <section id="about" className="section-shell">
      {/* Background gradient */}
      <div className="orb left-[-15%] top-[-10%] h-[35%] w-[35%] bg-primary/5 dark:bg-primary/10" />
      <div className="orb bottom-[-10%] right-[-10%] h-[30%] w-[30%] bg-purple-500/5 dark:bg-purple-500/10" />

      <div className="surface-grid relative z-10">
        {!isReadOnly && userId && (
          <div className="mb-6 flex justify-end">
            <Link
              href={editAboutHref}
              scroll={false}
              className="inline-flex items-center gap-2 rounded-xl border border-border/50 bg-card/50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:text-primary"
            >
              <PencilLine className="h-3.5 w-3.5" />
              Edit About
            </Link>
          </div>
        )}

        <AnimatedSectionHeader title="About Me" subtitle="A glimpse into who I am and what drives me." />

        <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-16">
          {/* About description */}
          {(aboutPoints.length > 0 || !isReadOnly) && (
            <motion.div
              initial={{ opacity: 0, y: 26 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.35 }}
              transition={{ duration: 0.5 }}
            >
              <div className="glass-card relative overflow-hidden">
                <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
                <div className="relative z-10">
                  <span className="accent-chip">{aboutChipLabel}</span>

                  {displayAboutPoints.length > 0 ? (
                    <div className="mt-6 space-y-4">
                      {displayAboutPoints.map((point, index) => (
                        <p
                          key={`${point}-${index}`}
                          className="break-words text-base leading-relaxed text-foreground/80 [overflow-wrap:anywhere] md:text-lg"
                        >
                          {point}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="mb-2 mt-6 text-lg leading-relaxed text-muted-foreground">
                      Add your about details from <strong>Edit Portfolio Content</strong> to replace this empty state.
                    </p>
                  )}

                  {/* Trend signals */}
                  <div className="mt-8 flex flex-wrap gap-2">
                    {trendSignals.map((signal) => (
                      <span
                        key={signal}
                        className="skill-badge"
                      >
                        {signal}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Highlights grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {renderedHighlights.map((item, index) => {
              const colorClass = highlightColors[index % highlightColors.length]
              const IconComponent = item.icon

              return (
                <motion.div
                  key={item.id || index}
                  initial={{ opacity: 0, y: 26 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false, amount: 0.35 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className={`glass-card group relative h-full overflow-hidden border ${colorClass}`}>
                    <div className="relative z-10">
                      {/* Number */}
                      <span className="absolute right-3 top-3 text-[10px] font-bold tracking-[0.15em] text-muted-foreground/30">
                        {String(index + 1).padStart(2, "0")}
                      </span>

                      {/* Icon */}
                      <div className="mb-3 inline-flex rounded-xl border border-border/50 bg-background/50 p-2.5">
                        <IconComponent className="h-5 w-5 text-primary transition-transform duration-300 group-hover:scale-110" />
                      </div>

                      {/* Title */}
                      <h3 className="mb-2 text-base font-semibold text-foreground">
                        {item.title}
                      </h3>

                      {/* Description */}
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
