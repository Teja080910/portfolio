import FloatingNav from "@/app/components/floating-nav";
import Hero from "@/app/components/hero";
import About from "./components/about";
import Contact from "./components/contact";
import Education from "./components/education";
import Experience from "./components/experience";
import Services from "./components/services";
import Skills from "./components/skills";

export default function Home() {
  return (
    <main className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <FloatingNav />
      <Hero />
      <About />
      <Experience />
      <Skills />
      <Services />
      <Education />
      <Contact />
    </main>
  )
}

