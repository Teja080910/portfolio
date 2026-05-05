import PortfolioContentForm from "@/app/forms/portfolio-content.form"
import ProfileForm from "@/app/forms/profile.form"
import { useEffect, useState } from "react"

type UserEditorView = "profile" | "portfolio"
type PortfolioEditorSection = "about" | "skills" | "projects" | "experience" | "education" | "certificate" | null

const portfolioHashes = new Set([
  "portfolio-content",
  "edit-about",
  "edit-skills",
  "edit-projects",
  "edit-experience",
  "edit-education",
  "edit-certificate",
])

const sectionByHash: Record<string, Exclude<PortfolioEditorSection, null>> = {
  "edit-about": "about",
  "edit-skills": "skills",
  "edit-projects": "projects",
  "edit-experience": "experience",
  "edit-education": "education",
  "edit-certificate": "certificate",
}

const getEditorStateFromHash = () => {
  if (typeof window === "undefined") {
    return { view: "profile" as UserEditorView, section: null as PortfolioEditorSection }
  }

  const hash = window.location.hash.replace("#", "")

  return {
    view: portfolioHashes.has(hash) ? "portfolio" as UserEditorView : "profile" as UserEditorView,
    section: sectionByHash[hash] ?? null,
  }
}

export default function UserProfilePage() {
  const [activeView, setActiveView] = useState<UserEditorView>("profile")
  const [activePortfolioSection, setActivePortfolioSection] = useState<PortfolioEditorSection>(null)
  const [isViewReady, setIsViewReady] = useState(false)

  useEffect(() => {
    const syncViewFromHash = () => {
      const nextState = getEditorStateFromHash()
      setActiveView(nextState.view)
      setActivePortfolioSection(nextState.section)
      setIsViewReady(true)
    }

    syncViewFromHash()
    window.addEventListener("hashchange", syncViewFromHash)

    return () => {
      window.removeEventListener("hashchange", syncViewFromHash)
    }
  }, [])

  useEffect(() => {
    if (!isViewReady) {
      return
    }

    const hash = window.location.hash.replace("#", "")
    if (!hash) {
      return
    }

    window.setTimeout(() => {
      const element = document.getElementById(hash)
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" })
      }
    }, 100)
  }, [activeView, isViewReady])

  if (!isViewReady) {
    return (
      <main className="relative isolate min-h-screen overflow-hidden px-4 py-10 transition-colors duration-300 md:px-6 md:py-14">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(20,184,166,0.12),transparent_24%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.22),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(20,184,166,0.18),transparent_24%)]" />
        <div className="pointer-events-none absolute left-10 top-10 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl dark:bg-cyan-400/15" />
        <div className="pointer-events-none absolute bottom-10 right-10 h-56 w-56 rounded-full bg-teal-400/10 blur-3xl dark:bg-teal-400/15" />

        <div className="relative z-10 mx-auto flex min-h-[60vh] max-w-7xl items-center justify-center">
          <div className="w-full max-w-md rounded-3xl border border-slate-200/70 bg-white/80 p-8 text-center text-slate-900 shadow-xl backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/70 dark:text-slate-100">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent dark:border-cyan-300" />
            <h2 className="text-xl font-semibold">Opening editor</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Restoring your last editor section...</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-10 md:px-6 md:py-14">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(20,184,166,0.16),transparent_24%),linear-gradient(160deg,rgba(15,23,42,0.92),rgba(17,24,39,0.98))]" />
      <div className="pointer-events-none absolute left-10 top-10 h-56 w-56 rounded-full bg-cyan-400/15 blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 right-10 h-56 w-56 rounded-full bg-teal-400/15 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-7xl">
        {activeView === "profile" ? <ProfileForm /> : <PortfolioContentForm focusSection={activePortfolioSection} />}
      </div>
    </main>
  )
}
