"use client"

import { getProxiedImageUrl } from "@/lib/image-proxy"
import { useStore } from "@/lib/store"
import { motion } from "framer-motion"
import { ArrowDown, Award, BookOpen, Briefcase, Code2, Cpu, FolderKanban, GitlabIcon as GitHub, Linkedin, Mail, PencilLine } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

type HeroProps = {
  isReadOnly?: boolean
}

export default function Hero({ isReadOnly = false }: HeroProps) {
  const user = useStore((state) => state.user)
  const projects = useStore((state) => state.projects)
  const experience = useStore((state) => state.experience)
  const education = useStore((state) => state.education)
  const skills = useStore((state) => state.skills)
  const certificate = useStore((state) => state.certificate)

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

  const visibleProjects = projects.filter((p) => p.show).length
  const visibleExperience = experience.filter((e) => e.show).length
  const visibleEducation = education.filter((e) => e.show).length
  const visibleCertificates = certificate.filter((c) => c.show).length
  const totalSkillCategories = skills.filter((s) => s.show).length
  const totalSkills = skills
    .filter((s) => s.show)
    .reduce((count, s) => count + s.skills.length, 0)

  const floatingOrbs = [
    { size: "h-[500px] w-[500px]", pos: "left-[-15%] top-[-20%]", color: "bg-primary/20 dark:bg-primary/25", delay: 0, duration: 18 },
    { size: "h-[420px] w-[420px]", pos: "right-[-12%] top-[10%]", color: "bg-purple-500/20 dark:bg-purple-500/25", delay: 3, duration: 20 },
    { size: "h-[350px] w-[350px]", pos: "left-[20%] bottom-[-18%]", color: "bg-pink-500/15 dark:bg-pink-500/22", delay: 6, duration: 16 },
    { size: "h-[280px] w-[280px]", pos: "right-[10%] bottom-[20%]", color: "bg-cyan-400/15 dark:bg-cyan-400/22", delay: 1, duration: 22 },
  ]

  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    size: Math.random() * 5 + 2,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 8 + 8,
    delay: Math.random() * 4,
    driftX: (Math.random() - 0.5) * 60,
    driftY: -(Math.random() * 40 + 20),
  }))

  const gradientLines = [
    { top: "15%", left: "0%", angle: 45, width: "50%", delay: 0 },
    { top: "60%", right: "0%", angle: -30, width: "45%", delay: 4 },
    { top: "85%", left: "20%", angle: 60, width: "40%", delay: 8 },
  ]

  return (
    <section id="user" className="relative min-h-screen overflow-hidden pt-24">
      {/* Animated floating orbs */}
      {floatingOrbs.map((orb) => (
        <motion.div
          key={orb.pos}
          className={`pointer-events-none absolute ${orb.pos} ${orb.size} rounded-full ${orb.color} blur-[100px]`}
          animate={{
            x: [0, 60, -40, 80, 0],
            y: [0, -80, 50, -60, 0],
            scale: [1, 1.15, 0.9, 1.1, 1],
          }}
          transition={{
            duration: orb.duration,
            delay: orb.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Grid pattern overlay */}
      <motion.div
        className="pointer-events-none absolute inset-0 grid-pattern"
        animate={{ opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Vignette overlay for depth */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-background/30" />

      {/* Floating particles */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="pointer-events-none absolute rounded-full bg-primary/30 dark:bg-primary/40"
          animate={{
            y: [p.driftY, 0, p.driftY * 0.5, -p.driftY * 0.3, p.driftY],
            x: [0, p.driftX, -p.driftX / 2, p.driftX / 2, 0],
            opacity: [0, 1, 0.4, 0.7, 0],
            scale: [0, 1.5, 0.6, 1, 0],
          }}
          animate={{
            y: [0, -30 - p.drift, 10, -20 + p.drift, 0],
            x: [0, p.drift, -p.drift / 2, p.drift / 2, 0],
            opacity: [0, 0.8, 0.3, 0.6, 0],
            scale: [0, 1, 0.6, 0.8, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Sweeping gradient lines */}
      {gradientLines.map((line) => (
        <motion.div
          key={line.top}
          className="pointer-events-none absolute h-[2px]"
          style={{
            top: line.top,
            left: line.left,
            right: line.right,
            width: line.width,
            rotate: `${line.angle}deg`,
            background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.4), hsl(var(--primary) / 0.6), hsl(var(--primary) / 0.4), transparent)",
          }}
          animate={{
            opacity: [0, 0.8, 1, 0.8, 0],
            scaleX: [0.2, 0.7, 1, 0.7, 0.2],
          }}
          transition={{
            duration: 6,
            delay: line.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

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
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <span className="accent-chip">
                <motion.span
                  className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-primary"
                  animate={{ scale: [1, 1.4, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
                {roleLabel}
              </span>
            </motion.div>

            {/* Name */}
            <motion.h1
              className="mt-6 text-4xl font-extrabold tracking-tight text-foreground md:text-5xl lg:text-6xl"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            >
              Hi, I&apos;m{" "}
              <motion.span
                className="gradient-text inline-block"
                animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                style={{ backgroundSize: "200% 200%" }}
              >
                {fullName}
              </motion.span>
            </motion.h1>

            {/* Username */}
            <motion.p
              className="mt-3 text-lg text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.35 }}
            >
              @{user.username || "complete-your-profile"}
            </motion.p>

            {/* Description */}
            <motion.p
              className="mx-auto mt-6 max-w-xl break-words text-base leading-relaxed text-muted-foreground [overflow-wrap:anywhere] lg:mx-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.45 }}
            >
              {description}
            </motion.p>

            {/* Social links */}
            {hasSocialLinks && (
              <motion.div
                className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.55 }}
              >
                {user.gitlink && (
                  <motion.a
                    href={user.gitlink}
                    target="_blank"
                    rel="noreferrer"
                    className="social-link"
                    aria-label="GitHub Profile"
                    whileHover={{ scale: 1.15, rotate: 5 }}
                    whileTap={{ scale: 0.92 }}
                  >
                    <GitHub className="h-5 w-5" />
                  </motion.a>
                )}
                {user.likedlin && (
                  <motion.a
                    href={user.likedlin}
                    target="_blank"
                    rel="noreferrer"
                    className="social-link"
                    aria-label="LinkedIn Profile"
                    whileHover={{ scale: 1.15, rotate: -5 }}
                    whileTap={{ scale: 0.92 }}
                  >
                    <Linkedin className="h-5 w-5" />
                  </motion.a>
                )}
                {emailHref && (
                  <motion.a
                    href={emailHref}
                    className="social-link"
                    aria-label="Email Contact"
                    whileHover={{ scale: 1.15, rotate: 5 }}
                    whileTap={{ scale: 0.92 }}
                  >
                    <Mail className="h-5 w-5" />
                  </motion.a>
                )}
              </motion.div>
            )}

            {/* Action buttons */}
            <motion.div
              className="mt-10 flex flex-wrap items-center justify-center gap-4 lg:justify-start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.65 }}
            >
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
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                animate={{ boxShadow: ["0 4px 14px 0 rgba(0,0,0,0.1)", "0 4px 20px 0 rgba(0,0,0,0.15)", "0 4px 14px 0 rgba(0,0,0,0.1)"] }}
                transition={{ boxShadow: { duration: 3, repeat: Infinity, ease: "easeInOut" } }}
              >
                Get In Touch
                <motion.span
                  animate={{ y: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <ArrowDown className="h-4 w-4" />
                </motion.span>
              </motion.button>
            </motion.div>
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
              <motion.div
                className="absolute inset-0"
                animate={{ rotate: 360 }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              >
                <div className="absolute inset-4 rounded-[2.5rem] border border-primary/20 bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5" />
              </motion.div>
              <motion.div
                className="absolute inset-0"
                animate={{ rotate: -360 }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              >
                <div className="absolute inset-8 rounded-[2rem] border border-primary/10" />
              </motion.div>

              {/* Photo or initials */}
              <motion.div
                className="relative z-10 flex h-[85%] w-[85%] items-center justify-center overflow-hidden rounded-[2rem] border border-border/50 bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10 shadow-xl shadow-primary/5"
                whileHover={{ scale: 1.03 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
              >
                {user.photo ? (
                  <Image
                    src={getProxiedImageUrl(user.photo) || ""}
                    alt={fullName}
                    fill
                    sizes="(max-width: 768px) 280px, 400px"
                    className="object-cover transition-transform duration-700 hover:scale-105"
                    priority
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
                    <motion.div
                      className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-purple-500 to-pink-500 text-3xl font-bold text-white shadow-lg shadow-primary/30"
                      animate={{ rotate: [0, 3, -3, 0] }}
                      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                    >
                      {initials}
                    </motion.div>
                    <div>
                      <p className="text-lg font-semibold text-foreground">{fullName}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {roleLabel}
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Floating decoration dots */}
              <motion.div
                className="absolute -right-4 top-8 h-3 w-3 rounded-full bg-primary/40"
                animate={{ y: [-6, 6, -6], opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute -left-2 bottom-16 h-2 w-2 rounded-full bg-purple-500/40"
                animate={{ y: [6, -6, 6], opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              />
              <motion.div
                className="absolute right-8 -bottom-2 h-2.5 w-2.5 rounded-full bg-pink-500/30"
                animate={{ y: [-4, 8, -4], opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Stats cards — horizontal scroll */}
      <div className="mx-auto mt-12 w-full max-w-7xl px-6">
        <motion.div
          className="flex gap-4 overflow-x-auto pb-2 scrollbar-none"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{
            scrollSnapType: "x mandatory",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {[
            { icon: FolderKanban, label: "Projects", sectionId: "projects", value: visibleProjects, desc: visibleProjects > 0 ? `${visibleProjects} project${visibleProjects === 1 ? "" : "s"} built` : "Projects in the works" },
            { icon: Briefcase, label: "Experience", sectionId: "experience", value: visibleExperience, desc: visibleExperience > 0 ? `${visibleExperience} position${visibleExperience === 1 ? "" : "s"}` : "Building experience" },
            { icon: BookOpen, label: "Education", sectionId: "education", value: visibleEducation, desc: visibleEducation > 0 ? `${visibleEducation} entr${visibleEducation === 1 ? "y" : "ies"}` : "Continuous learning" },
            { icon: Code2, label: "Skills", sectionId: "skills", value: totalSkills, desc: totalSkills > 0 ? `${totalSkills} skill${totalSkills === 1 ? "" : "s"} across ${totalSkillCategories} categor${totalSkillCategories === 1 ? "y" : "ies"}` : "Skills in development" },
            { icon: Award, label: "Certificates", sectionId: "certificate", value: visibleCertificates, desc: visibleCertificates > 0 ? `${visibleCertificates} certificate${visibleCertificates === 1 ? "" : "s"}` : "Certifications pending" },
            { icon: Cpu, label: "Role", sectionId: "about", value: user.role?.trim() || "Open to work", desc: user.role?.trim() ? `Working as ${user.role.trim()}` : "Open to opportunities" },
          ].map((card, index) => {
            const Icon = card.icon
            return (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.3 }}
                transition={{ duration: 0.45, delay: index * 0.08, ease: "easeOut" }}
                whileHover={{ y: -4 }}
                className="min-w-[200px] flex-1 snap-start"
              >
                <button type="button" onClick={() => document.getElementById(card.sectionId)?.scrollIntoView({ behavior: "smooth" })} className="w-full text-left">
                  <motion.div
                    className="glass-card relative h-full overflow-hidden p-4"
                    whileHover={{ boxShadow: "0 8px 30px rgba(0,0,0,0.08)" }}
                  >
                    <motion.span
                      className="absolute right-3 top-3 text-[10px] font-bold tracking-[0.15em] text-muted-foreground/30"
                      animate={{ opacity: [0.2, 0.5, 0.2] }}
                      transition={{ duration: 3 + index, repeat: Infinity, ease: "easeInOut" }}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </motion.span>
                    <motion.div
                      className="mb-2.5 inline-flex rounded-xl border border-border/50 bg-background/50 p-2"
                      whileHover={{ rotate: [0, -10, 10, -10, 0], transition: { duration: 0.4 } }}
                    >
                      <Icon className="h-4 w-4 text-primary" />
                    </motion.div>
                    <motion.p
                      className="text-xl font-extrabold tracking-tight text-foreground"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      transition={{ delay: index * 0.08 + 0.2 }}
                    >
                      {card.value}
                    </motion.p>
                    <p className="mt-0.5 text-sm font-semibold text-foreground/80">{card.label}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{card.desc}</p>
                  </motion.div>
                </button>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
