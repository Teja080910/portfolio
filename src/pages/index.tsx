import FloatingNav from "@/app/components/floating-nav";
import Hero from "@/app/components/hero";
import { supabase } from "@/lib/db";
import { IAboutHighlight, IAboutMe, ICertificate, IEducation, IExperience, IProjects, ISkills, IUser } from "@/lib/interfaces";
import { useStore } from "@/lib/store";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import About from "./components/about";
import Certificate from "./components/certificate";
import Contact from "./components/contact";
import Education from "./components/education";
import Experience from "./components/experience";
import Projects from "./components/projects";
import Skills from "./components/skills";

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

export default function Home() {
  const user = useStore((state) => state.user)
  const about = useStore((state) => state.about)
  const experience = useStore((state) => state.experience)
  const skills = useStore((state) => state.skills)
  const projects = useStore((state) => state.projects)
  const certificate = useStore((state) => state.certificate)
  const education = useStore((state) => state.education)
  const router = useRouter()
  const isUsernamePath = router.pathname === "/u/[username]"
  const isReadModeRoute =
    isUsernamePath ||
    router.query.mode === "read" ||
    router.query.view === "read" ||
    router.query.read === "true"
  const usernameFromRoute = typeof router.query.username === "string" ? router.query.username.trim() : ""
  const [isSessionReady, setIsSessionReady] = useState(() => Boolean(useStore.getState().user.id))
  // viewerId tracking removed: on the owner dashboard route (/), we immediately treat it as owner view to prevent double-blinking.
  const isSyncingSession = useRef(false)
  const hasCachedUser = Boolean(user.id)
  const canRenderFromStore = isSessionReady || hasCachedUser
  const isOwnerView = !isReadModeRoute
  const isReadOnlyView = !isOwnerView
  const hasExperienceContent = experience.some((item) => item.show && (item.type || item.role || item.decription))
  const hasSkillsContent = skills.some((item) => item.show && (item.skilltype || item.skills.length || item.description))
  const hasProjectsContent = projects.some((item) => item.show && (item.name || item.description || item.duration))
  const hasCertificateContent = certificate.some((item) => item.show && (item.name || item.duration || item.link))
  const hasEducationContent = education.some((item) => item.show && (item.name || item.course || item.branch || item.keyachivements))
  const hasContactContent = Boolean(user.email || user.phone || user.firstname || user.lastname || user.username || user.role)

  const showHero = canRenderFromStore && (isOwnerView ? true : Boolean(user.show))
  const hasAboutContent =
    Boolean(about?.type?.trim()) || Boolean(about?.list?.some((item) => item.trim()))
  const showAbout = canRenderFromStore && (isOwnerView || (hasAboutContent && Boolean(about.show)))
  const showExperience = canRenderFromStore && (isOwnerView || hasExperienceContent)
  const showSkills = canRenderFromStore && (isOwnerView || hasSkillsContent)
  const showProjects = canRenderFromStore && (isOwnerView || hasProjectsContent)
  const showCertificate = canRenderFromStore && (isOwnerView || hasCertificateContent)
  const showEducation = canRenderFromStore && (isOwnerView || hasEducationContent)
  const showContact = canRenderFromStore && (isOwnerView || hasContactContent)

  const loadPublicProfileByUsername = async (username: string) => {
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
      return
    }

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
  }

  useEffect(() => {
    if (!router.isReady) {
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

        if (usernameFromRoute) {
          await loadPublicProfileByUsername(usernameFromRoute)

          if (isActive) {
            setIsSessionReady(true)
          }

          return
        }

        if (!sessionUser) {

          useStore.getState().removeUser()
          useStore.getState().resetPortfolio()
          if (isActive) {
            setIsSessionReady(true)
            if (!isReadModeRoute) {
              void router.replace('/sign-in')
            }
          }
          return
        }


        const currentStoreUser = useStore.getState().user
        const shouldRefreshUser =
          currentStoreUser.id !== sessionUser.id ||
          currentStoreUser.email !== (sessionUser.email ?? "")

        if (shouldRefreshUser) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", sessionUser.id)
            .maybeSingle()

          if (profile) {
            useStore.getState().addUser(mapProfileToStoreUser(profile))
          } else {
            useStore.getState().addUser(mapSessionUserToStoreUser(sessionUser))
          }
        }

        const { data: portfolioContent } = await supabase
          .from("portfolio_contents")
          .select("about, skills, projects, experience, education, certificates")
          .eq("user_id", sessionUser.id)
          .maybeSingle()

        if (portfolioContent) {
          const storeApi = useStore.getState()
          storeApi.setAbout(mapAboutContent(portfolioContent.about, sessionUser.id))
          storeApi.setSkills(mapSkillsContent(portfolioContent.skills, sessionUser.id))
          storeApi.setProjects(mapProjectsContent(portfolioContent.projects, sessionUser.id))
          storeApi.setExperience(mapExperienceContent(portfolioContent.experience, sessionUser.id))
          storeApi.setEducation(mapEducationContent(portfolioContent.education, sessionUser.id))
          storeApi.setCertificate(mapCertificateContent(portfolioContent.certificates, sessionUser.id))
        } else {
          useStore.getState().resetPortfolio()
        }

        if (isActive) {
          setIsSessionReady(true)
        }
      } finally {
        isSyncingSession.current = false
      }
    }

    void syncSession()

    const { data: authSubscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (usernameFromRoute) {
        void syncSession()
        return
      }

      if (!session?.user) {

        useStore.getState().removeUser()
        useStore.getState().resetPortfolio()
        if (isActive) {
          setIsSessionReady(true)
          if (!isReadModeRoute) {
            void router.replace('/sign-in')
          }
        }
        return
      }


      const currentStoreUser = useStore.getState().user
      if (
        currentStoreUser.id !== session.user.id ||
        currentStoreUser.email !== (session.user.email ?? "")
      ) {
        void syncSession()
      }
    })

    return () => {
      isActive = false
      authSubscription.subscription.unsubscribe()
    }
  }, [isReadModeRoute, router, router.isReady, usernameFromRoute])

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

  if (!hasCachedUser) {
    return (
      <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.22),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(45,212,191,0.18),transparent_34%),linear-gradient(180deg,#020617_0%,#0f172a_100%)]" />
        <div className="pointer-events-none absolute left-1/2 top-16 h-72 w-72 -translate-x-1/2 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="relative w-full max-w-md rounded-3xl border border-white/20 bg-white/10 p-8 text-center text-slate-100 shadow-xl backdrop-blur-xl">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-cyan-300 border-t-transparent" />
          <h2 className="text-xl font-semibold">Preparing your workspace</h2>
          <p className="mt-2 text-sm text-slate-300">Checking your session and loading your portfolio data...</p>
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
