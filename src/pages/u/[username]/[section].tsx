import PortfolioContentForm from "@/app/forms/portfolio-content.form"
import ProfileForm from "@/app/forms/profile.form"
import { getCurrentSession } from "@/lib/auth-session"
import { supabase } from "@/lib/db"
import Link from "next/link"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"

type PortfolioEditorSection = "about" | "skills" | "projects" | "experience" | "education" | "certificate" | null

type EditorView = "profile" | "portfolio"

const sectionToEditor: Record<string, { view: EditorView; focus: PortfolioEditorSection }> = {
  profile: { view: "profile", focus: null },
  "edit-about": { view: "portfolio", focus: "about" },
  "edit-skills": { view: "portfolio", focus: "skills" },
  "edit-projects": { view: "portfolio", focus: "projects" },
  "edit-experience": { view: "portfolio", focus: "experience" },
  "edit-education": { view: "portfolio", focus: "education" },
  "edit-certificate": { view: "portfolio", focus: "certificate" },
}

export default function UserEditorBySectionPage() {
  const router = useRouter()

  // Freeze the query params so we don't lose them during the AnimatePresence exit animation
  const [frozenQuery, setFrozenQuery] = useState({
    username: router?.query?.username,
    section: router?.query?.section
  })

  useEffect(() => {
    // Only update our frozen state if the query actually contains section parameters
    if (router?.isReady && router?.query?.section) {
      setFrozenQuery({
        username: router.query?.username,
        section: router.query?.section
      })
    }
  }, [router?.isReady, router?.query?.username, router?.query?.section])

  // Use current valid query if available, otherwise fall back to our frozen state during exit animation
  const rawParams = {
    username: router?.isReady && router?.query?.section ? router.query?.username : frozenQuery.username,
    section: router?.isReady && router?.query?.section ? router.query?.section : frozenQuery.section
  }

  const username = typeof rawParams.username === "string" ? rawParams.username : ""
  const section = typeof rawParams.section === "string" ? rawParams.section : "profile"
  
  const [isAuthorizing, setIsAuthorizing] = useState(true)
  const [routeError, setRouteError] = useState<"not_found" | "wrong_type" | null>(null)

  const editorConfig = sectionToEditor[section] ?? sectionToEditor.profile

  useEffect(() => {
    if (!router?.isReady) {
      return
    }

    let isActive = true

    const verifyEditorAccess = async () => {
      try {
        // First, validate that the profile at this username is allowed on /u/ route
        if (username) {
          const { data: urlProfile } = await supabase
            .from("profiles")
            .select("type")
            .eq("username", username)
            .maybeSingle()

          if (!urlProfile) {
            if (isActive) {
              setRouteError("not_found")
            }
            return
          }

          // /u/ route is only for individual users, not team or business
          if (urlProfile.type === "team" || urlProfile.type === "business") {
            if (isActive) {
              setRouteError("wrong_type")
            }
            return
          }
        }

        const { data } = await getCurrentSession()
        const sessionUser = data.session?.user

        if (!sessionUser) {
          if (isActive) {
            void router.replace("/sign-in")
          }
          return
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", sessionUser.id)
          .maybeSingle()

        const sessionUsername = profile?.username?.trim() || ""

        if (sessionUsername && username && sessionUsername !== username) {
          if (isActive) {
            void router.replace(`/u/${encodeURIComponent(sessionUsername)}/${section}`)
          }
          return
        }

        if (isActive) {
          setIsAuthorizing(false)
        }
      } catch (err) {
        console.error("verifyEditorAccess failed:", err)
        if (isActive) {
          setIsAuthorizing(false)
        }
      }
    }

    void verifyEditorAccess()

    return () => {
      isActive = false
    }
  }, [router, router.isReady, section, username])

  // Show "not found" if the profile doesn't exist or is the wrong type for /u/ route
  if (routeError === "not_found") {
    return (
      <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden px-6 transition-colors duration-300">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(20,184,166,0.12),transparent_24%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.22),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(45,212,191,0.18),transparent_34%)]" />
        <div className="relative w-full max-w-md rounded-3xl border border-slate-200/70 bg-white/80 p-8 text-center text-slate-900 shadow-xl backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/70 dark:text-slate-100">
          <h2 className="text-2xl font-bold tracking-tight">Portfolio Not Found</h2>
          <p className="mt-3 text-slate-600 dark:text-slate-300">
            The portfolio for <span className="font-semibold text-cyan-600 dark:text-cyan-400">@{username}</span> doesn{"'"}t exist or has been set to private.
          </p>
          <Link
            href="/"
            className="mt-8 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-cyan-600 to-teal-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:from-cyan-500 hover:to-teal-400"
          >
            Go to Homepage
          </Link>
        </div>
      </main>
    )
  }

  if (routeError === "wrong_type") {
    return (
      <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden px-6 transition-colors duration-300">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(20,184,166,0.12),transparent_24%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.22),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(45,212,191,0.18),transparent_34%)]" />
        <div className="relative w-full max-w-md rounded-3xl border border-slate-200/70 bg-white/80 p-8 text-center text-slate-900 shadow-xl backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/70 dark:text-slate-100">
          <h2 className="text-2xl font-bold tracking-tight">Incorrect Route</h2>
          <p className="mt-3 text-slate-600 dark:text-slate-300">
            This profile is registered as a <span className="font-semibold text-cyan-600 dark:text-cyan-400">team</span> account and cannot be accessed through the user route.
          </p>
          <Link
            href={`/t/${encodeURIComponent(username)}`}
            className="mt-8 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-cyan-600 to-teal-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:from-cyan-500 hover:to-teal-400"
          >
            Open as Team Profile
          </Link>
        </div>
      </main>
    )
  }

  if (isAuthorizing) {
    return (
      <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden px-6 transition-colors duration-300">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(20,184,166,0.12),transparent_24%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.22),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(45,212,191,0.18),transparent_34%)]" />
        <div className="relative w-full max-w-md rounded-3xl border border-slate-200/70 bg-white/80 p-8 text-center text-slate-900 shadow-xl backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/70 dark:text-slate-100">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent dark:border-cyan-300" />
          <h2 className="text-xl font-semibold">Opening editor</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Verifying account access for this section...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-10 transition-colors duration-300 md:px-6 md:py-14">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(20,184,166,0.16),transparent_24%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.22),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(45,212,191,0.18),transparent_34%),linear-gradient(160deg,rgba(15,23,42,0.92),rgba(17,24,39,0.98))]" />
      <div className="pointer-events-none absolute left-10 top-10 h-56 w-56 rounded-full bg-cyan-400/15 blur-3xl dark:bg-cyan-400/20" />
      <div className="pointer-events-none absolute bottom-10 right-10 h-56 w-56 rounded-full bg-teal-400/15 blur-3xl dark:bg-teal-400/20" />

      <div className="relative z-10 mx-auto max-w-7xl">
        {editorConfig.view === "profile" ? <ProfileForm /> : <PortfolioContentForm focusSection={editorConfig.focus} />}
      </div>
    </main>
  )
}
