import { TeamRole } from "./interfaces"

export interface TeamApiMember {
  id: string
  username: string
  name: string
  photo: string | null
  role: TeamRole
  title: string | null
  jobRole: string | null
  type: string
  profileUrl: string | null
}

export interface TeamApiPayload {
  id: string
  slug: string
  name: string
  tagline: string | null
  description: string | null
  logo: string | null
  portfolioUrl: string
  memberCount: number
  projectsCount: number
  members: TeamApiMember[]
}

export type TeamApiTeamRow = {
  id: string
  slug: string
  name: string
  tagline?: string | null
  description?: string | null
  logo?: string | null
}

export type TeamApiMembershipRow = {
  user_id: string
  role: string
  title?: string | null
  joined_at?: string
}

export type TeamApiProfileRow = {
  id: string
  username: string | null
  firstname: string | null
  lastname: string | null
  photo: string | null
  role: string | null
  type: string | null
  show: boolean | null
}

export type TeamApiShareRow = {
  user_id: string
  item_id: string
}

export type TeamApiContentRow = {
  user_id: string
  projects: unknown
}

export const normalizeOrigin = (origin: string) => origin.replace(/\/+$/, "")

export const countSharedVisibleProjects = (shares: TeamApiShareRow[], contents: TeamApiContentRow[]): number => {
  const visibleByUser = new Map<string, Set<string>>()

  for (const row of contents) {
    const ids = new Set<string>()

    if (Array.isArray(row.projects)) {
      for (const item of row.projects) {
        if (!item || typeof item !== "object") continue
        const record = item as Record<string, unknown>
        if (record.show === false) continue
        const id = typeof record.id === "string" ? record.id : ""
        if (id) ids.add(id)
      }
    }

    visibleByUser.set(row.user_id, ids)
  }

  return shares.filter((share) => visibleByUser.get(share.user_id)?.has(share.item_id)).length
}

export const buildTeamApiPayload = (input: {
  team: TeamApiTeamRow
  memberships: TeamApiMembershipRow[]
  profiles: TeamApiProfileRow[]
  shares: TeamApiShareRow[]
  contents: TeamApiContentRow[]
  origin: string
}): TeamApiPayload => {
  const origin = normalizeOrigin(input.origin)
  const profileById = new Map(input.profiles.map((profile) => [profile.id, profile]))

  const members = input.memberships
    .map((membership) => {
      const profile = profileById.get(membership.user_id)
      if (!profile) return null

      const name =
        [profile.firstname, profile.lastname].filter(Boolean).join(" ").trim() || profile.username || ""

      const type = profile.type || "user"
      const isPublic = profile.show !== false
      const username = profile.username || ""

      const profileUrl =
        isPublic && username
          ? type === "business"
            ? `${origin}/b/${encodeURIComponent(username)}`
            : `${origin}/u/${encodeURIComponent(username)}`
          : null

      return {
        id: profile.id,
        username,
        name,
        photo: profile.photo || null,
        role: (membership.role === "owner" ? "owner" : "member") as TeamRole,
        title: membership.title || null,
        jobRole: profile.role || null,
        type,
        profileUrl,
      }
    })
    .filter((member): member is TeamApiMember => Boolean(member))
    .sort((a, b) => {
      if (a.role !== b.role) return a.role === "owner" ? -1 : 1
      return a.name.localeCompare(b.name)
    })

  return {
    id: input.team.id,
    slug: input.team.slug,
    name: input.team.name,
    tagline: input.team.tagline ?? null,
    description: input.team.description ?? null,
    logo: input.team.logo ?? null,
    portfolioUrl: `${origin}/t/${encodeURIComponent(input.team.slug)}`,
    memberCount: members.length,
    projectsCount: countSharedVisibleProjects(input.shares, input.contents),
    members,
  }
}
