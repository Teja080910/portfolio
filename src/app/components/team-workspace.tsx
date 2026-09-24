"use client"

import { useToast } from "@/app/components/toast"
import { getCurrentSession, setPostAuthRedirect } from "@/lib/auth-session"
import { getProxiedImageUrl } from "@/lib/image-proxy"
import { ITeam, ITeamInviteRecord, ITeamMember, TeamRole, TeamSectionKey } from "@/lib/interfaces"
import {
  createTeamInvite,
  deleteTeam,
  getMyShares,
  getTeamBySlug,
  getTeamInvites,
  getTeamMembers,
  getTeamMembership,
  leaveTeam,
  removeTeamMember,
  revokeTeamInvite,
  sendTeamInviteEmail,
  shareItems,
  TEAM_SECTION_KEYS,
  TEAM_SECTION_LABELS,
  unshareItem,
  unshareSectionItems,
  updateTeam,
  uploadTeamLogo,
} from "@/lib/teams"
import { supabase } from "@/lib/db"
import { cn } from "@/lib/utils"
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ClipboardCopy,
  Crown,
  ExternalLink,
  Link2,
  Loader2,
  LogOut,
  Mail,
  Settings2,
  Share2,
  Trash2,
  UserMinus,
  Users,
} from "lucide-react"
import Head from "next/head"
import Link from "next/link"
import { useRouter } from "next/router"
import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from "react"

type WorkspaceTab = "overview" | "members" | "content"
type PageStatus = "loading" | "ready" | "not_found" | "signed_out"

type PortfolioRow = Record<string, unknown>

const asString = (value: unknown) => (typeof value === "string" ? value : "")

const getItemId = (item: Record<string, unknown>) => asString(item.id)
const getItemShow = (item: Record<string, unknown>) => item.show !== false

function getItemLabel(section: TeamSectionKey, item: Record<string, unknown>) {
  switch (section) {
    case "skills":
      return asString(item.skilltype) || "Skill group"
    case "projects":
      return asString(item.name) || "Untitled project"
    case "experience":
      return asString(item.role) || asString(item.type) || "Experience"
    case "education":
      return asString(item.name) || asString(item.course) || "Education"
    case "certificates":
      return asString(item.name) || "Certificate"
    case "content_channels":
      return asString(item.platform) || asString(item.handle) || "Channel"
    case "content_works":
      return asString(item.title) || "Content piece"
    case "collaborations":
      return asString(item.brand) || "Collaboration"
    case "creator_tools":
      return asString(item.name) || "Tool"
    default:
      return "Item"
  }
}

function getItemMeta(section: TeamSectionKey, item: Record<string, unknown>) {
  switch (section) {
    case "skills": {
      const skills = Array.isArray(item.skills) ? (item.skills as unknown[]).map(asString).filter(Boolean) : []
      return skills.slice(0, 5).join(", ")
    }
    case "projects":
      return asString(item.projectType) || asString(item.duration)
    case "experience":
      return [asString(item.type), asString(item.location), asString(item.duration)].filter(Boolean).join(" · ")
    case "education":
      return [asString(item.course), asString(item.branch), asString(item.duration)].filter(Boolean).join(" · ")
    case "certificates":
      return asString(item.duration)
    case "content_channels":
      return [asString(item.handle), asString(item.subscriberCount)].filter(Boolean).join(" · ")
    case "content_works":
      return [asString(item.type), asString(item.views)].filter(Boolean).join(" · ")
    case "collaborations":
      return asString(item.date)
    case "creator_tools":
      return asString(item.category)
    default:
      return ""
  }
}

export default function TeamWorkspace() {
  const router = useRouter()
  const { toast } = useToast()

  const slug = router.isReady && typeof router.query.slug === "string" ? router.query.slug : ""

  const [status, setStatus] = useState<PageStatus>("loading")
  const [team, setTeam] = useState<ITeam | null>(null)
  const [role, setRole] = useState<TeamRole>("member")
  const [userId, setUserId] = useState("")
  const [members, setMembers] = useState<ITeamMember[]>([])
  const [invites, setInvites] = useState<ITeamInviteRecord[]>([])
  const [tab, setTab] = useState<WorkspaceTab>("overview")

  const [content, setContent] = useState<PortfolioRow>({})
  const [shares, setShares] = useState<Set<string>>(new Set())
  const [contentLoading, setContentLoading] = useState(true)

  const [settings, setSettings] = useState({ name: "", tagline: "", description: "", show: true, logo: "" })
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [settingsSaving, setSettingsSaving] = useState(false)

  const [inviteEmail, setInviteEmail] = useState("")
  const [inviting, setInviting] = useState(false)
  const [latestInviteLink, setLatestInviteLink] = useState("")
  const [copied, setCopied] = useState("")

  const [confirmLeave, setConfirmLeave] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleteText, setDeleteText] = useState("")

  const loadWorkspace = useCallback(async () => {
    if (!slug) return

    const { data } = await getCurrentSession()
    const sessionUser = data.session?.user

    if (!sessionUser) {
      setPostAuthRedirect(`/t/${slug}/workspace`)
      setStatus("signed_out")
      void router.replace("/sign-in")
      return
    }

    const teamData = await getTeamBySlug(slug)

    if (!teamData) {
      setStatus("not_found")
      return
    }

    const membership = await getTeamMembership(teamData.id)

    if (!membership) {
      void router.replace(`/t/${encodeURIComponent(slug)}`)
      return
    }

    setUserId(sessionUser.id)
    setTeam(teamData)
    setRole(membership.role)
    setSettings({
      name: teamData.name,
      tagline: teamData.tagline ?? "",
      description: teamData.description ?? "",
      show: teamData.show,
      logo: teamData.logo ?? "",
    })

    const [memberList, inviteList, contentRes, shareSet] = await Promise.all([
      getTeamMembers(teamData.id),
      membership.role === "owner" ? getTeamInvites(teamData.id) : Promise.resolve([] as ITeamInviteRecord[]),
      supabase.from("portfolio_contents").select("*").eq("user_id", sessionUser.id).maybeSingle(),
      getMyShares(teamData.id),
    ])

    setMembers(memberList)
    setInvites(inviteList)
    setContent((contentRes.data as PortfolioRow | null) ?? {})
    setShares(shareSet)
    setContentLoading(false)
    setStatus("ready")
  }, [router, slug])

  useEffect(() => {
    void loadWorkspace()
  }, [loadWorkspace])

  const sections = useMemo(() => {
    return TEAM_SECTION_KEYS.map((section) => {
      const raw = content[section]
      const items = Array.isArray(raw) ? (raw as Record<string, unknown>[]) : []
      return { section, items }
    })
  }, [content])

  const sharedCount = shares.size

  const copyToClipboard = async (value: string, key: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(key)
      setTimeout(() => setCopied(""), 2000)
    } catch {
      toast("Could not copy to clipboard.", "error")
    }
  }

  const handleToggleShare = async (section: TeamSectionKey, item: Record<string, unknown>) => {
    if (!team) return
    const itemId = getItemId(item)
    if (!itemId) {
      toast("This item has no id yet. Open your portfolio editor and save it once to enable sharing.", "error")
      return
    }

    const key = `${section}:${itemId}`
    const isShared = shares.has(key)

    setShares((prev) => {
      const next = new Set(prev)
      if (isShared) next.delete(key)
      else next.add(key)
      return next
    })

    const { error } = isShared
      ? await unshareItem(team.id, userId, section, itemId)
      : await shareItems(team.id, userId, [{ section, itemId }])

    if (error) {
      setShares((prev) => {
        const next = new Set(prev)
        if (isShared) next.add(key)
        else next.delete(key)
        return next
      })
      toast(error, "error")
    }
  }

  const handleToggleSection = async (section: TeamSectionKey, share: boolean) => {
    if (!team) return
    const items = sections.find((entry) => entry.section === section)?.items ?? []
    const ids = items.map(getItemId).filter(Boolean)
    if (ids.length === 0) return

    setShares((prev) => {
      const next = new Set(prev)
      ids.forEach((id) => {
        const key = `${section}:${id}`
        if (share) next.add(key)
        else next.delete(key)
      })
      return next
    })

    const { error } = share
      ? await shareItems(team.id, userId, ids.map((itemId) => ({ section, itemId })))
      : await unshareSectionItems(team.id, userId, section, ids)

    if (error) {
      toast(error, "error")
      void loadWorkspace()
    }
  }

  const handleSaveSettings = async (event: FormEvent) => {
    event.preventDefault()
    if (!team || settingsSaving) return

    if (settings.name.trim().length < 2) {
      toast("Team name must be at least 2 characters.", "error")
      return
    }

    setSettingsSaving(true)
    try {
      let logo = settings.logo || null

      if (logoFile) {
        const uploaded = await uploadTeamLogo(userId, logoFile)
        if (!uploaded) {
          toast("Failed to upload the team logo.", "error")
          return
        }
        logo = uploaded
      }

      const { error } = await updateTeam(team.id, {
        name: settings.name,
        tagline: settings.tagline,
        description: settings.description,
        logo,
        show: settings.show,
      })

      if (error) {
        toast(error, "error")
        return
      }

      setTeam((prev) => (prev ? { ...prev, ...settings, logo } : prev))
      setLogoFile(null)
      toast("Team settings saved.")
    } finally {
      setSettingsSaving(false)
    }
  }

  const handleLogoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast("Team logo must be an image file.", "error")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast("Team logo must be smaller than 5MB.", "error")
      return
    }
    setLogoFile(file)
    setSettings((prev) => ({ ...prev, logo: URL.createObjectURL(file) }))
  }

  const handleCreateInviteLink = async () => {
    if (!team || inviting) return
    setInviting(true)
    try {
      const { token, invite, error } = await createTeamInvite({ teamId: team.id, email: null, expiresInDays: 30 })
      if (error || !token || !invite) {
        toast(error ?? "Failed to create invite link.", "error")
        return
      }
      const link = `${window.location.origin}/invite/${token}`
      setLatestInviteLink(link)
      setInvites((prev) => [invite, ...prev])
      await copyToClipboard(link, "latest")
      toast("Invite link created and copied.")
    } finally {
      setInviting(false)
    }
  }

  const handleInviteByEmail = async (event: FormEvent) => {
    event.preventDefault()
    if (!team || inviting) return

    const email = inviteEmail.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast("Enter a valid email address.", "error")
      return
    }

    setInviting(true)
    try {
      const { token, invite, error } = await createTeamInvite({ teamId: team.id, email, expiresInDays: 7 })

      if (error || !token || !invite) {
        toast(error ?? "Failed to create invite.", "error")
        return
      }

      setInvites((prev) => [invite, ...prev])
      setInviteEmail("")

      const emailResult = await sendTeamInviteEmail(token)
      if (!emailResult.ok) {
        const link = `${window.location.origin}/invite/${token}`
        setLatestInviteLink(link)
        toast(`Invite created, but the email failed to send (${emailResult.error}). Copy the link instead.`, "error")
        return
      }

      toast(`Invite email sent to ${email}.`)
    } finally {
      setInviting(false)
    }
  }

  const handleRevokeInvite = async (inviteId: string) => {
    const { error } = await revokeTeamInvite(inviteId)
    if (error) {
      toast(error, "error")
      return
    }
    setInvites((prev) => prev.map((invite) => (invite.id === inviteId ? { ...invite, revoked: true } : invite)))
    toast("Invite revoked.")
  }

  const handleRemoveMember = async (member: ITeamMember) => {
    if (!team) return
    const { error } = await removeTeamMember(team.id, member.id)
    if (error) {
      toast(error, "error")
      return
    }
    setMembers((prev) => prev.filter((entry) => entry.id !== member.id))
    toast(`${member.firstname || member.username} was removed from the team.`)
  }

  const handleLeaveTeam = async () => {
    if (!team) return
    const { error } = await leaveTeam(team.id)
    if (error) {
      toast(error, "error")
      return
    }
    toast("You left the team.")
    void router.replace("/teams")
  }

  const handleDeleteTeam = async () => {
    if (!team) return
    const { error } = await deleteTeam(team.id)
    if (error) {
      toast(error, "error")
      return
    }
    toast("Team deleted.")
    void router.replace("/teams")
  }

  if (status === "loading") {
    return (
      <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden px-6">
        <div className="relative w-full max-w-md rounded-3xl border border-border/50 bg-card/60 p-8 text-center shadow-xl backdrop-blur-xl">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <h2 className="text-xl font-semibold text-foreground">Opening team workspace</h2>
          <p className="mt-2 text-sm text-muted-foreground">Checking your membership and loading content...</p>
        </div>
      </main>
    )
  }

  if (status === "not_found" || !team) {
    return (
      <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden px-6">
        <div className="relative w-full max-w-md rounded-3xl border border-border/50 bg-card/60 p-8 text-center shadow-xl backdrop-blur-xl">
          <h2 className="text-2xl font-bold text-foreground">Team Not Found</h2>
          <p className="mt-3 text-muted-foreground">This team doesn&apos;t exist or you no longer have access to it.</p>
          <Link
            href="/teams"
            className="mt-8 inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition-all hover:-translate-y-0.5"
          >
            Back to My Teams
          </Link>
        </div>
      </main>
    )
  }

  const owner = role === "owner"
  const inviteLinkHint = latestInviteLink

  return (
    <>
      <Head>
        <title>{team.name} Workspace | folio</title>
        <meta name="description" content={`Manage the ${team.name} team portfolio.`} />
      </Head>

      <main className="relative min-h-screen overflow-hidden bg-background px-4 py-20 transition-colors duration-300 md:px-6 md:py-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(20,184,166,0.12),transparent_24%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.2),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(45,212,191,0.16),transparent_30%)]" />

        <div className="relative z-10 mx-auto max-w-5xl">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <Link
              href={`/t/${encodeURIComponent(team.slug)}`}
              className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to team page
            </Link>
            <Link
              href="/teams"
              className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-card/60 px-4 py-2 text-sm font-semibold text-foreground transition-all hover:border-primary/30"
            >
              <Users className="h-4 w-4" />
              All my teams
            </Link>
          </div>

          <header className="mb-8 flex flex-col gap-5 rounded-3xl border border-border/50 bg-card/60 p-6 shadow-lg backdrop-blur-xl md:flex-row md:items-center">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-500 text-2xl font-bold text-white shadow-lg">
              {settings.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={getProxiedImageUrl(settings.logo) || settings.logo} alt={team.name} className="h-full w-full object-cover" />
              ) : (
                team.name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-extrabold tracking-tight text-foreground">{team.name}</h1>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                    owner
                      ? "bg-amber-400/15 text-amber-600 dark:text-amber-300"
                      : "bg-cyan-400/15 text-cyan-700 dark:text-cyan-300",
                  )}
                >
                  {owner && <Crown className="h-3 w-3" />}
                  {owner ? "Owner" : "Member"}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                /t/{team.slug} · {members.length} {members.length === 1 ? "member" : "members"}
              </p>
              {team.tagline && <p className="mt-2 text-sm text-foreground/80">{team.tagline}</p>}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => copyToClipboard(`${window.location.origin}/t/${team.slug}`, "page")}
                className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-xs font-semibold text-foreground transition-colors hover:border-primary/30 hover:text-primary"
              >
                {copied === "page" ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
                {copied === "page" ? "Copied" : "Copy link"}
              </button>
              <Link
                href={`/t/${encodeURIComponent(team.slug)}`}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-2.5 text-xs font-semibold text-slate-950 transition-all hover:-translate-y-0.5"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View team page
              </Link>
            </div>
          </header>

          <div className="mb-8 flex flex-wrap gap-2">
            {(
              [
                { id: "overview" as WorkspaceTab, label: "Overview", icon: Settings2 },
                { id: "members" as WorkspaceTab, label: `Members (${members.length})`, icon: Users },
                { id: "content" as WorkspaceTab, label: `My shared content (${sharedCount})`, icon: Share2 },
              ]
            ).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all",
                  tab === id
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "border border-border/60 bg-card/60 text-muted-foreground hover:-translate-y-0.5 hover:border-primary/30 hover:text-primary",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>

          {tab === "overview" && (
            <section className="grid gap-6 lg:grid-cols-[1fr,320px]">
              <form
                onSubmit={handleSaveSettings}
                className="rounded-3xl border border-border/50 bg-card/60 p-6 shadow-sm backdrop-blur-xl"
              >
                <h2 className="text-lg font-bold text-foreground">Team profile</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {owner ? "Update how your team appears on its public page." : "Only the team owner can edit these details."}
                </p>

                <div className="mt-6 flex items-center gap-4">
                  <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border bg-secondary/40 text-muted-foreground">
                    {settings.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={getProxiedImageUrl(settings.logo) || settings.logo} alt="Team logo" className="h-full w-full object-cover" />
                    ) : (
                      <Users className="h-7 w-7" />
                    )}
                  </div>
                  {owner && (
                    <label className="cursor-pointer rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:border-primary/30 hover:text-primary">
                      Change logo
                      <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                    </label>
                  )}
                </div>

                <div className="mt-6 grid gap-5">
                  <div className="space-y-2">
                    <label htmlFor="ws-name" className="text-sm font-medium text-foreground">
                      Team name
                    </label>
                    <input
                      id="ws-name"
                      value={settings.name}
                      onChange={(event) => setSettings((prev) => ({ ...prev, name: event.target.value }))}
                      disabled={!owner}
                      className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-primary/40 disabled:opacity-60"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="ws-tagline" className="text-sm font-medium text-foreground">
                      Tagline
                    </label>
                    <input
                      id="ws-tagline"
                      value={settings.tagline}
                      onChange={(event) => setSettings((prev) => ({ ...prev, tagline: event.target.value }))}
                      disabled={!owner}
                      className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-primary/40 disabled:opacity-60"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="ws-description" className="text-sm font-medium text-foreground">
                      Description
                    </label>
                    <textarea
                      id="ws-description"
                      value={settings.description}
                      onChange={(event) => setSettings((prev) => ({ ...prev, description: event.target.value }))}
                      disabled={!owner}
                      rows={4}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary/40 disabled:opacity-60"
                    />
                  </div>

                  <label className="flex items-center gap-3 text-sm text-foreground">
                    <input
                      type="checkbox"
                      checked={settings.show}
                      onChange={(event) => setSettings((prev) => ({ ...prev, show: event.target.checked }))}
                      disabled={!owner}
                      className="h-4 w-4 rounded border-border accent-cyan-500"
                    />
                    Show this team in Explore and allow public visitors
                  </label>
                </div>

                {owner && (
                  <div className="mt-6 flex justify-end">
                    <button
                      type="submit"
                      disabled={settingsSaving}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 disabled:opacity-70"
                    >
                      {settingsSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      {settingsSaving ? "Saving..." : "Save changes"}
                    </button>
                  </div>
                )}
              </form>

              <div className="space-y-6">
                <div className="rounded-3xl border border-border/50 bg-card/60 p-6 shadow-sm backdrop-blur-xl">
                  <h3 className="text-base font-bold text-foreground">Invite teammates</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Send an email invite or create a shareable link. Only the owner can invite.
                  </p>

                  {owner ? (
                    <div className="mt-4 space-y-4">
                      <form onSubmit={handleInviteByEmail} className="space-y-2">
                        <label htmlFor="ws-invite-email" className="text-xs font-semibold text-muted-foreground">
                          Invite by email
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            id="ws-invite-email"
                            type="email"
                            value={inviteEmail}
                            onChange={(event) => setInviteEmail(event.target.value)}
                            placeholder="teammate@example.com"
                            className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-primary/40"
                          />
                          <button
                            type="submit"
                            disabled={inviting}
                            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-70"
                          >
                            {inviting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
                            Send
                          </button>
                        </div>
                      </form>

                      <button
                        type="button"
                        onClick={handleCreateInviteLink}
                        disabled={inviting}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-xs font-semibold text-foreground transition-colors hover:border-primary/30 hover:text-primary disabled:opacity-70"
                      >
                        <Link2 className="h-3.5 w-3.5" />
                        Create shareable invite link
                      </button>

                      {inviteLinkHint && (
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 dark:border-emerald-500/20 dark:bg-emerald-500/10">
                          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                            Link ready — copy it now, it won&apos;t be shown again:
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <input
                              readOnly
                              value={inviteLinkHint}
                              className="h-9 w-full truncate rounded-lg border border-emerald-200 bg-white px-2 text-xs text-slate-700 dark:border-emerald-500/20 dark:bg-slate-900 dark:text-slate-200"
                            />
                            <button
                              type="button"
                              onClick={() => copyToClipboard(inviteLinkHint, "latest")}
                              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                            >
                              {copied === "latest" ? <Check className="h-3.5 w-3.5" /> : <ClipboardCopy className="h-3.5 w-3.5" />}
                              Copy
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="mt-4 rounded-xl bg-secondary/60 px-4 py-3 text-xs text-muted-foreground">
                      Ask the team owner ({members.find((member) => member.role === "owner")?.firstname || "the owner"}) to
                      invite more teammates.
                    </p>
                  )}
                </div>

                {owner && invites.length > 0 && (
                  <div className="rounded-3xl border border-border/50 bg-card/60 p-6 shadow-sm backdrop-blur-xl">
                    <h3 className="text-base font-bold text-foreground">Pending invites</h3>
                    <ul className="mt-4 space-y-3">
                      {invites.map((invite) => (
                        <li key={invite.id} className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">
                              {invite.email || "Shareable link"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {invite.revoked
                                ? "Revoked"
                                : invite.accepted_at
                                  ? "Accepted"
                                  : `Expires ${new Date(invite.expires_at).toLocaleDateString()}`}
                            </p>
                          </div>
                          {!invite.revoked && !invite.accepted_at && (
                            <button
                              type="button"
                              onClick={() => handleRevokeInvite(invite.id)}
                              className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-rose-300 hover:text-rose-600"
                            >
                              Revoke
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="rounded-3xl border border-rose-200/60 bg-rose-50/50 p-6 dark:border-rose-500/20 dark:bg-rose-500/5">
                  <h3 className="flex items-center gap-2 text-base font-bold text-rose-700 dark:text-rose-300">
                    <AlertTriangle className="h-4 w-4" />
                    {owner ? "Danger zone" : "Leave team"}
                  </h3>
                  {owner ? (
                    <>
                      <p className="mt-2 text-sm text-rose-700/80 dark:text-rose-300/80">
                        Deleting the team removes its page, memberships, and invite links. Member portfolios are not
                        affected.
                      </p>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(true)}
                        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete team
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="mt-2 text-sm text-rose-700/80 dark:text-rose-300/80">
                        You will lose access to this team workspace. Your personal portfolio is not affected.
                      </p>
                      <button
                        type="button"
                        onClick={() => setConfirmLeave(true)}
                        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        Leave team
                      </button>
                    </>
                  )}
                </div>
              </div>
            </section>
          )}

          {tab === "members" && (
            <section className="rounded-3xl border border-border/50 bg-card/60 p-6 shadow-sm backdrop-blur-xl">
              <h2 className="text-lg font-bold text-foreground">Team members</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Member profiles link back to their own personal portfolios.
              </p>

              <ul className="mt-6 divide-y divide-border/60">
                {members.map((member) => {
                  const name = `${member.firstname || ""} ${member.lastname || ""}`.trim() || member.username
                  const profileHref = member.type === "business" ? `/b/${member.username}` : `/u/${member.username}`

                  return (
                    <li key={member.id} className="flex items-center gap-4 py-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 text-sm font-bold text-white">
                        {member.photo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={getProxiedImageUrl(member.photo) || member.photo}
                            alt={name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-semibold text-foreground">{name}</p>
                          {member.role === "owner" && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-300">
                              <Crown className="h-3 w-3" />
                              Owner
                            </span>
                          )}
                          {member.id === userId && (
                            <span className="rounded-full bg-cyan-400/15 px-2 py-0.5 text-[11px] font-semibold text-cyan-700 dark:text-cyan-300">
                              You
                            </span>
                          )}
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          @{member.username}
                          {member.jobRole ? ` · ${member.jobRole}` : ""}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        {member.show !== false && (
                          <Link
                            href={profileHref}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-primary/30 hover:text-primary"
                          >
                            Portfolio
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        )}
                        {owner && member.role !== "owner" && member.id !== userId && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(member)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-rose-300 hover:text-rose-600"
                          >
                            <UserMinus className="h-3 w-3" />
                            Remove
                          </button>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            </section>
          )}

          {tab === "content" && (
            <section className="space-y-6">
              <div className="rounded-3xl border border-cyan-300/40 bg-cyan-50/60 p-5 dark:border-cyan-500/20 dark:bg-cyan-500/5">
                <p className="flex items-start gap-3 text-sm text-cyan-800 dark:text-cyan-200">
                  <Share2 className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    Choose which items from your own portfolio appear on the <strong>{team.name}</strong> page. Items
                    that are hidden on your personal portfolio are never shown here. You can share the same item with
                    multiple teams.
                  </span>
                </p>
              </div>

              {contentLoading ? (
                <div className="flex min-h-[200px] items-center justify-center rounded-3xl border border-border/50 bg-card/40">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                sections.map(({ section, items }) => {
                  const shareableIds = items.map(getItemId).filter(Boolean)
                  const sharedInSection = shareableIds.filter((id) => shares.has(`${section}:${id}`)).length
                  const allShared = shareableIds.length > 0 && sharedInSection === shareableIds.length

                  return (
                    <div key={section} className="rounded-3xl border border-border/50 bg-card/60 p-6 shadow-sm backdrop-blur-xl">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h3 className="text-base font-bold text-foreground">{TEAM_SECTION_LABELS[section]}</h3>
                          <p className="text-xs text-muted-foreground">
                            {sharedInSection} of {shareableIds.length} shared
                          </p>
                        </div>
                        {shareableIds.length > 0 && (
                          <button
                            type="button"
                            onClick={() => handleToggleSection(section, !allShared)}
                            className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary"
                          >
                            {allShared ? "Unshare all" : "Share all"}
                          </button>
                        )}
                      </div>

                      {items.length === 0 ? (
                        <p className="mt-4 text-sm text-muted-foreground">
                          Nothing here yet. Add items in your portfolio editor first.
                        </p>
                      ) : (
                        <ul className="mt-4 divide-y divide-border/60">
                          {items.map((item, index) => {
                            const itemId = getItemId(item)
                            const key = `${section}:${itemId}`
                            const isShared = Boolean(itemId) && shares.has(key)
                            const isVisible = getItemShow(item)

                            return (
                              <li key={itemId || `${section}-${index}`} className="flex items-center gap-4 py-3.5">
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-semibold text-foreground">
                                    {getItemLabel(section, item)}
                                  </p>
                                  <p className="truncate text-xs text-muted-foreground">
                                    {getItemMeta(section, item) ||
                                      (isVisible ? "Visible on your portfolio" : "Hidden on your portfolio")}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleToggleShare(section, item)}
                                  disabled={!itemId}
                                  aria-pressed={isShared}
                                  className={cn(
                                    "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors",
                                    isShared ? "bg-gradient-to-r from-cyan-500 to-teal-500" : "bg-secondary",
                                    !itemId && "cursor-not-allowed opacity-50",
                                  )}
                                >
                                  <span
                                    className={cn(
                                      "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform",
                                      isShared ? "translate-x-6" : "translate-x-1",
                                    )}
                                  />
                                </button>
                              </li>
                            )
                          })}
                        </ul>
                      )}
                    </div>
                  )
                })
              )}
            </section>
          )}
        </div>

        {(confirmLeave || confirmDelete) && (
          <div
            className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setConfirmLeave(false)
                setConfirmDelete(false)
                setDeleteText("")
              }
            }}
          >
            <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl">
              <h3 className="text-lg font-bold text-foreground">
                {confirmDelete ? "Delete this team?" : "Leave this team?"}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {confirmDelete
                  ? `This permanently deletes ${team.name}, its memberships, and all invite links. Shared content stays on each member's personal portfolio.`
                  : `You will lose access to the ${team.name} workspace. You can rejoin later with a new invite.`}
              </p>

              {confirmDelete && (
                <div className="mt-4 space-y-2">
                  <label htmlFor="delete-confirm" className="text-xs font-semibold text-muted-foreground">
                    Type <span className="font-mono text-rose-600">{team.slug}</span> to confirm
                  </label>
                  <input
                    id="delete-confirm"
                    value={deleteText}
                    onChange={(event) => setDeleteText(event.target.value)}
                    className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-rose-400"
                  />
                </div>
              )}

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setConfirmLeave(false)
                    setConfirmDelete(false)
                    setDeleteText("")
                  }}
                  className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={confirmDelete && deleteText.trim() !== team.slug}
                  onClick={confirmDelete ? handleDeleteTeam : handleLeaveTeam}
                  className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {confirmDelete ? "Delete team" : "Leave team"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  )
}
