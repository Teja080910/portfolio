import FloatingNav from "@/app/components/floating-nav";
import Hero from "@/app/components/hero";
import { supabase } from "@/lib/db";
import { useStore } from "@/lib/store";
import { useRouter } from "next/router";
import { useEffect } from "react";
import About from "./components/about";
import Certificate from "./components/certificate";
import Contact from "./components/contact";
import Education from "./components/education";
import Experience from "./components/experience";
import Skills from "./components/skills";

export default function Home() {
  const store = useStore()
  const router = useRouter()

  useEffect(()=>{
    const syncSession = async () => {
      if (store.user.id) {
        return
      }

      const { data } = await supabase.auth.getSession()

      if (!data.session?.user) {
        void router.push('/sign-in')
      }
    }

    void syncSession()
  },[router, store.user.id])

  return (
    <main className="min-h-screen transition-colors duration-500">
      <FloatingNav />
      {store.user.show && <Hero />}
      {store.about.show && <About />}
      {store.experience[0].show && <Experience />}
      {store.skills[0].show && <Skills />}
      {store.certificate[0].show && <Certificate />}
      {store.education[0].show && <Education />}
      {store.user.id && <Contact />}
    </main>
  )
}
