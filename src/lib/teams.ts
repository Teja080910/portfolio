import { supabase } from "@/lib/db"
import {
  ITeam,
  ITeamInvite,
  ITeamInviteRecord,
  ITeamMember,
  ITeamPortfolio,
  TeamRole,
  TeamSectionKey,
} from "@/lib/interfaces"

export const TEAM_INVITE_PREFIX = "team_"

export const TEAM_SECTION_KEYS: TeamSectionKey[] = [
  "skills",
  "projects",
  "experience",
  "education",
  "certificates",
  "content_channels",
  "content_works",
  "collaborations",
  "creator_tools",
]

export const TEAM_SECTION_LABELS: Record<TeamSectionKey, string> = {
  skills: "Skills",
  projects: "Projects",
  experience: "Experience",
  education: "Education",
  certificates: "Certificates",
  content_channels: "Content Channels",
  content_works: "Content Portfolio",
  collaborations: "Collaborations",
  creator_tools: "Creator Tools",
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

export function generateTeamInviteToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return `${TEAM_INVITE_PREFIX}${toHex(bytes)}`
}

export async function hashTeamInviteToken(token: string): Promise<string> {
  const data = new TextEncoder().encode(token)
  const digest = await crypto.subtle.digest("SHA-256", data)
  return toHex(new Uint8Array(digest))
}

export const TEAM_SLUG_PATTERN = /^[a-z0-9][a-z0-9-_]{1,31}$/

export const TEAM_SLUG_ERROR =
  "Team URL must be 2-32 characters, start with a letter or number, and use only letters, numbers, hyphens or underscores."

export const isValidTeamSlug = (value: string) => TEAM_SLUG_PATTERN.test(value.trim().toLowerCase())

export function slugifyTeamName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32)
}

/**
 * Turns anything a user types, pastes, or the browser autofills into a valid slug.
 * e.g. "https://arkasodhara.tech/" -> "arkasodhara-tech", "My Team!" -> "my-team"
 */
export function sanitizeTeamSlugInput(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/[?#].*$/, "")
    .replace(/\/.*$/, "")
    .replace(/\./g, "-")
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^[-_]+/, "")
    .slice(0, 32)
}

/** Final slug used for storage/lookup: sanitized with no trailing separators. */
export function normalizeTeamSlug(value: string): string {
  return sanitizeTeamSlugInput(value).replace(/[-_]+$/, "")
}

export const getCurrentUserId = async (): Promise<string | null> => {
  const { data } = await supabase.auth.getUser()
  return data.user?.id ?? null
}

// ---------------------------------------------------------------------------
// Teams
// ---------------------------------------------------------------------------

export const getMyTeams = async (): Promise<{ team: ITeam; role: TeamRole }[]> => {
  const userId = await getCurrentUserId()
  if (!userId) return []

  const { data, error } = await supabase
    .from("folio_team_members")
    .select("role, team:folio_teams(*)")
    .eq("user_id", userId)
    .order("joined_at", { ascending: true })

  if (error || !data) {
    if (error) console.error("[teams] getMyTeams:", error.message)
    return []
  }

  return data
    .map((row) => ({
      role: row.role as TeamRole,
      team: (Array.isArray(row.team) ? row.team[0] : row.team) as ITeam | null,
    }))
    .filter((entry): entry is { role: TeamRole; team: ITeam } => Boolean(entry.team))
}

export const getTeamBySlug = async (slug: string): Promise<ITeam | null> => {
  const { data, error } = await supabase
    .from("folio_teams")
    .select("*")
    .eq("slug", slug.trim().toLowerCase())
    .maybeSingle()

  if (error) {
    console.error("[teams] getTeamBySlug:", error.message)
    return null
  }

  return (data as ITeam) ?? null
}

export const getTeamMembership = async (teamId: string): Promise<{ role: TeamRole } | null> => {
  const userId = await getCurrentUserId()
  if (!userId) return null

  const { data, error } = await supabase
    .from("folio_team_members")
    .select("role")
    .eq("team_id", teamId)
    .eq("user_id", userId)
    .maybeSingle()

  if (error || !data) return null
  return { role: data.role as TeamRole }
}

export const isTeamSlugAvailable = async (slug: string): Promise<boolean> => {
  const normalized = normalizeTeamSlug(slug)

  if (!isValidTeamSlug(normalized)) return false

  const { data, error } = await supabase
    .from("folio_teams")
    .select("id")
    .eq("slug", normalized)
    .maybeSingle()

  if (error) return false
  return !data
}

export const createTeam = async (payload: {
  name: string
  slug: string
  tagline?: string
  description?: string
  logo?: string
}): Promise<{ team: ITeam | null; error: string | null }> => {
  const userId = await getCurrentUserId()
  if (!userId) return { team: null, error: "You need to be signed in to create a team." }

  const slug = normalizeTeamSlug(payload.slug)

  if (!isValidTeamSlug(slug)) {
    return { team: null, error: TEAM_SLUG_ERROR }
  }

  const { data, error } = await supabase
    .from("folio_teams")
    .insert({
      owner_id: userId,
      name: payload.name.trim(),
      slug,
      tagline: payload.tagline?.trim() || null,
      description: payload.description?.trim() || null,
      logo: payload.logo || null,
      show: true,
    })
    .select("*")
    .single()

  if (error) {
    if (error.code === "23505") {
      return { team: null, error: "That slug is already taken. Try another one." }
    }
    return { team: null, error: error.message }
  }

  return { team: data as ITeam, error: null }
}

export const updateTeam = async (
  teamId: string,
  patch: Partial<Pick<ITeam, "name" | "tagline" | "description" | "logo" | "show">>,
): Promise<{ error: string | null }> => {
  const { error } = await supabase
    .from("folio_teams")
    .update({
      ...patch,
      tagline: patch.tagline?.trim() || null,
      description: patch.description?.trim() || null,
    })
    .eq("id", teamId)

  return { error: error?.message ?? null }
}

export const deleteTeam = async (teamId: string): Promise<{ error: string | null }> => {
  const { error } = await supabase.from("folio_teams").delete().eq("id", teamId)
  return { error: error?.message ?? null }
}

export const uploadTeamLogo = async (userId: string, file: File): Promise<string | null> => {
  const ext = file.name.split(".").pop() || "png"
  const path = `${userId}/team-${Date.now()}.${ext}`
  const { error } = await supabase.storage
    .from("profile-photos")
    .upload(path, file, { upsert: true, cacheControl: "3600" })

  if (error) {
    console.error("[teams] uploadTeamLogo:", error.message)
    return null
  }

  const { data } = supabase.storage.from("profile-photos").getPublicUrl(path)
  return data?.publicUrl || null
}

// ---------------------------------------------------------------------------
// Members
// ---------------------------------------------------------------------------

export const getTeamMembers = async (teamId: string): Promise<ITeamMember[]> => {
  const { data, error } = await supabase.rpc("folio_get_team_members", { p_team_id: teamId })
  if (error) {
    console.error("[teams] getTeamMembers:", error.message)
    return []
  }
  return (data as ITeamMember[]) ?? []
}

export const leaveTeam = async (teamId: string): Promise<{ error: string | null }> => {
  const userId = await getCurrentUserId()
  if (!userId) return { error: "Not signed in." }

  const { error } = await supabase
    .from("folio_team_members")
    .delete()
    .eq("team_id", teamId)
    .eq("user_id", userId)

  return { error: error?.message ?? null }
}

export const removeTeamMember = async (teamId: string, userId: string): Promise<{ error: string | null }> => {
  const { error } = await supabase
    .from("folio_team_members")
    .delete()
    .eq("team_id", teamId)
    .eq("user_id", userId)

  return { error: error?.message ?? null }
}

// ---------------------------------------------------------------------------
// Invites
// ---------------------------------------------------------------------------

export const createTeamInvite = async (payload: {
  teamId: string
  email?: string | null
  expiresInDays?: number
}): Promise<{ token: string | null; invite: ITeamInviteRecord | null; error: string | null }> => {
  const userId = await getCurrentUserId()
  if (!userId) return { token: null, invite: null, error: "You need to be signed in." }

  const token = generateTeamInviteToken()
  const tokenHash = await hashTeamInviteToken(token)
  const days = payload.expiresInDays ?? (payload.email ? 7 : 30)
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from("folio_team_invites")
    .insert({
      team_id: payload.teamId,
      email: payload.email?.trim().toLowerCase() || null,
      token_hash: tokenHash,
      invited_by: userId,
      expires_at: expiresAt,
    })
    .select("*")
    .single()

  if (error || !data) {
    return { token: null, invite: null, error: error?.message ?? "Failed to create invite." }
  }

  return { token, invite: data as ITeamInviteRecord, error: null }
}

export const getTeamInvites = async (teamId: string): Promise<ITeamInviteRecord[]> => {
  const { data, error } = await supabase
    .from("folio_team_invites")
    .select("*")
    .eq("team_id", teamId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[teams] getTeamInvites:", error.message)
    return []
  }

  return (data as ITeamInviteRecord[]) ?? []
}

export const revokeTeamInvite = async (inviteId: string): Promise<{ error: string | null }> => {
  const { error } = await supabase
    .from("folio_team_invites")
    .update({ revoked: true })
    .eq("id", inviteId)

  return { error: error?.message ?? null }
}

export const deleteTeamInvite = async (inviteId: string): Promise<{ error: string | null }> => {
  const { error } = await supabase.from("folio_team_invites").delete().eq("id", inviteId)
  return { error: error?.message ?? null }
}

export const sendTeamInviteEmail = async (token: string): Promise<{ ok: boolean; error: string | null }> => {
  const { data } = await supabase.auth.getSession()
  const accessToken = data.session?.access_token

  if (!accessToken) return { ok: false, error: "Not signed in." }

  const response = await fetch("/api/team-invite", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ token }),
  })

  const payload = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null

  if (!response.ok || !payload?.ok) {
    return { ok: false, error: payload?.error ?? "Failed to send invite email." }
  }

  return { ok: true, error: null }
}

export const getTeamInviteByToken = async (token: string): Promise<ITeamInvite | null> => {
  const { data, error } = await supabase.rpc("folio_get_team_invite", { p_token: token })
  if (error) {
    console.error("[teams] getTeamInviteByToken:", error.message)
    return null
  }
  return (data as ITeamInvite) ?? null
}

export const acceptTeamInvite = async (token: string): Promise<{ slug: string | null; error: string | null }> => {
  const { data, error } = await supabase.rpc("folio_accept_team_invite", { p_token: token })

  if (error) {
    return { slug: null, error: error.message }
  }

  const payload = data as { slug?: string } | null
  return { slug: payload?.slug ?? null, error: null }
}

export const getMyPendingInvites = async (): Promise<ITeamInvite[]> => {
  const { data, error } = await supabase.rpc("folio_get_my_pending_invites")
  if (error) {
    console.error("[teams] getMyPendingInvites:", error.message)
    return []
  }
  return (data as ITeamInvite[]) ?? []
}

// ---------------------------------------------------------------------------
// Public team portfolio + directory
// ---------------------------------------------------------------------------

export const getTeamPortfolio = async (slug: string): Promise<ITeamPortfolio | null> => {
  const { data, error } = await supabase.rpc("folio_get_team_portfolio", { p_slug: slug })
  if (error) {
    console.error("[teams] getTeamPortfolio:", error.message)
    return null
  }
  return (data as ITeamPortfolio) ?? null
}

export const getPublicTeams = async (): Promise<ITeam[]> => {
  const { data, error } = await supabase.rpc("folio_get_public_teams")
  if (error) {
    console.error("[teams] getPublicTeams:", error.message)
    return []
  }
  return (data as ITeam[]) ?? []
}

// ---------------------------------------------------------------------------
// Content shares
// ---------------------------------------------------------------------------

export const getMyShares = async (teamId: string): Promise<Set<string>> => {
  const userId = await getCurrentUserId()
  if (!userId) return new Set()

  const { data, error } = await supabase
    .from("folio_team_content_shares")
    .select("section, item_id")
    .eq("team_id", teamId)
    .eq("user_id", userId)

  if (error || !data) {
    if (error) console.error("[teams] getMyShares:", error.message)
    return new Set()
  }

  return new Set(data.map((row) => `${row.section}:${row.item_id}`))
}

export const shareItems = async (
  teamId: string,
  userId: string,
  entries: { section: TeamSectionKey; itemId: string }[],
): Promise<{ error: string | null }> => {
  if (entries.length === 0) return { error: null }

  const { error } = await supabase.from("folio_team_content_shares").upsert(
    entries.map((entry) => ({
      team_id: teamId,
      user_id: userId,
      section: entry.section,
      item_id: entry.itemId,
    })),
    { onConflict: "team_id,user_id,section,item_id" },
  )

  return { error: error?.message ?? null }
}

export const unshareItem = async (
  teamId: string,
  userId: string,
  section: TeamSectionKey,
  itemId: string,
): Promise<{ error: string | null }> => {
  const { error } = await supabase
    .from("folio_team_content_shares")
    .delete()
    .eq("team_id", teamId)
    .eq("user_id", userId)
    .eq("section", section)
    .eq("item_id", itemId)

  return { error: error?.message ?? null }
}

export const unshareSectionItems = async (
  teamId: string,
  userId: string,
  section: TeamSectionKey,
  itemIds: string[],
): Promise<{ error: string | null }> => {
  if (itemIds.length === 0) return { error: null }

  const { error } = await supabase
    .from("folio_team_content_shares")
    .delete()
    .eq("team_id", teamId)
    .eq("user_id", userId)
    .eq("section", section)
    .in("item_id", itemIds)

  return { error: error?.message ?? null }
}
