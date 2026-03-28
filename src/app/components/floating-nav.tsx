"use client"

import { useStore, type StoreState } from "@/lib/store"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"

const sections = [
  { id: "user", label: "Home" },
  { id: "about", label: "About" },
  { id: "experience", label: "Experience" },
  { id: "skills", label: "Skills" },
  { id: "projects", label: "Projects" },
  { id: "certificate", label: "Certiticates" },
  { id: "education", label: "Education" },
  { id: "contact", label: "Contact" },
]

type FloatingNavProps = {
  isReadOnly?: boolean
}

export default function FloatingNav({ isReadOnly = false }: FloatingNavProps) {
  const [activeSection, setActiveSection] = useState("user")
  const user = useStore((state: StoreState) => state.user)
  const about = useStore((state: StoreState) => state.about)
  const experience = useStore((state: StoreState) => state.experience)
  const skills = useStore((state: StoreState) => state.skills)
  const projects = useStore((state: StoreState) => state.projects)
  const certificate = useStore((state: StoreState) => state.certificate)
  const education = useStore((state: StoreState) => state.education)

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
      default:
        return false
    }
  }

  const showSections = sections.filter((section) => isSectionVisible(section.id))

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        })
      },
      { threshold: 0.5 },
    )

    sections.forEach(({ id }) => {
      const element = document.getElementById(id)
      if (element) observer.observe(element)
    })

    return () => observer.disconnect()
  }, [])

  return (
    <motion.div
      className="fixed right-4 top-1/2 z-50 -translate-y-1/2"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.8, duration: 0.45 }}
    >
      <div className="rounded-full border border-slate-200/70 bg-white/80 p-3 shadow-xl backdrop-blur-md dark:border-slate-700/70 dark:bg-slate-900/75">
        <div className="flex flex-col gap-3">
        {showSections?.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })}
            className="group relative flex items-center"
            aria-label={`Scroll to ${label}`}
          >
            <span className="pointer-events-none absolute right-9 rounded-md bg-slate-900 px-2 py-1 text-xs font-medium text-slate-100 opacity-0 shadow-md transition-opacity duration-300 group-hover:opacity-100 dark:bg-slate-100 dark:text-slate-900">
              {label}
            </span>
            <div
              className={`h-3 w-3 rounded-full transition-all duration-300 ${
                activeSection === id
                  ? "scale-125 bg-cyan-500 shadow-[0_0_16px_rgba(6,182,212,0.65)]"
                  : "bg-slate-400 hover:scale-110 dark:bg-slate-500"
                }`}
            />
          </button>
        ))}
        </div>
      </div>
    </motion.div>
  )
}
