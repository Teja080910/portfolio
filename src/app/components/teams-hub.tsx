"use client"

import { getProxiedImageUrl } from "@/lib/image-proxy"
import { ITeam, ITeamInvite, TeamRole } from "@/lib/interfaces"
import { getCurrentSession, setPostAuthRedirect } from "@/lib/auth-session"
import {
  createTeam,
  getMyPendingInvites,
  getMyTeams,
  isValidTeamSlug,
  isTeamSlugAvailable,
  normalizeTeamSlug,
  sanitizeTeamSlugInput,
  TEAM_SLUG_ERROR,
  uploadTeamLogo,
} from "@/lib/teams"
import { cn } from "@/lib/utils"
import { AnimatePresence, motion } from "framer-motion"
import {
  ArrowUpRight,
  Camera,
  Compass,
  Crown,
  Loader2,
  Mail,
  Plus,
  Settings2,
  Sparkles,
  UserRound,
  Users,
  X,
} from "lucide-react"
import Head from "next/head"
import Link from "next/link"
import { useRouter } from "next/router"
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react"

type TeamEntry = { team: ITeam; role: TeamRole }

const emptyForm = { name: "", slug: "", tagline: "", description: "" }

export default function TeamsHub() {
  const router = useRouter()
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [loading, setLoading] = useState(true)
  const [teams, setTeams] = useState<TeamEntry[]>([])
  const [invites, setInvites] = useState<ITeamInvite[]>([])
  const [form, setForm] = useState(emptyForm)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState("")
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState("")
  const [showCreate, setShowCreate] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const slugEditedRef = useRef(false)

  useEffect(() => {
    let active = true

    const init = async () => {
      const { data } = await getCurrentSession()
      const sessionUser = data.session?.user

      if (!active) return

      if (!sessionUser) {
        setPostAuthRedirect("/teams")
        void router.replace("/sign-in")
        return
      }

      setCheckingAuth(false)

      const [myTeams, pendingInvites] = await Promise.all([getMyTeams(), getMyPendingInvites()])

      if (!active) return
      setTeams(myTeams)
      setInvites(pendingInvites)
      setLoading(false)
    }

    void init()

    return () => {
      active = false
    }
  }, [router])

  useEffect(() => {
    if (!logoFile) {
      setLogoPreview("")
      return
    }
    const objectUrl = URL.createObjectURL(logoFile)
    setLogoPreview(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [logoFile])

  const handleNameChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      name: value,
      slug: slugEditedRef.current ? prev.slug : sanitizeTeamSlugInput(value),
    }))
  }

  const handleLogoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      setError("Team logo must be an image file.")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Team logo must be smaller than 5MB.")
      return
    }
    setError("")
    setLogoFile(file)
  }

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault()
    if (creating) return

    setError("")

    const slug = normalizeTeamSlug(form.slug) || normalizeTeamSlug(form.name)

    if (form.name.trim().length < 2) {
      setError("Team name must be at least 2 characters.")
      return
    }

    if (!isValidTeamSlug(slug)) {
      setError(TEAM_SLUG_ERROR)
      return
    }

    if (slug !== form.slug) {
      setForm((prev) => ({ ...prev, slug }))
    }

    setCreating(true)

    try {
      const { data } = await getCurrentSession()
      const sessionUser = data.session?.user

      if (!sessionUser) {
        setPostAuthRedirect("/teams")
        void router.replace("/sign-in")
        return
      }

      const available = await isTeamSlugAvailable(slug)
      if (!available) {
        setError("That slug is already taken. Try another one.")
        return
      }

      let logo: string | undefined
      if (logoFile) {
        const uploaded = await uploadTeamLogo(sessionUser.id, logoFile)
        if (uploaded) logo = uploaded
      }

      const { team, error: createError } = await createTeam({
        name: form.name,
        slug,
        tagline: form.tagline,
        description: form.description,
        logo,
      })

      if (createError || !team) {
        setError(createError ?? "Failed to create the team. Please try again.")
        return
      }

      void router.push(`/t/${encodeURIComponent(team.slug)}/workspace`)
    } finally {
      setCreating(false)
    }
  }

  if (checkingAuth) {
    return (
      <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden px-6">
        <div className="relative w-full max-w-md rounded-3xl border border-border/50 bg-card/60 p-8 text-center shadow-xl backdrop-blur-xl">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <h2 className="text-xl font-semibold text-foreground">Loading your teams</h2>
          <p className="mt-2 text-sm text-muted-foreground">Checking your session...</p>
        </div>
      </main>
    )
  }

  return (
    <>
      <Head>
        <title>My Teams | folio</title>
        <meta name="description" content="Create and manage your team portfolios on folio." />
      </Head>

      <main className="relative min-h-screen overflow-hidden bg-background px-6 py-24 transition-colors duration-300 md:py-28">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-purple-500/5 dark:from-primary/10 dark:via-transparent dark:to-purple-500/10" />
        <div className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-full -translate-x-1/2 bg-gradient-radial from-primary/5 to-transparent dark:from-primary/10" />

        <div className="relative z-10 mx-auto max-w-6xl">
          <header className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
                My <span className="gradient-text">Teams</span>
              </h1>
              <p className="mt-2 max-w-xl text-muted-foreground">
                Build team portfolios with your teammates. Everyone keeps their own profile — share selected work to a
                team and it shows up on the team page.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.08 }}
              className="flex flex-wrap items-center gap-3"
            >
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-card/60 px-4 py-2.5 text-sm font-semibold text-foreground transition-all hover:-translate-y-0.5 hover:border-primary/30"
              >
                <Compass className="h-4 w-4" />
                Explore
              </Link>
              <button
                type="button"
                onClick={() => setShowCreate((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5"
              >
                {showCreate ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {showCreate ? "Close" : "Create team"}
              </button>
            </motion.div>
          </header>

          <AnimatePresence>
            {showCreate && (
              <motion.section
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <form
                  onSubmit={handleCreate}
                  autoComplete="off"
                  className="mb-10 rounded-3xl border border-primary/20 bg-card/70 p-6 shadow-lg backdrop-blur-xl md:p-8"
                >
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                      <Sparkles className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-foreground">Create a new team</h2>
                      <p className="text-sm text-muted-foreground">You will be the owner and can invite members right after.</p>
                    </div>
                  </div>

                  <div className="grid gap-5 md:grid-cols-[auto,1fr]">
                    <div className="flex flex-col items-center gap-2">
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-border bg-secondary/40 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                      >
                        {logoPreview ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={logoPreview} alt="Team logo preview" className="h-full w-full object-cover" />
                        ) : (
                          <Camera className="h-6 w-6" />
                        )}
                      </button>
                      <span className="text-xs text-muted-foreground">Logo (optional)</span>
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="hidden"
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label htmlFor="team-name" className="text-sm font-medium text-foreground">
                          Team name *
                        </label>
                        <input
                          id="team-name"
                          name="team-name"
                          value={form.name}
                          onChange={(event) => handleNameChange(event.target.value)}
                          placeholder="Pixel Labs"
                          autoComplete="off"
                          spellCheck={false}
                          className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-primary/40"
                        />
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="team-handle" className="text-sm font-medium text-foreground">
                          Team handle *
                        </label>
                        <div className="flex items-center overflow-hidden rounded-xl border border-border bg-background focus-within:border-primary/40">
                          <span className="border-r border-border bg-secondary/50 px-3 py-3 text-sm text-muted-foreground">
                            /t/
                          </span>
                          <input
                            id="team-handle"
                            name="team-handle"
                            value={form.slug}
                            onChange={(event) => {
                              setForm((prev) => ({ ...prev, slug: sanitizeTeamSlugInput(event.target.value) }))
                            }}
                            onKeyDown={() => {
                              slugEditedRef.current = true
                            }}
                            onPaste={() => {
                              slugEditedRef.current = true
                            }}
                            placeholder="pixel-labs"
                            autoComplete="off"
                            autoCapitalize="off"
                            autoCorrect="off"
                            spellCheck={false}
                            className="h-11 w-full bg-transparent px-3 text-sm text-foreground outline-none"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Your team link:{" "}
                          <span className="font-medium text-foreground">
                            /t/{normalizeTeamSlug(form.slug || form.name) || "your-team"}
                          </span>
                          {" "}· letters, numbers, hyphens or underscores
                        </p>
                      </div>

                      <div className="space-y-2 sm:col-span-2">
                        <label htmlFor="team-tagline" className="text-sm font-medium text-foreground">
                          Tagline
                        </label>
                        <input
                          id="team-tagline"
                          value={form.tagline}
                          onChange={(event) => setForm((prev) => ({ ...prev, tagline: event.target.value }))}
                          placeholder="We build delightful products"
                          className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-primary/40"
                        />
                      </div>

                      <div className="space-y-2 sm:col-span-2">
                        <label htmlFor="team-description" className="text-sm font-medium text-foreground">
                          Description
                        </label>
                        <textarea
                          id="team-description"
                          value={form.description}
                          onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                          placeholder="What does your team do?"
                          rows={3}
                          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary/40"
                        />
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-950/30 dark:text-rose-300">
                      {error}
                    </div>
                  )}

                  <div className="mt-6 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowCreate(false)}
                      className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creating}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                      {creating ? "Creating..." : "Create team"}
                    </button>
                  </div>
                </form>
              </motion.section>
            )}
          </AnimatePresence>

          {invites.length > 0 && (
            <section className="mb-10">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-foreground">
                <Mail className="h-5 w-5 text-primary" />
                Pending invitations
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {invites.map((invite) => (
                  <motion.div
                    key={invite.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-4 rounded-2xl border border-amber-300/50 bg-amber-50/70 p-4 dark:border-amber-500/20 dark:bg-amber-500/10"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-400/20 text-amber-600 dark:text-amber-300">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-foreground">{invite.team?.name ?? "A team"}</p>
                      <p className="text-xs text-muted-foreground">
                        Invited as {invite.email} — check your inbox for the accept link.
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="mb-4 text-lg font-bold text-foreground">Your teams</h2>

            {loading ? (
              <div className="flex min-h-[240px] items-center justify-center rounded-3xl border border-border/50 bg-card/40">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : teams.length === 0 ? (
              <div className="flex min-h-[260px] flex-col items-center justify-center rounded-3xl border border-border/50 bg-card/40 p-10 text-center backdrop-blur">
                <div className="mb-4 rounded-full bg-secondary/70 p-4 text-muted-foreground">
                  <Users className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">No teams yet</h3>
                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                  Create your first team or accept an invitation from a teammate. Your personal portfolio stays yours —
                  team pages only show what you share.
                </p>
                <button
                  type="button"
                  onClick={() => setShowCreate(true)}
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5"
                >
                  <Plus className="h-4 w-4" />
                  Create a team
                </button>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {teams.map(({ team, role }) => {
                  const logo = getProxiedImageUrl(team.logo)
                  const initials = (team.name || team.slug || "T").charAt(0).toUpperCase()

                  return (
                    <motion.div
                      key={team.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="group flex h-full flex-col rounded-3xl border border-border/50 bg-card/60 p-5 shadow-sm backdrop-blur-xl transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-500 text-lg font-bold text-white">
                          {logo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={logo} alt={team.name} className="h-full w-full object-cover" />
                          ) : (
                            initials
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="truncate text-base font-bold text-foreground">{team.name}</h3>
                            {role === "owner" && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-300">
                                <Crown className="h-3 w-3" />
                                Owner
                              </span>
                            )}
                          </div>
                          <p className="truncate text-xs text-muted-foreground">/t/{team.slug}</p>
                          {team.tagline && (
                            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{team.tagline}</p>
                          )}
                        </div>
                      </div>

                      <div className="mt-5 flex items-center gap-2 pt-0">
                        <Link
                          href={`/t/${encodeURIComponent(team.slug)}`}
                          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:border-primary/30 hover:text-primary"
                        >
                          View
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                        <Link
                          href={`/t/${encodeURIComponent(team.slug)}/workspace`}
                          className={cn(
                            "inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all",
                            "bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 hover:opacity-90",
                          )}
                        >
                          <Settings2 className="h-3.5 w-3.5" />
                          Workspace
                        </Link>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </section>

          <p className="mt-10 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <UserRound className="h-3.5 w-3.5" />
            Everyone appears on the team page with a link to their own portfolio.
          </p>
        </div>
      </main>
    </>
  )
}
