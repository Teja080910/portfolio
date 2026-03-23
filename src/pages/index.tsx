import FloatingNav from "@/app/components/floating-nav";
import Hero from "@/app/components/hero";
import { supabase } from "@/lib/db";
import { IUser } from "@/lib/interfaces";
import { useStore } from "@/lib/store";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import About from "./components/about";
import Certificate from "./components/certificate";
import Contact from "./components/contact";
import Education from "./components/education";
import Experience from "./components/experience";
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

export default function Home() {
  const store = useStore()
  const router = useRouter()
  const [isSessionReady, setIsSessionReady] = useState(false)
  const showHero = isSessionReady && Boolean(store.user.show)
  const showAbout = isSessionReady && Boolean(store.about?.show)
  const showExperience = isSessionReady && Boolean(store.experience?.[0]?.show)
  const showSkills = isSessionReady && Boolean(store.skills?.[0]?.show)
  const showCertificate = isSessionReady && Boolean(store.certificate?.[0]?.show)
  const showEducation = isSessionReady && Boolean(store.education?.[0]?.show)
  const showContact = isSessionReady && Boolean(store.user.id)

  useEffect(()=>{
    let isActive = true

    const syncSession = async () => {
      const { data } = await supabase.auth.getSession()
      const sessionUser = data.session?.user

      if (!sessionUser) {
        useStore.getState().removeUser()
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

      if (isActive) {
        setIsSessionReady(true)
      }
    }

    void syncSession()

    const { data: authSubscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        useStore.getState().removeUser()
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
      {showCertificate && <Certificate />}
      {showEducation && <Education />}
      {showContact && <Contact />}
    </main>
  )
}
