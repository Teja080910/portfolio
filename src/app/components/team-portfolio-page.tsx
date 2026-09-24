"use client"

import { getCurrentSession } from "@/lib/auth-session"
import { getProxiedImageUrl } from "@/lib/image-proxy"
import { ITeamMember, ITeamPortfolio, TeamSectionKey } from "@/lib/interfaces"
import { getTeamPortfolio, TEAM_SECTION_LABELS } from "@/lib/teams"
import { cn } from "@/lib/utils"
import { AnimatePresence, motion } from "framer-motion"
import {
  ArrowUpRight,
  Award,
  Briefcase,
  Building2,
  Calendar,
  Check,
  Code2,
  ExternalLink,
  GraduationCap,
  Layers,
  LayoutGrid,
  Link2,
  Music,
  Palette,
  Play,
  Settings2,
  Sparkles,
  Users,
  Wrench,
} from "lucide-react"
import Head from "next/head"
import Link from "next/link"
import { useRouter } from "next/router"
import { useEffect, useMemo, useState } from "react"

const SECTION_ORDER: TeamSectionKey[] = [
  "projects",
  "skills",
  "experience",
  "content_channels",
  "content_works",
  "collaborations",
  "creator_tools",
  "certificates",
  "education",
]

const SECTION_ICONS: Record<TeamSectionKey, typeof Layers> = {
  projects: LayoutGrid,
  skills: Sparkles,
  experience: Briefcase,
  education: GraduationCap,
  certificates: Award,
  content_channels: Music,
  content_works: Play,
  collaborations: Building2,
  creator_tools: Wrench,
}

const asString = (value: unknown) => (typeof value === "string" ? value : "")
const asArray = (value: unknown) => (Array.isArray(value) ? value : [])

const getMemberName = (member?: ITeamMember) => {
  if (!member) return ""
  return `${member.firstname || ""} ${member.lastname || ""}`.trim() || member.username
}

const getProfileHref = (member?: ITeamMember) => {
  if (!member || member.show === false) return null
  if (member.type === "business") return `/b/${encodeURIComponent(member.username)}`
  return `/u/${encodeURIComponent(member.username)}`
}

function Attribution({ member, label }: { member?: ITeamMember; label?: string }) {
  if (!member) return null

  const href = getProfileHref(member)
  const chip = (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-secondary/50 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
      {member.photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={getProxiedImageUrl(member.photo) || member.photo}
          alt={getMemberName(member)}
          className="h-4 w-4 rounded-full object-cover"
        />
      ) : (
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 text-[9px] font-bold text-white">
          {getMemberName(member).charAt(0).toUpperCase()}
        </span>
      )}
      {label ?? `by @${member.username}`}
    </span>
  )

  if (!href) return chip

  return (
    <Link href={href} className="transition-opacity hover:opacity-80">
      {chip}
    </Link>
  )
}

function ItemCard({
  children,
  member,
  index,
}: {
  children: React.ReactNode
  member?: ITeamMember
  index: number
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.4, delay: Math.min(index, 5) * 0.06 }}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/50 bg-card/60 p-5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
    >
      {children}
      <div className="mt-auto pt-4">
        <Attribution member={member} />
      </div>
    </motion.article>
  )
}

function SectionShell({
  id,
  title,
  count,
  children,
}: {
  id: string
  title: string
  count: number
  children: React.ReactNode
}) {
  return (
    <section id={id} className="relative mx-auto w-full max-w-6xl scroll-mt-24 px-6 py-14">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {count} {count === 1 ? "item" : "items"} shared by the team
          </p>
        </div>
      </div>
      {children}
    </section>
  )
}

function ExternalLinks({ links }: { links: { label: string; url: string }[] }) {
  const visible = links.filter((link) => link.url)
  if (visible.length === 0) return null

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {visible.slice(0, 4).map((link) => (
        <a
          key={`${link.label}-${link.url}`}
          href={link.url}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-1 rounded-lg border border-border/60 bg-background/60 px-2.5 py-1 text-[11px] font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary"
        >
          {link.label}
          <ExternalLink className="h-3 w-3" />
        </a>
      ))}
    </div>
  )
}

function ProjectItem({ item, member, index }: { item: Record<string, unknown>; member?: ITeamMember; index: number }) {
  const photos = [...asArray(item.photos).map(asString), asString(item.logo)].filter(Boolean)
  const hero = photos[0]
  const skills = asArray(item.skills).map(asString).filter(Boolean)
  const weblinks = asArray(item.weblinks)
    .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object")
    .map((entry) => ({ label: asString(entry.type) || "Link", url: asString(entry.url) }))
  const links = [
    ...weblinks,
    ...(asString(item.gitlink) ? [{ label: "GitHub", url: asString(item.gitlink) }] : []),
    ...(asString(item.weblink) ? [{ label: "Live", url: asString(item.weblink) }] : []),
  ]

  return (
    <ItemCard member={member} index={index}>
      <div className="-mx-5 -mt-5 mb-4 h-40 overflow-hidden bg-gradient-to-br from-secondary/60 to-secondary/20">
        {hero ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={hero} alt={asString(item.name)} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Code2 className="h-10 w-10 text-muted-foreground/30" />
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <h3 className="text-base font-bold text-foreground">{asString(item.name) || "Untitled project"}</h3>
        {asString(item.projectType) && (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
            {asString(item.projectType)}
          </span>
        )}
      </div>
      <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
        {asString(item.description) || "No description provided."}
      </p>
      {(asString(item.duration) || asString(item.startDate)) && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          {[asString(item.startDate), asString(item.endDate)].filter(Boolean).join(" – ") || asString(item.duration)}
        </p>
      )}
      {skills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {skills.slice(0, 5).map((skill) => (
            <span key={skill} className="rounded-md bg-secondary/70 px-2 py-0.5 text-[11px] font-medium text-foreground/80">
              {skill}
            </span>
          ))}
        </div>
      )}
      <ExternalLinks links={links} />
    </ItemCard>
  )
}

function SkillItem({ item, member, index }: { item: Record<string, unknown>; member?: ITeamMember; index: number }) {
  const skills = asArray(item.skills).map(asString).filter(Boolean)

  return (
    <ItemCard member={member} index={index}>
      <h3 className="flex items-center gap-2 text-base font-bold text-foreground">
        <Sparkles className="h-4 w-4 text-primary" />
        {asString(item.skilltype) || "Skills"}
      </h3>
      {asString(item.description) && (
        <p className="mt-2 text-sm text-muted-foreground">{asString(item.description)}</p>
      )}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {skills.map((skill) => (
          <span key={skill} className="rounded-lg border border-border/60 bg-secondary/40 px-2.5 py-1 text-xs font-medium text-foreground/90">
            {skill}
          </span>
        ))}
      </div>
    </ItemCard>
  )
}

function ExperienceItem({ item, member, index }: { item: Record<string, unknown>; member?: ITeamMember; index: number }) {
  return (
    <ItemCard member={member} index={index}>
      <h3 className="text-base font-bold text-foreground">{asString(item.role) || "Role"}</h3>
      <p className="mt-1 text-sm font-medium text-primary">
        {[asString(item.type), asString(item.location)].filter(Boolean).join(" · ")}
      </p>
      {asString(item.duration) && (
        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          {asString(item.duration)}
        </p>
      )}
      {asString(item.decription) && (
        <p className="mt-3 line-clamp-4 text-sm text-muted-foreground">{asString(item.decription)}</p>
      )}
    </ItemCard>
  )
}

function EducationItem({ item, member, index }: { item: Record<string, unknown>; member?: ITeamMember; index: number }) {
  return (
    <ItemCard member={member} index={index}>
      <h3 className="text-base font-bold text-foreground">{asString(item.name) || "Institution"}</h3>
      <p className="mt-1 text-sm font-medium text-primary">
        {[asString(item.course), asString(item.branch)].filter(Boolean).join(" · ")}
      </p>
      {asString(item.duration) && (
        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          {asString(item.duration)}
        </p>
      )}
      {asString(item.keyachivements) && (
        <p className="mt-3 line-clamp-4 text-sm text-muted-foreground">{asString(item.keyachivements)}</p>
      )}
    </ItemCard>
  )
}

function CertificateItem({ item, member, index }: { item: Record<string, unknown>; member?: ITeamMember; index: number }) {
  const photo = asString(item.photo)

  return (
    <ItemCard member={member} index={index}>
      {photo && (
        <div className="-mx-5 -mt-5 mb-4 h-32 overflow-hidden bg-secondary/40">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo} alt={asString(item.name)} className="h-full w-full object-cover" />
        </div>
      )}
      <h3 className="flex items-center gap-2 text-base font-bold text-foreground">
        <Award className="h-4 w-4 text-primary" />
        {asString(item.name) || "Certificate"}
      </h3>
      {asString(item.duration) && <p className="mt-1 text-xs text-muted-foreground">{asString(item.duration)}</p>}
      <ExternalLinks links={[{ label: "View certificate", url: asString(item.link) }]} />
    </ItemCard>
  )
}

function ChannelItem({ item, member, index }: { item: Record<string, unknown>; member?: ITeamMember; index: number }) {
  return (
    <ItemCard member={member} index={index}>
      <h3 className="flex items-center gap-2 text-base font-bold capitalize text-foreground">
        <Music className="h-4 w-4 text-primary" />
        {asString(item.platform) || "Channel"}
      </h3>
      <p className="mt-1 text-sm font-medium text-primary">
        {[asString(item.handle), asString(item.subscriberCount)].filter(Boolean).join(" · ")}
      </p>
      {asString(item.description) && (
        <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{asString(item.description)}</p>
      )}
      <ExternalLinks links={[{ label: "Open channel", url: asString(item.url) }]} />
    </ItemCard>
  )
}

function ContentWorkItem({ item, member, index }: { item: Record<string, unknown>; member?: ITeamMember; index: number }) {
  const thumbnail = asString(item.thumbnail)

  return (
    <ItemCard member={member} index={index}>
      <div className="-mx-5 -mt-5 mb-4 h-40 overflow-hidden bg-gradient-to-br from-secondary/60 to-secondary/20">
        {thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumbnail} alt={asString(item.title)} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Play className="h-10 w-10 text-muted-foreground/30" />
          </div>
        )}
      </div>
      <h3 className="text-base font-bold text-foreground">{asString(item.title) || "Content piece"}</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        {[asString(item.type), asString(item.views), asString(item.date)].filter(Boolean).join(" · ")}
      </p>
      {asString(item.description) && (
        <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{asString(item.description)}</p>
      )}
      <ExternalLinks links={[{ label: "Watch", url: asString(item.url) }]} />
    </ItemCard>
  )
}

function CollaborationItem({ item, member, index }: { item: Record<string, unknown>; member?: ITeamMember; index: number }) {
  const logo = asString(item.logo)

  return (
    <ItemCard member={member} index={index}>
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 text-sm font-bold text-white">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt={asString(item.brand)} className="h-full w-full object-cover" />
          ) : (
            (asString(item.brand) || "B").charAt(0).toUpperCase()
          )}
        </div>
        <div>
          <h3 className="text-base font-bold text-foreground">{asString(item.brand) || "Brand"}</h3>
          {asString(item.date) && <p className="text-xs text-muted-foreground">{asString(item.date)}</p>}
        </div>
      </div>
      {asString(item.description) && (
        <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{asString(item.description)}</p>
      )}
      <ExternalLinks links={[{ label: "Open", url: asString(item.url) }]} />
    </ItemCard>
  )
}

function ToolItem({ item, member, index }: { item: Record<string, unknown>; member?: ITeamMember; index: number }) {
  return (
    <ItemCard member={member} index={index}>
      <h3 className="flex items-center gap-2 text-base font-bold text-foreground">
        <Palette className="h-4 w-4 text-primary" />
        {asString(item.name) || "Tool"}
      </h3>
      {asString(item.category) && (
        <span className="mt-2 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
          {asString(item.category)}
        </span>
      )}
      {asString(item.description) && (
        <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{asString(item.description)}</p>
      )}
    </ItemCard>
  )
}

function renderItem(section: TeamSectionKey, item: Record<string, unknown>, member: ITeamMember | undefined, index: number) {
  switch (section) {
    case "projects":
      return <ProjectItem item={item} member={member} index={index} />
    case "skills":
      return <SkillItem item={item} member={member} index={index} />
    case "experience":
      return <ExperienceItem item={item} member={member} index={index} />
    case "education":
      return <EducationItem item={item} member={member} index={index} />
    case "certificates":
      return <CertificateItem item={item} member={member} index={index} />
    case "content_channels":
      return <ChannelItem item={item} member={member} index={index} />
    case "content_works":
      return <ContentWorkItem item={item} member={member} index={index} />
    case "collaborations":
      return <CollaborationItem item={item} member={member} index={index} />
    case "creator_tools":
      return <ToolItem item={item} member={member} index={index} />
    default:
      return null
  }
}

export default function TeamPortfolioPage() {
  const router = useRouter()
  const slug = router.isReady && typeof router.query.slug === "string" ? router.query.slug.trim().toLowerCase() : ""

  const [data, setData] = useState<ITeamPortfolio | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewerUserId, setViewerUserId] = useState("")
  const [copied, setCopied] = useState(false)
  const [activeSection, setActiveSection] = useState("team")

  useEffect(() => {
    if (!slug) return

    let active = true

    const load = async () => {
      setLoading(true)
      const [portfolio, session] = await Promise.all([getTeamPortfolio(slug), getCurrentSession()])
      if (!active) return
      setData(portfolio)
      setViewerUserId(session.data.session?.user.id ?? "")
      setLoading(false)
    }

    void load()

    return () => {
      active = false
    }
  }, [slug])

  const membersById = useMemo(() => {
    const map = new Map<string, ITeamMember>()
    data?.members.forEach((member) => map.set(member.id, member))
    return map
  }, [data])

  const visibleSections = useMemo(() => {
    if (!data) return []
    return SECTION_ORDER.map((section) => ({
      section,
      items: (data.sections?.[section] as Record<string, unknown>[] | undefined) ?? [],
    })).filter((entry) => entry.items.length > 0)
  }, [data])

  const isMember = Boolean(viewerUserId && data?.members.some((member) => member.id === viewerUserId))

  useEffect(() => {
    if (visibleSections.length === 0) return

    const navIds = ["team", "members", ...visibleSections.map((entry) => entry.section)]
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id)
        })
      },
      { threshold: 0.3 },
    )

    navIds.forEach((id) => {
      const element = document.getElementById(id)
      if (element) observer.observe(element)
    })

    return () => observer.disconnect()
  }, [visibleSections])

  const copyTeamLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard unavailable
    }
  }

  if (loading) {
    return (
      <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden px-6">
        <div className="relative w-full max-w-md rounded-3xl border border-border/50 bg-card/60 p-8 text-center shadow-xl backdrop-blur-xl">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <h2 className="text-xl font-semibold text-foreground">Loading team</h2>
          <p className="mt-2 text-sm text-muted-foreground">Fetching members and shared work...</p>
        </div>
      </main>
    )
  }

  if (!data) {
    return (
      <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden px-6">
        <div className="relative w-full max-w-md rounded-3xl border border-border/50 bg-card/60 p-8 text-center shadow-xl backdrop-blur-xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/60">
            <Users className="h-7 w-7 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Team Not Found</h2>
          <p className="mt-3 text-muted-foreground">
            The team <span className="font-semibold text-primary">/t/{slug}</span> doesn&apos;t exist or is not public.
          </p>
          <Link
            href="/"
            className="mt-8 inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition-all hover:-translate-y-0.5"
          >
            Go to Homepage
          </Link>
        </div>
      </main>
    )
  }

  const team = data.team
  const logo = getProxiedImageUrl(team.logo)

  const navItems = [
    { id: "team", label: "Team" },
    { id: "members", label: "Members" },
    ...visibleSections.map(({ section }) => ({ id: section, label: TEAM_SECTION_LABELS[section] })),
  ]

  return (
    <>
      <Head>
        <title>{team.name} | folio</title>
        <meta name="description" content={team.tagline || team.description || `The ${team.name} team portfolio on folio.`} />
      </Head>

      <main className="relative min-h-screen overflow-hidden bg-background transition-colors duration-500">
        {/* Hero */}
        <section id="team" className="relative isolate scroll-mt-24 px-6 pb-16 pt-28 md:pb-20 md:pt-32">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-purple-500/10 dark:from-primary/15 dark:via-transparent dark:to-purple-500/15" />
          <div className="pointer-events-none absolute left-[-10%] top-[-20%] h-[420px] w-[420px] rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute bottom-[-20%] right-[-10%] h-[360px] w-[360px] rounded-full bg-teal-500/10 blur-3xl" />

          <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center gap-8 text-center md:flex-row md:items-end md:text-left">
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45 }}
              className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-3xl border-4 border-background bg-gradient-to-br from-cyan-500 to-teal-500 text-4xl font-bold text-white shadow-2xl md:h-36 md:w-36"
            >
              {logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt={team.name} className="h-full w-full object-cover" />
              ) : (
                team.name.charAt(0).toUpperCase()
              )}
            </motion.div>

            <div className="min-w-0 flex-1">
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }}>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                  <Users className="h-3.5 w-3.5" />
                  Team Portfolio
                </span>
                <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-foreground md:text-5xl">{team.name}</h1>
                {team.tagline && <p className="mt-3 text-lg font-medium text-primary">{team.tagline}</p>}
                {team.description && (
                  <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">{team.description}</p>
                )}
                <p className="mt-4 text-sm text-muted-foreground">
                  {data.members.length} {data.members.length === 1 ? "member" : "members"}
                  {visibleSections.length > 0
                    ? ` · ${visibleSections.reduce((total, entry) => total + entry.items.length, 0)} shared items`
                    : ""}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.12 }}
                className="mt-6 flex flex-wrap items-center justify-center gap-3 md:justify-start"
              >
                {isMember && (
                  <Link
                    href={`/t/${encodeURIComponent(team.slug)}/workspace`}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5"
                  >
                    <Settings2 className="h-4 w-4" />
                    Open workspace
                  </Link>
                )}
                <button
                  type="button"
                  onClick={copyTeamLink}
                  className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-card/60 px-5 py-2.5 text-sm font-semibold text-foreground transition-all hover:-translate-y-0.5 hover:border-primary/30"
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Link2 className="h-4 w-4" />}
                  {copied ? "Link copied" : "Share team"}
                </button>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Members */}
        <section id="members" className="relative mx-auto w-full max-w-6xl scroll-mt-24 px-6 py-14">
          <div className="mb-8">
            <h2 className="text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">Members</h2>
            <p className="mt-1 text-sm text-muted-foreground">Click a member to open their own portfolio.</p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.members.map((member, index) => {
              const name = getMemberName(member)
              const href = getProfileHref(member)
              const photo = getProxiedImageUrl(member.photo)

              const card = (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className={cn(
                    "flex items-center gap-4 rounded-2xl border border-border/50 bg-card/60 p-5 backdrop-blur-xl transition-all",
                    href && "hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg",
                  )}
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-500 text-lg font-bold text-white">
                    {photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photo} alt={name} className="h-full w-full object-cover" />
                    ) : (
                      name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-bold text-foreground">{name}</p>
                      {member.role === "owner" && (
                        <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-300">
                          Owner
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      @{member.username}
                      {member.jobRole ? ` · ${member.jobRole}` : ""}
                    </p>
                    {member.show === false && (
                      <p className="mt-1 text-[11px] text-muted-foreground/70">Private portfolio</p>
                    )}
                  </div>
                  {href && <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
                </motion.div>
              )

              return href ? (
                <Link key={member.id} href={href}>
                  {card}
                </Link>
              ) : (
                <div key={member.id}>{card}</div>
              )
            })}
          </div>
        </section>

        {/* Shared content */}
        {visibleSections.map(({ section, items }) => {
          const Icon = SECTION_ICONS[section] ?? Layers

          return (
            <SectionShell key={section} id={section} title={TEAM_SECTION_LABELS[section]} count={items.length}>
              <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
                <Icon className="h-4 w-4 text-primary" />
                Work shared with this team
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {items.map((raw, index) => {
                  const item = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>
                  const member = membersById.get(asString(item.person))
                  return (
                    <div key={asString(item.id) || `${section}-${index}`}>
                      {renderItem(section, item, member, index)}
                    </div>
                  )
                })}
              </div>
            </SectionShell>
          )
        })}

        {visibleSections.length === 0 && (
          <section className="relative mx-auto w-full max-w-6xl px-6 py-16 text-center">
            <div className="mx-auto max-w-lg rounded-3xl border border-border/50 bg-card/50 p-10 backdrop-blur">
              <Sparkles className="mx-auto h-8 w-8 text-primary" />
              <h2 className="mt-4 text-xl font-bold text-foreground">No shared work yet</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Members haven&apos;t shared any portfolio items with this team yet. Check back soon!
              </p>
            </div>
          </section>
        )}

        {/* Section navigation */}
        <AnimatePresence>
          <motion.nav
            className="fixed right-4 top-1/2 z-50 hidden -translate-y-1/2 lg:block"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            <div className="rounded-2xl border border-border/50 bg-background/60 p-2.5 shadow-lg backdrop-blur-xl">
              <div className="flex flex-col gap-2">
                {navItems.map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })}
                    className="group relative flex items-center"
                    aria-label={`Scroll to ${label}`}
                  >
                    <span className="pointer-events-none absolute right-10 whitespace-nowrap rounded-lg bg-foreground px-2.5 py-1.5 text-xs font-medium text-background opacity-0 shadow-md transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100" style={{ transform: "translateX(4px)" }}>
                      {label}
                    </span>
                    <div
                      className={cn(
                        "h-2.5 w-2.5 rounded-full transition-all duration-300",
                        activeSection === id
                          ? "scale-125 bg-primary shadow-lg shadow-primary/40"
                          : "bg-muted-foreground/30 hover:scale-110 hover:bg-muted-foreground/50",
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>
          </motion.nav>
        </AnimatePresence>

        <footer className="relative z-10 border-t border-border/40 py-8 text-center text-xs text-muted-foreground">
          <Link href="/" className="font-semibold text-primary hover:underline">
            Built with folio
          </Link>
        </footer>
      </main>
    </>
  )
}
