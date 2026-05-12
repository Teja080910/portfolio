"use client"


import FloatingNav from "@/app/components/floating-nav"
import Hero from "@/app/components/hero"
import { supabase } from "@/lib/db"
import { IAboutHighlight, IAboutMe, ICertificate, IEducation, IExperience, IProjects, ISkills, IUser } from "@/lib/interfaces"
import { useStore } from "@/lib/store"
import About from "@/pages/components/about"
import Certificate from "@/pages/components/certificate"
import Contact from "@/pages/components/contact"
import Education from "@/pages/components/education"
import Experience from "@/pages/components/experience"
import Projects from "@/pages/components/projects"
import Skills from "@/pages/components/skills"
import { User } from "@supabase/supabase-js"
import { useRouter } from "next/router"
import { useCallback, useEffect, useRef, useState } from "react"

const mapProfileToStoreUser = (profile: Partial<IUser>): IUser => ({
  id: profile.id,
  username: profile.username ?? "",
  email: profile.email ?? "",
  photo: profile.photo,
  firstname: profile.firstname ?? "",
  lastname: profile.lastname ?? "",
  role: profile.role ?? "",
  description: profile.description,
  gitlink: profile.gitlink,
  likedlin: profile.likedlin,
  resumelink: profile.resumelink,
  phone: profile.phone ?? "",
  password: profile.password ?? "",
  show: profile.show ?? true,
  type: profile.type ?? "user",
})

const mapSessionUserToStoreUser = (user: User): IUser => {
  const metadata = user.user_metadata ?? {}

  return mapProfileToStoreUser({
    id: user.id,
    email: user.email ?? "",
    username: (metadata.username as string | undefined)?.trim() || (user.email?.split("@")[0] ?? ""),
    firstname: (metadata.firstname as string | undefined)?.trim() || "",
    lastname: (metadata.lastname as string | undefined)?.trim() || "",
    role: (metadata.role as string | undefined)?.trim() || "",
    phone: (metadata.phone as string | undefined)?.trim() || "",
    show: true,
  })
}

const toString = (value: unknown) => (typeof value === "string" ? value : "")

const toStringArray = (value: unknown) =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean) : []

const normalizeSkillsArray = (value: unknown) => {
  const normalized: string[] = []

  toStringArray(value)
    .flatMap((item) => item.split(","))
    .map((item) => item.trim())
    .filter(Boolean)
    .forEach((item) => {
      const exists = normalized.some((entry) => entry.toLowerCase() === item.toLowerCase())
      if (!exists) {
        normalized.push(item)
      }
    })

  return normalized
}

const toAboutIcon = (value: unknown): IAboutHighlight["icon"] => {
  const normalized = toString(value).toLowerCase()

  if (normalized === "rocket" || normalized === "users" || normalized === "sparkles") {
    return normalized
  }

  return "compass"
}

const mapAboutContent = (value: unknown, userId: string): IAboutMe => {
  const raw = (value && typeof value === "object" ? value : {}) as Record<string, unknown>
  const highlights = Array.isArray(raw.highlights)
    ? raw.highlights
        .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
        .map((item, index) => ({
          id: toString(item.id) || `about-highlight-${userId}-${index}`,
          title: toString(item.title),
          description: toString(item.description),
          icon: toAboutIcon(item.icon),
          show: typeof item.show === "boolean" ? item.show : true,
        }))
    : []

  return {
    id: toString(raw.id) || `about-${userId}`,
    person: userId,
    type: toString(raw.type),
    list: toStringArray(raw.list),
    show: typeof raw.show === "boolean" ? raw.show : true,
    highlights,
  }
}

const mapSkillsContent = (value: unknown, userId: string): ISkills[] =>
  Array.isArray(value)
    ? value
        .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
        .map((item, index) => ({
          id: toString(item.id) || `skill-${userId}-${index}`,
          person: userId,
          skilltype: toString(item.skilltype),
          skills: normalizeSkillsArray(item.skills),
          description: toString(item.description),
          show: typeof item.show === "boolean" ? item.show : true,
        }))
    : []

const mapProjectsContent = (value: unknown, userId: string): IProjects[] =>
  Array.isArray(value)
    ? value
        .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
        .map((item, index) => {
          const logo = toString(item.logo)
          const photos = toStringArray(item.photos)

          return {
            id: toString(item.id) || `project-${userId}-${index}`,
            person: userId,
            name: toString(item.name),
            description: toString(item.description),
            duration: toString(item.duration),
            gitlink: toString(item.gitlink),
            weblink: toString(item.weblink),
            logo,
            photos: photos.length ? photos : (logo ? [logo] : []),
            skills: toStringArray(item.skills),
            show: typeof item.show === "boolean" ? item.show : true,
          }
        })
    : []

const mapExperienceContent = (value: unknown, userId: string): IExperience[] =>
  Array.isArray(value)
    ? value
        .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
        .map((item, index) => ({
          id: toString(item.id) || `experience-${userId}-${index}`,
          person: userId,
          type: toString(item.type),
          location: toString(item.location),
          duration: toString(item.duration),
          role: toString(item.role),
          decription: toString(item.decription),
          show: typeof item.show === "boolean" ? item.show : true,
        }))
    : []

const mapEducationContent = (value: unknown, userId: string): IEducation[] =>
  Array.isArray(value)
    ? value
        .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
        .map((item, index) => ({
          id: toString(item.id) || `education-${userId}-${index}`,
          person: userId,
          name: toString(item.name),
          duration: toString(item.duration),
          course: toString(item.course),
          branch: toString(item.branch),
          keyachivements: toString(item.keyachivements),
          show: typeof item.show === "boolean" ? item.show : true,
        }))
    : []

const mapCertificateContent = (value: unknown, userId: string): ICertificate[] =>
  Array.isArray(value)
    ? value
        .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
        .map((item, index) => ({
          id: toString(item.id) || `certificate-${userId}-${index}`,
          person: userId,
          name: toString(item.name),
          duration: toString(item.duration),
          link: toString(item.link),
          photo: toString(item.photo),
          show: typeof item.show === "boolean" ? item.show : true,
        }))
    : []

export default function PortfolioPage() {
  const user = useStore((state) => state.user)
  const about = useStore((state) => state.about)
  const experience = useStore((state) => state.experience)
  const skills = useStore((state) => state.skills)
  const projects = useStore((state) => state.projects)
  const certificate = useStore((state) => state.certificate)
  const education = useStore((state) => state.education)
  const router = useRouter()
  const usernameFromRoute = router.isReady
    ? (typeof router.query.username === "string"
        ? router.query.username.trim()
        : typeof router.query.slug === "string"
          ? router.query.slug.trim()
          : "")
    : ""
  const normalizedRouteUsername = usernameFromRoute.toLowerCase()


  const [isNotFound, setIsNotFound] = useState(false)
  const [viewerUsername, setViewerUsername] = useState("")
  const [hydrated, setHydrated] = useState(false)
  const [isDataReady, setIsDataReady] = useState(false)
  const isSyncingSession = useRef(false)
  const initialSyncDone = useRef(false)

  // Track Zustand persist hydration status — prevents rendering before localStorage is loaded
  useEffect(() => {
    if (useStore.persist.hasHydrated()) {
      setHydrated(true)
    } else {
      const unsub = useStore.persist.onFinishHydration(() => setHydrated(true))
      return () => unsub()
    }
  }, [])

  const hasCachedUser = Boolean(user.id)


  // Only consider store ready when BOTH user data AND portfolio content are fully loaded
  // This prevents the intermediate state where user.id is set but content hasn't arrived yet
  const canRenderFromStore = hasCachedUser && isDataReady
  const isOwnerView = Boolean(
    normalizedRouteUsername &&
    viewerUsername &&
    viewerUsername.toLowerCase() === normalizedRouteUsername,
  )
  const isReadOnlyView = !isOwnerView

  const hasExperienceContent = experience.some((item) => item.show && (item.type || item.role || item.decription))
  const hasSkillsContent = skills.some((item) => item.show && (item.skilltype || item.skills.length || item.description))
  const hasProjectsContent = projects.some((item) => item.show && (item.name || item.description || item.duration))
  const hasCertificateContent = certificate.some((item) => item.show && (item.name || item.duration || item.link))
  const hasEducationContent = education.some((item) => item.show && (item.name || item.course || item.branch || item.keyachivements))
  const hasContactContent = Boolean(user.email || user.phone || user.firstname || user.lastname || user.username || user.role)

  const showHero = canRenderFromStore && (isOwnerView ? true : Boolean(user.show))
  const hasAboutContent = Boolean(about?.type?.trim()) || Boolean(about?.list?.some((item) => item.trim()))
  const showAbout = canRenderFromStore && (isOwnerView || (hasAboutContent && Boolean(about.show)))
  const showExperience = canRenderFromStore && (isOwnerView || hasExperienceContent)
  const showSkills = canRenderFromStore && (isOwnerView || hasSkillsContent)
  const showProjects = canRenderFromStore && (isOwnerView || hasProjectsContent)
  const showCertificate = canRenderFromStore && (isOwnerView || hasCertificateContent)
  const showEducation = canRenderFromStore && (isOwnerView || hasEducationContent)
  const showContact = canRenderFromStore && (isOwnerView || hasContactContent)

  // Detect route type from pathname since both /b/ and /t/ use [slug] param
  const isBusinessRoute = router.pathname === "/b/[slug]"
  const isTeamRoute = router.pathname === "/t/[slug]"
  const isUserRoute = router.pathname === "/u/[username]"

  const validateRouteType = useCallback((profileType: string | undefined): boolean => {
    if (isBusinessRoute) {
      // Visiting /b/[slug] — only "business" type is allowed
      return profileType === "business"
    }
    if (isTeamRoute) {
      // Visiting /t/[slug] — only "team" type is allowed
      return profileType === "team"
    }
    if (isUserRoute) {
      // Visiting /u/[username] — "business" and "team" types are NOT allowed here
      return profileType !== "business" && profileType !== "team"
    }
    return true
  }, [isBusinessRoute, isTeamRoute, isUserRoute])

  const loadPortfolioByUserId = useCallback(async (userId: string, sessionUser?: User) => {
    const storeApi = useStore.getState()

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle()

    const resolvedUser = profile ? mapProfileToStoreUser(profile) : (sessionUser ? mapSessionUserToStoreUser(sessionUser) : null)

    if (!resolvedUser) {
      storeApi.removeUser()
      storeApi.resetPortfolio()
      setIsNotFound(true)
      return ""
    }

    // Validate that the route matches the profile type
    // e.g. /b/username only for business, /u/username only for user/team
    if (!validateRouteType(resolvedUser.type)) {
      storeApi.removeUser()
      storeApi.resetPortfolio()
      setIsNotFound(true)
      return ""
    }

    setIsNotFound(false)
    storeApi.addUser(resolvedUser)

    const { data: portfolioContent } = await supabase
      .from("portfolio_contents")
      .select("about, skills, projects, experience, education, certificates")
      .eq("user_id", userId)
      .maybeSingle()

    if (portfolioContent) {
      storeApi.setAbout(mapAboutContent(portfolioContent.about, userId))
      storeApi.setSkills(mapSkillsContent(portfolioContent.skills, userId))
      storeApi.setProjects(mapProjectsContent(portfolioContent.projects, userId))
      storeApi.setExperience(mapExperienceContent(portfolioContent.experience, userId))
      storeApi.setEducation(mapEducationContent(portfolioContent.education, userId))
      storeApi.setCertificate(mapCertificateContent(portfolioContent.certificates, userId))
    } else {
      storeApi.resetPortfolio()
    }

    return resolvedUser.username?.trim() || ""
  }, [setIsNotFound, validateRouteType])

  const loadPublicProfileByUsername = useCallback(async (username: string) => {
    const trimmedUsername = username.trim()
    const storeApi = useStore.getState()

    if (!trimmedUsername) {
      return
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("username", trimmedUsername)
      .eq("show", true)
      .maybeSingle()

    if (!profile) {
      storeApi.removeUser()
      storeApi.resetPortfolio()
      setIsNotFound(true)
      return
    }

    // Validate that the route matches the profile type
    // e.g. /b/username only for business, /u/username only for user/team
    if (!validateRouteType(profile.type)) {
      storeApi.removeUser()
      storeApi.resetPortfolio()
      setIsNotFound(true)
      return
    }

    setIsNotFound(false)
    storeApi.addUser(mapProfileToStoreUser(profile))

    const { data: portfolioContent } = await supabase
      .from("portfolio_contents")
      .select("about, skills, projects, experience, education, certificates")
      .eq("user_id", profile.id)
      .maybeSingle()

    if (portfolioContent) {
      storeApi.setAbout(mapAboutContent(portfolioContent.about, profile.id))
      storeApi.setSkills(mapSkillsContent(portfolioContent.skills, profile.id))
      storeApi.setProjects(mapProjectsContent(portfolioContent.projects, profile.id))
      storeApi.setExperience(mapExperienceContent(portfolioContent.experience, profile.id))
      storeApi.setEducation(mapEducationContent(portfolioContent.education, profile.id))
      storeApi.setCertificate(mapCertificateContent(portfolioContent.certificates, profile.id))
    } else {
      storeApi.resetPortfolio()
    }
  }, [setIsNotFound, validateRouteType])

  useEffect(() => {
    if (!router.isReady || !usernameFromRoute) {
      return
    }

    let isActive = true

    const syncSession = async () => {
      if (isSyncingSession.current) {
        return
      }

      isSyncingSession.current = true

      try {
        const { data } = await supabase.auth.getSession()
        const sessionUser = data.session?.user
        let sessionUsername = ""

        // First determine the session user's username without loading their full portfolio
        if (sessionUser) {
          const { data: sessionProfile } = await supabase
            .from("profiles")
            .select("username")
            .eq("id", sessionUser.id)
            .maybeSingle()
          sessionUsername = sessionProfile?.username?.trim() || ""
        }

        if (!isActive) {
          return
        }

        setViewerUsername(sessionUsername)

        if (sessionUsername && sessionUsername.toLowerCase() === normalizedRouteUsername) {
          // Session user is viewing their own portfolio — load full data
          await loadPortfolioByUserId(sessionUser!.id, sessionUser!)
        } else {
          // Viewing someone else's portfolio — load public profile directly
          await loadPublicProfileByUsername(usernameFromRoute)
        }

        if (isActive) {
          setViewerUsername(sessionUsername)
          // Mark data as ready only after ALL data (user + portfolio content) is loaded
          // This prevents the intermediate state where user.id is set but content hasn't arrived
          setIsDataReady(true)
        }
      } finally {
        isSyncingSession.current = false
      }
    }

    void syncSession()

    const sub = supabase.auth.onAuthStateChange(() => {
      if (initialSyncDone.current) {
        void syncSession()
      }
    })
    initialSyncDone.current = true

    return () => {
      isActive = false
      isSyncingSession.current = false
      sub.data.subscription.unsubscribe()
    }
  }, [normalizedRouteUsername, router.isReady, usernameFromRoute, loadPortfolioByUserId, loadPublicProfileByUsername])

  useEffect(() => {
    if (!canRenderFromStore) {
      return
    }

    const sections = Array.from(document.querySelectorAll<HTMLElement>(".section-shell"))

    if (sections.length === 0) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.classList.toggle("in-view", entry.isIntersecting)
        })
      },
      {
        threshold: 0.25,
        rootMargin: "0px 0px -10% 0px",
      },
    )

    sections.forEach((section) => {
      section.classList.add("scroll-ready")
      observer.observe(section)
    })

    return () => {
      sections.forEach((section) => {
        section.classList.remove("in-view")
        section.classList.remove("scroll-ready")
        observer.unobserve(section)
      })
      observer.disconnect()
    }
  }, [
    canRenderFromStore,
    showAbout,
    showCertificate,
    showContact,
    showEducation,
    showExperience,
    showHero,
    showProjects,
    showSkills,
  ])

  if (isNotFound) {
    return (
      <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden px-6 transition-colors duration-300">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-purple-500/10 dark:from-primary/15 dark:via-transparent dark:to-purple-500/15" />
        <div className="pointer-events-none absolute left-[-10%] top-[-10%] h-[40%] w-[40%] rounded-full bg-primary/10 blur-3xl" />
        <div className="relative w-full max-w-md rounded-3xl border border-border/50 bg-card/60 p-8 text-center text-foreground shadow-xl backdrop-blur-xl">
          <h2 className="text-2xl font-bold tracking-tight">Portfolio Not Found</h2>
          <p className="mt-3 text-muted-foreground">
            The portfolio for <span className="font-semibold text-primary">@{usernameFromRoute}</span> doesn&apos;t exist or has been set to private.
          </p>
          <button
            type="button"
            onClick={() => void router.push("/")}
            className="mt-8 inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
          >
            Go to Homepage
          </button>
        </div>
      </main>
    )
  }

  // Show loading when:
  // 1. Store hasn't hydrated from localStorage yet, OR
  // 2. Data isn't ready yet (user + portfolio content not fully loaded)
  // This prevents any intermediate state flickering
  if (!hydrated || !canRenderFromStore) {
    return (
      <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden px-6 transition-colors duration-300">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-purple-500/10 dark:from-primary/15 dark:via-transparent dark:to-purple-500/15" />
        <div className="pointer-events-none absolute left-1/2 top-16 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl dark:bg-primary/20" />
        <div className="relative w-full max-w-md rounded-3xl border border-border/50 bg-card/60 p-8 text-center text-foreground shadow-xl backdrop-blur-xl">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <h2 className="text-xl font-semibold">Preparing portfolio</h2>
          <p className="mt-2 text-sm text-muted-foreground">Checking your session and loading the correct portfolio view...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen transition-colors duration-500">
      <FloatingNav isReadOnly={isReadOnlyView} />
      {showHero && <Hero isReadOnly={isReadOnlyView} />}
      {showAbout && <About isReadOnly={isReadOnlyView} />}
      {showExperience && <Experience isReadOnly={isReadOnlyView} />}
      {showSkills && <Skills isReadOnly={isReadOnlyView} />}
      {showProjects && <Projects isReadOnly={isReadOnlyView} />}
      {showCertificate && <Certificate isReadOnly={isReadOnlyView} />}
      {showEducation && <Education isReadOnly={isReadOnlyView} />}
      {showContact && <Contact isReadOnly={isReadOnlyView} />}
    </main>
  )
}
