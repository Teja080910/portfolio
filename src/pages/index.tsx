import FloatingNav from "@/app/components/floating-nav";
import Hero from "@/app/components/hero";
import { supabase } from "@/lib/db";
import { IAboutMe, ICertificate, IEducation, IExperience, IProjects, ISkills, IUser } from "@/lib/interfaces";
import { useStore } from "@/lib/store";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
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

const mapAboutContent = (value: unknown, userId: string): IAboutMe => {
  const raw = (value && typeof value === "object" ? value : {}) as Record<string, unknown>
  return {
    id: toString(raw.id) || `about-${userId}`,
    person: userId,
    type: toString(raw.type),
    list: toStringArray(raw.list),
    show: typeof raw.show === "boolean" ? raw.show : true,
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
          skills: toStringArray(item.skills),
          description: toString(item.description),
          show: typeof item.show === "boolean" ? item.show : true,
        }))
    : []

const mapProjectsContent = (value: unknown, userId: string): IProjects[] =>
  Array.isArray(value)
    ? value
        .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
        .map((item, index) => ({
          id: toString(item.id) || `project-${userId}-${index}`,
          person: userId,
          name: toString(item.name),
          description: toString(item.description),
          duration: toString(item.duration),
          gitlink: toString(item.gitlink),
          weblink: toString(item.weblink),
          logo: toString(item.logo),
          skills: toStringArray(item.skills),
          show: typeof item.show === "boolean" ? item.show : true,
        }))
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
  const store = useStore()
  const router = useRouter()
  const [isSessionReady, setIsSessionReady] = useState(false)
  const showHero = isSessionReady && Boolean(store.user.show)
  const hasAboutContent =
    Boolean(store.about?.type?.trim()) || Boolean(store.about?.list?.some((item) => item.trim()))
  const showAbout = isSessionReady && hasAboutContent && Boolean(store.about.show)
  const showExperience = isSessionReady && store.experience.some((item) => item.show)
  const showSkills = isSessionReady && store.skills.some((item) => item.show)
  const showProjects = isSessionReady && store.projects.some((item) => item.show)
  const showCertificate = isSessionReady && store.certificate.some((item) => item.show)
  const showEducation = isSessionReady && store.education.some((item) => item.show)
  const showContact = isSessionReady && Boolean(store.user.id)

  useEffect(()=>{
    let isActive = true

    const syncSession = async () => {
      const { data } = await supabase.auth.getSession()
      const sessionUser = data.session?.user

      if (!sessionUser) {
        useStore.getState().removeUser()
        useStore.getState().resetPortfolio()
        if (isActive) {
          setIsSessionReady(true)
          void router.replace('/sign-in')
        }
        return
      }

      const currentStoreUser = useStore.getState().user
      const shouldRefreshUser =
        currentStoreUser.id !== sessionUser.id ||
        currentStoreUser.email !== (sessionUser.email ?? "") ||
        !currentStoreUser.firstname ||
        !currentStoreUser.username

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
    }

    void syncSession()

    const { data: authSubscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        useStore.getState().removeUser()
        useStore.getState().resetPortfolio()
        if (isActive) {
          setIsSessionReady(true)
          void router.replace('/sign-in')
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
  },[router])

  if (!isSessionReady || !store.user.id) {
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
      <FloatingNav />
      {showHero && <Hero />}
      {showAbout && <About />}
      {showExperience && <Experience />}
      {showSkills && <Skills />}
      {showProjects && <Projects />}
      {showCertificate && <Certificate />}
      {showEducation && <Education />}
      {showContact && <Contact />}
    </main>
  )
}
