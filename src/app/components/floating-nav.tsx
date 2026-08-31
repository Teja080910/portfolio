"use client"

import { useStore, type StoreState } from "@/lib/store"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"

const devSections = [
  { id: "user", label: "Home" },
  { id: "about", label: "About" },
  { id: "experience", label: "Experience" },
  { id: "skills", label: "Skills" },
  { id: "projects", label: "Projects" },
  { id: "certificate", label: "Certificates" },
  { id: "education", label: "Education" },
  { id: "contact", label: "Contact" },
]

const creatorSections = [
  { id: "user", label: "Home" },
  { id: "about", label: "About" },
  { id: "content-channels", label: "Channels" },
  { id: "content-portfolio", label: "Portfolio" },
  { id: "skills", label: "Skills" },
  { id: "creator-tools", label: "Tools" },
  { id: "collaborations", label: "Collaborations" },
  { id: "contact", label: "Contact" },
]

const marketerSections = [
  { id: "user", label: "Home" },
  { id: "about", label: "About" },
  { id: "experience", label: "Experience" },
  { id: "skills", label: "Skills" },
  { id: "projects", label: "Projects" },
  { id: "collaborations", label: "Collaborations" },
  { id: "contact", label: "Contact" },
]

type FloatingNavProps = {
  isReadOnly?: boolean
}

export default function FloatingNav({ isReadOnly = false }: FloatingNavProps) {
  const [activeSection, setActiveSection] = useState("user")
  const [scrolled, setScrolled] = useState(false)
  const user = useStore((state: StoreState) => state.user)
  const about = useStore((state: StoreState) => state.about)
  const experience = useStore((state: StoreState) => state.experience)
  const skills = useStore((state: StoreState) => state.skills)
  const projects = useStore((state: StoreState) => state.projects)
  const certificate = useStore((state: StoreState) => state.certificate)
  const education = useStore((state: StoreState) => state.education)
  const contentChannels = useStore((state: StoreState) => state.contentChannels)
  const contentWorks = useStore((state: StoreState) => state.contentWorks)
  const collaborations = useStore((state: StoreState) => state.collaborations)
  const creatorTools = useStore((state: StoreState) => state.creatorTools)

  const template = user.template || "software"
  const sections = template === "content_creator" ? creatorSections : template === "marketer" ? marketerSections : devSections

  const isSectionVisible = (sectionId: string) => {
    if (!isReadOnly) {
      return true
    }

    switch (sectionId) {
      case "user":
        return Boolean(user.show)
      case "about":
        return Boolean(about.show) && (Boolean(about.type?.trim()) || about.list.some((item) => item.trim()))
      case "experience":
        return experience.some((item) => item.show)
      case "skills":
        return skills.some((item) => item.show)
      case "projects":
        return projects.some((item) => item.show)
      case "certificate":
        return certificate.some((item) => item.show)
      case "education":
        return education.some((item) => item.show)
      case "contact":
        return Boolean(user.email || user.phone || user.firstname || user.lastname || user.username || user.role)
      case "content-channels":
        return contentChannels.some((item) => item.show)
      case "content-portfolio":
        return contentWorks.some((item) => item.show)
      case "collaborations":
        return collaborations.some((item) => item.show)
      case "creator-tools":
        return creatorTools.some((item) => item.show)
      default:
        return false
    }
  }

  const showSections = sections.filter((section) => isSectionVisible(section.id))

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        })
      },
      { threshold: 0.4 },
    )

    sections.forEach(({ id }) => {
      const element = document.getElementById(id)
      if (element) observer.observe(element)
    })

    return () => observer.disconnect()
  }, [])

  return (
    <motion.nav
      className="fixed right-4 top-1/2 z-50 hidden -translate-y-1/2 lg:block"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.8, duration: 0.45 }}
    >
      <div
        className={`rounded-2xl border border-border/50 p-2.5 shadow-lg backdrop-blur-xl transition-all duration-300 ${
          scrolled
            ? "bg-background/80 shadow-primary/5"
            : "bg-background/40"
        }`}
      >
        <div className="flex flex-col gap-2">
          {showSections?.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() =>
                document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
              }
              className="group relative flex items-center"
              aria-label={`Scroll to ${label}`}
            >
              {/* Tooltip */}
              <span
                className="pointer-events-none absolute right-10 rounded-lg bg-foreground px-2.5 py-1.5 text-xs font-medium text-background opacity-0 shadow-md transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0"
                style={{ transform: "translateX(4px)" }}
              >
                {label}
              </span>

              {/* Dot indicator */}
              <div
                className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${
                  activeSection === id
                    ? "scale-125 bg-primary shadow-lg shadow-primary/40"
                    : "bg-muted-foreground/30 hover:scale-110 hover:bg-muted-foreground/50"
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    </motion.nav>
  )
}
