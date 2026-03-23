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

export default function FloatingNav() {
  const [activeSection, setActiveSection] = useState("user")
  const store = useStore((state) => state as StoreState)

  const isSectionVisible = (sectionId: string) => {
    switch (sectionId) {
      case "user":
        return store.user.show
      case "about":
        return Boolean(store.about.show) && (Boolean(store.about.type?.trim()) || store.about.list.some((item) => item.trim()))
      case "experience":
        return store.experience.some((item) => item.show)
      case "skills":
        return store.skills.some((item) => item.show)
      case "projects":
        return store.projects.some((item) => item.show)
      case "certificate":
        return store.certificate.some((item) => item.show)
      case "education":
        return store.education.some((item) => item.show)
      case "contact":
        return Boolean(store.user.id)
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