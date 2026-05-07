"use client"

import { getProxiedImageUrl } from "@/lib/image-proxy"
import { useStore } from "@/lib/store"
import { motion } from "framer-motion"
import { ArrowDown, GitlabIcon as GitHub, Linkedin, Mail, PencilLine } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

type HeroProps = {
  isReadOnly?: boolean
}

export default function Hero({ isReadOnly = false }: HeroProps) {
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
      {/* Background gradient orbs */}
      <div className="orb left-[-10%] top-[-10%] h-[40%] w-[40%] bg-primary/10 dark:bg-primary/15" />
      <div className="orb bottom-[-15%] right-[-5%] h-[35%] w-[35%] bg-purple-500/10 dark:bg-purple-500/15" />

      {/* Grid pattern overlay */}
      <div className="pointer-events-none absolute inset-0 grid-pattern opacity-50" />

      <div className="surface-grid relative z-10 px-6 pb-16">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left: Text Content */}
          <motion.div
            className="min-w-0 text-center lg:text-left"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: "easeOut" }}
          >
            {/* Role chip */}
            <div>
              <span className="accent-chip">
                <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                {roleLabel}
              </span>
            </div>

            {/* Name */}
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-foreground md:text-5xl lg:text-6xl">
              Hi, I&apos;m{" "}
              <span className="gradient-text">{fullName}</span>
            </h1>

            {/* Username */}
            <p className="mt-3 text-lg text-muted-foreground">
              @{user.username || "complete-your-profile"}
            </p>

            {/* Description */}
            <p className="mx-auto mt-6 max-w-xl break-words text-base leading-relaxed text-muted-foreground [overflow-wrap:anywhere] lg:mx-0">
              {description}
            </p>

            {/* Social links */}
            {hasSocialLinks && (
              <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
                {user.gitlink && (
                  <a
                    href={user.gitlink}
                    target="_blank"
                    rel="noreferrer"
                    className="social-link"
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
                    className="social-link"
                    aria-label="LinkedIn Profile"
                  >
                    <Linkedin className="h-5 w-5" />
                  </a>
                )}
                {emailHref && (
                  <a
                    href={emailHref}
                    className="social-link"
                    aria-label="Email Contact"
                  >
                    <Mail className="h-5 w-5" />
                  </a>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
              {!isReadOnly && (
                <Link
                  href={`/u/${encodeURIComponent(user.username || "me")}/profile`}
                  scroll={false}
                  className="inline-flex items-center gap-2 rounded-xl border border-border/50 bg-card/50 px-5 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
                >
                  <PencilLine className="h-4 w-4" />
                  Edit Profile
                </Link>
              )}
              <motion.button
                onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/30"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
              >
                Get In Touch
                <ArrowDown className="h-4 w-4" />
              </motion.button>
            </div>
          </motion.div>

          {/* Right: Profile Image / Avatar */}
          <motion.div
            className="relative mx-auto"
            initial={{ opacity: 0, scale: 0.92, rotate: -2 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.75, delay: 0.12, ease: "easeOut" }}
          >
            <div className="relative flex h-72 w-72 items-center justify-center sm:h-80 sm:w-80 md:h-96 md:w-96">
              {/* Decorative rings */}
              <div className="absolute inset-0 animate-float">
                <div className="absolute inset-4 rounded-[2.5rem] border border-primary/20 bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5" />
                <div className="absolute inset-8 rounded-[2rem] border border-primary/10" />
              </div>

              {/* Photo or initials */}
              <div className="relative z-10 flex h-[85%] w-[85%] items-center justify-center overflow-hidden rounded-[2rem] border border-border/50 bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10 shadow-xl shadow-primary/5">
                {user.photo ? (
                  <Image
                    src={getProxiedImageUrl(user.photo) || ""}
                    alt={fullName}
                    fill
                    className="object-cover transition-transform duration-700 hover:scale-105"
                    priority
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
                    <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-purple-500 to-pink-500 text-3xl font-bold text-white shadow-lg shadow-primary/30">
                      {initials}
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-foreground">{fullName}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {roleLabel}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Floating decoration dots */}
              <div className="absolute -right-4 top-8 h-3 w-3 rounded-full bg-primary/40 animate-pulse-soft" />
              <div className="absolute -left-2 bottom-16 h-2 w-2 rounded-full bg-purple-500/40 animate-pulse-soft" style={{ animationDelay: "1s" }} />
              <div className="absolute right-8 -bottom-2 h-2.5 w-2.5 rounded-full bg-pink-500/30 animate-pulse-soft" style={{ animationDelay: "2s" }} />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
