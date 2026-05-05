"use client"

import { useEffect, useRef, useState } from "react"

export default function Header() {
  const [isVisible, setIsVisible] = useState(true)
  const [activeSection, setActiveSection] = useState("home")
  const lastScrollYRef = useRef(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      setIsVisible(currentScrollY < lastScrollYRef.current || currentScrollY < 100)
      lastScrollYRef.current = currentScrollY
    }

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection((previous) => (previous === entry.target.id ? previous : entry.target.id))
        }
      })
    }

    window.addEventListener("scroll", handleScroll)

    const observer = new IntersectionObserver(handleIntersection, {
      threshold: 0.3,
    })

    document.querySelectorAll("section[id]").forEach((section) => {
      observer.observe(section)
    })

    return () => {
      window.removeEventListener("scroll", handleScroll)
      observer.disconnect()
    }
  }, [])

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      const offset = 80 // Height of the header
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      })
    }
  }

  return (
    <header
      className={`
        fixed w-full z-50 transition-all duration-300
        ${isVisible ? "top-0" : "-top-20"}
        bg-white/95 shadow-md backdrop-blur-sm dark:bg-gray-900/95
      `}
    >
      <nav className="container mx-auto px-6 py-4">
        <ul className="flex justify-center space-x-6">
          {[
            ["about", "About"],
            ["experience", "Experience"],
            ["skills", "Skills"],
            ["services", "Services"],
            ["education", "Education"],
            ["contact", "Contact"],
          ].map(([id, label]) => (
            <li key={id}>
              <button
                type="button"
                onClick={() => scrollToSection(id)}
                className={`
                  transition-colors duration-300
                  ${
                    activeSection === id
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-800 hover:text-blue-600 dark:text-gray-300 dark:hover:text-white"
                  }
                `}
              >
                {label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}
