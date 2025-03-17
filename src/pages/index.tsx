import FloatingNav from "@/app/components/floating-nav";
import Hero from "@/app/components/hero";
import { useStore } from "@/lib/store";
import { useRouter } from "next/router";
import About from "./components/about";
import Certificate from "./components/certificate";
import Contact from "./components/contact";
import Education from "./components/education";
import Experience from "./components/experience";
import Skills from "./components/skills";
import { useEffect } from "react";

export default function Home() {
  const store = useStore()
  const router = useRouter()

  if(!store){
    return <div>Loading...</div>
  }

  useEffect(()=>{
    if(!store.user.id){
      router.push('/sign-in')
    }
  },[store.user.id])

  return (
    <main className="bg-gray-50 dark:bg-gray-900 min-h-screen">
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