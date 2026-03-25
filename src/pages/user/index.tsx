import PortfolioContentForm from "@/app/forms/portfolio-content.form"
import ProfileForm from "@/app/forms/profile.form"
import { useEffect, useState } from "react"

type UserEditorView = "profile" | "portfolio"

export default function UserProfilePage() {
  const [activeView, setActiveView] = useState<UserEditorView>("profile")

  useEffect(() => {
    const syncViewFromHash = () => {
      const hash = window.location.hash.replace("#", "")
      setActiveView(hash === "portfolio-content" ? "portfolio" : "profile")
    }

    syncViewFromHash()
    window.addEventListener("hashchange", syncViewFromHash)

    return () => {
      window.removeEventListener("hashchange", syncViewFromHash)
    }
  }, [])

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-10 md:px-6 md:py-14">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(20,184,166,0.16),transparent_24%),linear-gradient(160deg,rgba(15,23,42,0.92),rgba(17,24,39,0.98))]" />
      <div className="pointer-events-none absolute left-10 top-10 h-56 w-56 rounded-full bg-cyan-400/15 blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 right-10 h-56 w-56 rounded-full bg-teal-400/15 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-7xl">
        {activeView === "profile" ? <ProfileForm /> : <PortfolioContentForm />}
      </div>
    </main>
  )
}
