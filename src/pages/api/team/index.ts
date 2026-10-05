import type { NextApiRequest, NextApiResponse } from "next"
import { getBearerToken, isApiToken, resolveUserIdFromApiToken, setCorsHeaders, handleCors } from "@/lib/api-server"
import { getServerClient } from "@/lib/server-db"
import {
  buildTeamApiPayload,
  normalizeOrigin,
  TeamApiContentRow,
  TeamApiMembershipRow,
  TeamApiProfileRow,
  TeamApiShareRow,
  TeamApiTeamRow,
} from "@/lib/team-api"

const PROFILE_COLUMNS = "id, username, firstname, lastname, photo, role, type, show"

function getOrigin(req: NextApiRequest): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL
  if (configured) return normalizeOrigin(configured)

  const proto = (req.headers["x-forwarded-proto"] as string | undefined)?.split(",")[0]?.trim() || "http"
  const host = (req.headers["x-forwarded-host"] as string | undefined) || req.headers.host || "localhost:3001"

  return normalizeOrigin(`${proto}://${host}`)
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (handleCors(req, res)) return
  setCorsHeaders(res)

  if (req.method !== "GET") {
    res.status(405).json({ ok: false, error: "Method not allowed" })
    return
  }

  const token = getBearerToken(req)
  if (!token || !isApiToken(token)) {
    res.status(401).json({ ok: false, error: "Missing or invalid API token" })
    return
  }

  const userId = await resolveUserIdFromApiToken(token)
  if (!userId) {
    res.status(401).json({ ok: false, error: "Invalid or revoked API token" })
    return
  }

  const client = getServerClient()
  const origin = getOrigin(req)
  const slug = typeof req.query.slug === "string" ? req.query.slug.trim().toLowerCase() : ""

  const { data: memberships } = await client
    .from("folio_team_members")
    .select("team_id, role")
    .eq("user_id", userId)

  const teamIds = (memberships ?? []).map((membership) => membership.team_id)

  const buildPayload = async (team: TeamApiTeamRow) => {
    const [{ data: memberRows }, { data: shareRows }] = await Promise.all([
      client.from("folio_team_members").select("user_id, role, title, joined_at").eq("team_id", team.id),
      client
        .from("folio_team_content_shares")
        .select("user_id, item_id")
        .eq("team_id", team.id)
        .eq("section", "projects"),
    ])

    const memberIds = (memberRows ?? []).map((row) => row.user_id)

    const [{ data: profiles }, { data: contents }] = await Promise.all([
      memberIds.length > 0
        ? client.from("profiles").select(PROFILE_COLUMNS).in("id", memberIds)
        : Promise.resolve({ data: [] as TeamApiProfileRow[] }),
      memberIds.length > 0
        ? client.from("portfolio_contents").select("user_id, projects").in("user_id", memberIds)
        : Promise.resolve({ data: [] as TeamApiContentRow[] }),
    ])

    return buildTeamApiPayload({
      team,
      memberships: (memberRows ?? []) as TeamApiMembershipRow[],
      profiles: (profiles ?? []) as TeamApiProfileRow[],
      shares: (shareRows ?? []) as TeamApiShareRow[],
      contents: (contents ?? []) as TeamApiContentRow[],
      origin,
    })
  }

  if (slug) {
    const { data: team } = await client.from("folio_teams").select("*").eq("slug", slug).maybeSingle()

    if (!team) {
      res.status(404).json({ ok: false, error: "Team not found" })
      return
    }

    if (!teamIds.includes(team.id)) {
      res.status(403).json({ ok: false, error: "This API token does not have access to that team" })
      return
    }

    const payload = await buildPayload(team as TeamApiTeamRow)
    await touchToken(token)

    res.status(200).json({ ok: true, team: payload })
    return
  }

  if (teamIds.length === 0) {
    await touchToken(token)
    res.status(200).json({ ok: true, teams: [] })
    return
  }

  const { data: teams } = await client
    .from("folio_teams")
    .select("*")
    .in("id", teamIds)
    .order("created_at", { ascending: true })

  const payloads = await Promise.all(((teams ?? []) as TeamApiTeamRow[]).map(buildPayload))
  await touchToken(token)

  res.status(200).json({ ok: true, teams: payloads })
}

async function touchToken(token: string) {
  const { hashApiToken } = await import("@/lib/api-token")
  const hash = await hashApiToken(token)
  await getServerClient()
    .from("api_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("token_hash", hash)
}
