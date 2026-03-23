"use client"

import { useStore } from "@/lib/store"
import { motion } from "framer-motion"
import { ArrowDown, GitlabIcon as GitHub, Linkedin, Mail, PencilLine, UserRound } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

const CodePattern = () => (
  <svg className="absolute inset-0 h-full w-full opacity-5" xmlns="http://www.w3.org/2000/svg">
    <pattern
      id="pattern-circles"
      x="0"
      y="0"
      width="50"
      height="50"
      patternUnits="userSpaceOnUse"
      patternContentUnits="userSpaceOnUse"
    >
      <circle id="pattern-circle" cx="10" cy="10" r="1.6257413380501518" fill="#000"></circle>
    </pattern>
    <rect id="rect" x="0" y="0" width="100%" height="100%" fill="url(#pattern-circles)"></rect>
  </svg>
)

export default function Hero() {
  const user = useStore((state) => state.user)

  if (!user?.id) {
    return null
  }

  const fullName = [user.firstname, user.lastname].filter(Boolean).join(" ").trim() || user.username || user.email
  const roleLabel = user.role?.trim() || "Portfolio Owner"
  const description =
    user.description?.trim() ||
    "Your profile is live. Add your bio, social links, and portfolio details to make this homepage fully yours."
  const emailHref = user.email ? `mailto:${user.email}` : undefined
  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U"
  const hasSocialLinks = Boolean(user.gitlink || user.likedlin || emailHref)

  return (
    <section id="user" className="relative min-h-screen overflow-hidden pt-24">
      <div className="absolute inset-0 z-0">
        <CodePattern />
      </div>
      <div className="pointer-events-none absolute -left-20 top-16 h-64 w-64 rounded-full bg-cyan-300/25 blur-3xl dark:bg-cyan-500/20" />
      <div className="pointer-events-none absolute -right-20 bottom-20 h-72 w-72 rounded-full bg-teal-300/25 blur-3xl dark:bg-teal-500/20" />

      <div className="surface-grid relative z-10 px-6 pb-16">
        <div className="grid items-center gap-12 rounded-[2rem] border border-slate-200/70 bg-white/70 p-8 shadow-xl backdrop-blur-lg dark:border-slate-700/70 dark:bg-slate-900/65 lg:grid-cols-2 lg:p-12">
          <motion.div
            className="text-center lg:text-left"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: "easeOut" }}
          >
            <span className="accent-chip">{roleLabel}</span>
            <h1 className="mt-5 bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-4xl font-bold text-transparent dark:from-cyan-300 dark:to-teal-300 md:text-5xl lg:text-6xl">
              {fullName}
            </h1>
            <h2 className="mt-4 text-xl font-semibold text-slate-700 dark:text-slate-300 md:text-2xl">
              @{user.username || "complete-your-profile"}
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-600 dark:text-slate-300 lg:mx-0 md:text-lg">
              {description}
            </p>

            {hasSocialLinks && (
              <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
                {user.gitlink && (
                  <a
                    href={user.gitlink}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-slate-300/70 bg-white/80 p-3 text-slate-700 transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-300 hover:text-cyan-600 dark:border-slate-600 dark:bg-slate-800/70 dark:text-slate-200 dark:hover:border-cyan-500"
                    aria-label="GitHub Profile"
                  >
                    <GitHub className="h-5 w-5" />
                  </a>
                )}
                {user.likedlin && (
                  <a
                    href={user.likedlin}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-slate-300/70 bg-white/80 p-3 text-slate-700 transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-300 hover:text-cyan-600 dark:border-slate-600 dark:bg-slate-800/70 dark:text-slate-200 dark:hover:border-cyan-500"
                    aria-label="LinkedIn Profile"
                  >
                    <Linkedin className="h-5 w-5" />
                  </a>
                )}
                {emailHref && (
                  <a
                    href={emailHref}
                    className="rounded-full border border-slate-300/70 bg-white/80 p-3 text-slate-700 transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-300 hover:text-cyan-600 dark:border-slate-600 dark:bg-slate-800/70 dark:text-slate-200 dark:hover:border-cyan-500"
                    aria-label="Email Contact"
                  >
                    <Mail className="h-5 w-5" />
                  </a>
                )}
              </div>
            )}

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <Link
                href="/user"
                className="inline-flex items-center gap-2 rounded-full border border-slate-300/70 bg-white/80 px-6 py-3 font-semibold text-slate-700 shadow-lg transition-transform duration-300 hover:-translate-y-0.5 dark:border-slate-600 dark:bg-slate-800/70 dark:text-slate-100"
              >
                <PencilLine className="h-4 w-4" />
                Edit Profile
              </Link>
              <Link
                href="/user#portfolio-content"
                className="inline-flex items-center gap-2 rounded-full border border-slate-300/70 bg-white/80 px-6 py-3 font-semibold text-slate-700 shadow-lg transition-transform duration-300 hover:-translate-y-0.5 dark:border-slate-600 dark:bg-slate-800/70 dark:text-slate-100"
              >
                <PencilLine className="h-4 w-4" />
                Edit Portfolio Content
              </Link>
              <motion.button
                onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-600 to-teal-600 px-6 py-3 font-semibold text-white shadow-lg transition-transform duration-300 hover:-translate-y-0.5"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
              >
                Contact Me
                <ArrowDown className="h-4 w-4" />
              </motion.button>
            </div>
          </motion.div>

          <motion.div
            className="relative mx-auto"
            initial={{ opacity: 0, scale: 0.92, rotate: -2 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.75, delay: 0.12, ease: "easeOut" }}
          >
            <div className="animate-float relative flex h-72 w-72 items-center justify-center sm:h-80 sm:w-80 md:h-96 md:w-96">
              <div className="absolute inset-0 -rotate-6 rounded-[2rem] bg-gradient-to-r from-cyan-400/60 to-teal-500/60 blur-sm" />
              <div className="absolute inset-0 rotate-6 rounded-[2rem] border border-white/50 bg-white/25 backdrop-blur-sm dark:border-slate-700/70 dark:bg-slate-800/30" />
              <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-[1.75rem] border border-white/60 bg-slate-100 shadow-2xl dark:border-slate-600/70 dark:bg-slate-800">
                {user.photo ? (
                  <Image src={user.photo} alt={fullName} fill className="object-cover" priority />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-4 text-slate-500 dark:text-slate-300">
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 text-3xl font-bold text-white shadow-lg">
                      {initials}
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-semibold text-slate-700 dark:text-slate-100">{fullName}</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Add a profile photo to personalize this section.
                      </p>
                    </div>
                    <UserRound className="h-6 w-6 text-cyan-500" />
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
