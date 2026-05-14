"use client"

import { ModeToggle } from "@/app/components/mode-toggle"
import { Button } from "@/components/ui/button"
import {
  createId,
  mapCertificatesContent,
  mapEducationContent,
  mapExperienceContent,
  mapProjectsContent,
  mapSkillsContent,
} from "@/lib/content-mappers"
import { supabase } from "@/lib/db"
import Image from "next/image"
import { getProxiedImageUrl } from "@/lib/image-proxy"
import { useStore } from "@/lib/store"
import { ChevronLeft, Compass, Loader2, LogOut, Sparkles, X } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/router"
import { ChangeEvent, useEffect, useState } from "react"
import { usePopup } from "@/app/components/popup"

export default function AuthActions() {
  const router = useRouter()
  const user = useStore((state) => state.user)
  const removeUser = useStore((state) => state.removeUser)
  const about = useStore((state) => state.about)
  const setAbout = useStore((state) => state.setAbout)
  const setSkills = useStore((state) => state.setSkills)
  const setExperience = useStore((state) => state.setExperience)
  const setEducation = useStore((state) => state.setEducation)
  const setProjects = useStore((state) => state.setProjects)
  const setCertificate = useStore((state) => state.setCertificate)

  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { showPopup } = usePopup()

  useEffect(() => {
    let isMounted = true

    const syncSessionState = async () => {
      const { data } = await supabase.auth.getSession()
      if (isMounted) {
        setIsAuthenticated(Boolean(data.session?.user))
        setIsLoading(false)
      }
    }

    void syncSessionState()

    const { data: authSubscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setIsAuthenticated(Boolean(session?.user))
      }
    })

    return () => {
      isMounted = false
      authSubscription.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!showLogoutConfirm) return

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isLoggingOut) {
        setShowLogoutConfirm(false)
      }
    }

    window.addEventListener("keydown", handleEscape)
    return () => window.removeEventListener("keydown", handleEscape)
  }, [showLogoutConfirm, isLoggingOut])

  const displayName =
    `${user?.firstname || ""} ${user?.lastname || ""}`.trim() || user?.username || user?.email || "User"

  const handleLogout = async () => {
    if (isLoggingOut) return

    setIsLoggingOut(true)
    try {
      await supabase.auth.signOut()
      removeUser()
      setShowLogoutConfirm(false)
      setIsAuthenticated(false)
      await router.replace("/sign-in")
    } finally {
      setIsLoggingOut(false)
    }
  }

  const handleResumeUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsExtracting(true)

    const readFileAsBase64 = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          const base64data = (reader.result as string).split(",")[1]
          resolve(base64data)
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
    }

    try {
      const base64data = await readFileAsBase64(file)

      const response = await fetch("/api/parse-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileBase64: base64data }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to extract resume. Make sure your GEMINI_API_KEY is configured correctly.")
      }

      const data = await response.json()
      const person = user.id || "temp-id"

      const parsedAbout = data.about || {}
      const aboutPayload = {
        id: about?.id || createId(),
        person,
        type: (parsedAbout.type || "").trim(),
        list: Array.isArray(parsedAbout.list) ? parsedAbout.list : [],
        show: parsedAbout.show ?? true,
        highlights: about?.highlights || [],
      }

      const skillsPayload = mapSkillsContent(data.skills, person)
      const experiencePayload = mapExperienceContent(data.experience, person)
      const educationPayload = mapEducationContent(data.education, person)
      const projectsPayload = mapProjectsContent(data.projects, person)
      const certificatesPayload = mapCertificatesContent(data.certificates, person)

      const { error } = await supabase.from("portfolio_contents").upsert(
        {
          user_id: person,
          about: aboutPayload,
          skills: skillsPayload,
          projects: projectsPayload,
          experience: experiencePayload,
          education: educationPayload,
          certificates: certificatesPayload,
        },
        { onConflict: "user_id" },
      )

      if (error) {
        throw new Error("Extracted successfully, but failed to save to database: " + error.message)
      }

      setAbout(aboutPayload)
      setSkills(skillsPayload)
      setExperience(experiencePayload)
      setEducation(educationPayload)
      setProjects(projectsPayload)
      setCertificate(certificatesPayload)

      showPopup("Successfully extracted and seeded your portfolio data!")
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to extract data."
      showPopup(message, "error")
    } finally {
      setIsExtracting(false)
      event.target.value = ""
    }
  }

  if (isLoading) {
    return null
  }

  if (!isAuthenticated) {
    return (
      <div className="relative">
        {!isExpanded && (
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300/80 bg-white/90 shadow-sm backdrop-blur transition-all hover:bg-white hover:shadow-md dark:border-slate-700 dark:bg-slate-900/85 dark:hover:bg-slate-800"
            aria-label="Show actions"
          >
            <ChevronLeft className="h-5 w-5 text-slate-600 dark:text-slate-300" />
          </button>
        )}
        {isExpanded && (
          <div className="flex items-center gap-2 rounded-full border border-slate-300/80 bg-white/90 px-2 py-1 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/85">
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              aria-label="Hide actions"
            >
              <ChevronLeft className="h-4 w-4 rotate-180" />
            </button>
            <Link href="/">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 rounded-full px-3 text-xs font-semibold text-slate-700 transition-colors hover:bg-cyan-50 hover:text-cyan-700 dark:text-slate-200 dark:hover:bg-cyan-500/10 dark:hover:text-cyan-300"
              >
                <Compass className="h-3.5 w-3.5" />
                Explore
              </Button>
            </Link>
            <ModeToggle />
            <Link href="/sign-in">
              <Button
                variant="default"
                size="sm"
                className="h-8 rounded-full bg-gradient-to-r from-cyan-600 to-teal-500 px-4 text-xs font-semibold text-white hover:from-cyan-500 hover:to-teal-400"
              >
                Sign In
              </Button>
            </Link>
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="relative">

        {/* Collapsed expand button */}
        {!isExpanded && (
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300/80 bg-white/90 shadow-sm backdrop-blur transition-all hover:bg-white hover:shadow-md dark:border-slate-700 dark:bg-slate-900/85 dark:hover:bg-slate-800"
            aria-label="Show actions"
          >
            <ChevronLeft className="h-5 w-5 text-slate-600 dark:text-slate-300" />
          </button>
        )}

        {/* Expanded action bar */}
        {isExpanded && (
              <div className="flex items-center gap-2 rounded-full border border-slate-300/80 bg-white/90 px-2 py-1 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/85">
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  aria-label="Hide actions"
                >
                  <ChevronLeft className="h-4 w-4 rotate-180" />
                </button>
      <div className="flex items-center gap-2 rounded-full border border-slate-300/80 bg-white/90 px-2 py-1 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/85">
        <label
          className={`cursor-pointer inline-flex items-center gap-1.5 rounded-full bg-cyan-50/80 px-2 py-1 text-xs font-semibold text-cyan-700 transition-colors hover:bg-cyan-100 dark:bg-cyan-500/10 dark:text-cyan-300 ${isExtracting ? "opacity-75 cursor-wait" : ""}`}
          title="Auto-fill from Resume"
        >
          {isExtracting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          <span className="hidden sm:inline">{isExtracting ? "Extracting..." : "Auto-fill"}</span>
          <input
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={handleResumeUpload}
            disabled={isExtracting}
          />
        </label>

        <div className="hidden items-center gap-2 rounded-full bg-slate-100/80 px-2 py-1 text-xs text-slate-700 dark:bg-slate-800/80 dark:text-slate-200 sm:flex">
          <div className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-cyan-600 to-teal-500 text-[11px] font-semibold text-white shadow-sm">
            {user?.photo ? (
              <div className="relative h-full w-full">
                <Image
                  src={getProxiedImageUrl(user.photo) || ""}
                  alt={displayName}
                  fill
                  sizes="24px"
                  className="object-cover"
                />
              </div>
            ) : (
              <span>{displayName.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <span className="max-w-[120px] truncate font-medium">{displayName}</span>
        </div>

        <Link href="/">
          <Button
            variant="ghost"
            size="sm"
            className="h-9 gap-1.5 rounded-full px-3 text-xs font-semibold text-slate-700 transition-colors hover:bg-cyan-50 hover:text-cyan-700 dark:text-slate-200 dark:hover:bg-cyan-500/10 dark:hover:text-cyan-300"
          >
            <Compass className="h-4 w-4" />
            <span className="hidden sm:inline">Explore</span>
          </Button>
        </Link>

        <ModeToggle />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowLogoutConfirm(true)}
          className="h-9 rounded-full border-slate-300/80 bg-white/90 px-3 text-slate-700 transition-colors hover:border-cyan-300 hover:text-cyan-700 dark:border-slate-700 dark:bg-slate-900/85 dark:text-slate-200"
        >
          <LogOut className="mr-1 h-4 w-4" />
          Logout
        </Button>
      </div>
              </div>
          )}
      </div>

      {showLogoutConfirm && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isLoggingOut) {
              setShowLogoutConfirm(false)
            }
          }}
        >
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-4 flex items-start justify-between gap-3">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Confirm logout</h3>
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="rounded-md p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300">
              You are signed in as <span className="font-semibold">{displayName}</span>. Do you want to logout now?
            </p>

            <div className="mt-6 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowLogoutConfirm(false)}
                disabled={isLoggingOut}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="bg-gradient-to-r from-cyan-600 to-teal-500 text-white hover:from-cyan-500 hover:to-teal-400"
              >
                {isLoggingOut ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <LogOut className="mr-1 h-4 w-4" />}
                Logout
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
