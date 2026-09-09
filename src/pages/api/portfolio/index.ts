import type { NextApiRequest, NextApiResponse } from "next"
import { getBearerToken, isApiToken, resolveUserIdFromApiToken, setCorsHeaders, handleCors } from "@/lib/api-server"
import { getServerClient } from "@/lib/server-db"

const SECTION_KEYS = [
  "about",
  "skills",
  "projects",
  "experience",
  "education",
  "certificates",
  "content_channels",
  "content_works",
  "collaborations",
  "creator_tools",
] as const

type SectionKey = (typeof SECTION_KEYS)[number]
type ArraySectionKey = Exclude<SectionKey, "about">

const ARRAY_SECTIONS: readonly ArraySectionKey[] = [
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

const EMPTY: Record<SectionKey, unknown> = {
  about: {},
  skills: [],
  projects: [],
  experience: [],
  education: [],
  certificates: [],
  content_channels: [],
  content_works: [],
  collaborations: [],
  creator_tools: [],
}

interface Operation {
  action: "set" | "add" | "remove" | "update"
  section: string
  data?: unknown
  ids?: string[]
  key?: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (handleCors(req, res)) return
  setCorsHeaders(res)

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

  if (req.method === "GET") {
    const { data } = await client
      .from("portfolio_contents")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle()

    await touchToken(token)

    const sections = { ...EMPTY } as Record<SectionKey, unknown>
    if (data) {
      for (const key of SECTION_KEYS) {
        if (data[key] != null) sections[key] = data[key]
      }
    }

    res.status(200).json({ ok: true, ...sections })
    return
  }

  if (req.method === "POST") {
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
      res.status(400).json({ ok: false, error: "Request body must be a JSON object" })
      return
    }

    const body = req.body as Record<string, unknown>

    // --- NEW: operations array ---
    if (Array.isArray(body.operations)) {
      const ops = body.operations as Operation[]
      if (ops.length === 0) {
        res.status(400).json({ ok: false, error: "operations array is empty" })
        return
      }

      const existing = await client.from("portfolio_contents").select("*").eq("user_id", userId).maybeSingle()
      const current = existing?.data ?? {}

      const payload: Record<string, unknown> = { user_id: userId }
      for (const k of SECTION_KEYS) {
        payload[k] = current[k] ?? EMPTY[k]
      }

      const updatedSections = new Set<string>()

      for (const op of ops) {
        const section = op.section as SectionKey

        if (!(SECTION_KEYS as readonly string[]).includes(section)) {
          res.status(400).json({ ok: false, error: `Unknown section: ${section}` })
          return
        }

        if (op.action === "set") {
          payload[section] = op.data ?? EMPTY[section]
          updatedSections.add(section)
        }

        else if (op.action === "add") {
          if (!ARRAY_SECTIONS.includes(section as ArraySectionKey)) {
            res.status(400).json({ ok: false, error: `"add" only works on array sections (${ARRAY_SECTIONS.join(", ")})` })
            return
          }
          if (!Array.isArray(op.data)) {
            res.status(400).json({ ok: false, error: `"add" requires data to be an array` })
            return
          }
          const existingArr = Array.isArray(payload[section]) ? (payload[section] as unknown[]) : []
          payload[section] = [...existingArr, ...op.data]
          updatedSections.add(section)
        }

        else if (op.action === "remove") {
          if (!ARRAY_SECTIONS.includes(section as ArraySectionKey)) {
            res.status(400).json({ ok: false, error: `"remove" only works on array sections (${ARRAY_SECTIONS.join(", ")})` })
            return
          }
          if (!op.ids || !Array.isArray(op.ids) || op.ids.length === 0) {
            res.status(400).json({ ok: false, error: `"remove" requires ids array` })
            return
          }
          const existingArr = Array.isArray(payload[section]) ? (payload[section] as Record<string, unknown>[]) : []
          payload[section] = existingArr.filter((item) => !op.ids!.includes(String(item.id ?? "")))
          updatedSections.add(section)
        }

        else if (op.action === "update") {
          if (!ARRAY_SECTIONS.includes(section as ArraySectionKey)) {
            res.status(400).json({ ok: false, error: `"update" only works on array sections (${ARRAY_SECTIONS.join(", ")})` })
            return
          }
          if (!op.ids || !op.data || typeof op.data !== "object" || Array.isArray(op.data)) {
            res.status(400).json({ ok: false, error: `"update" requires ids array and data object (partial fields to merge)` })
            return
          }
          const existingArr = Array.isArray(payload[section]) ? (payload[section] as Record<string, unknown>[]) : []
          payload[section] = existingArr.map((item) => {
            if (op.ids!.includes(String(item.id ?? ""))) {
              return { ...item, ...(op.data as Record<string, unknown>) }
            }
            return item
          })
          updatedSections.add(section)
        }
      }

      const { error } = await client.from("portfolio_contents").upsert(payload, { onConflict: "user_id" })
      if (error) {
        res.status(500).json({ ok: false, error: error.message })
        return
      }

      await touchToken(token)

      const saved: Record<string, unknown> = {}
      for (const s of updatedSections) saved[s] = payload[s]

      res.status(200).json({
        ok: true,
        message: `Applied ${ops.length} operation(s) on ${updatedSections.size} section(s)`,
        sections: Array.from(updatedSections),
        data: saved,
      })
      return
    }

    // --- LEGACY: direct section keys (backward compatible) ---
    const unknownKeys = Object.keys(body).filter((k) => !(SECTION_KEYS as readonly string[]).includes(k))
    if (unknownKeys.length > 0) {
      res.status(400).json({
        ok: false,
        error: `Unsupported keys: ${unknownKeys.join(", ")}. Use sections directly or { operations: [...] }`,
      })
      return
    }

    const keys = SECTION_KEYS.filter((k) => body[k] !== undefined)
    if (keys.length === 0) {
      res.status(400).json({ ok: false, error: "No section keys or operations provided" })
      return
    }

    const existing = await client.from("portfolio_contents").select("*").eq("user_id", userId).maybeSingle()

    const payload: Record<string, unknown> = { user_id: userId }
    for (const k of SECTION_KEYS) {
      if (body[k] !== undefined) {
        payload[k] = body[k]
      } else if (existing?.data) {
        payload[k] = existing.data[k] ?? EMPTY[k]
      } else {
        payload[k] = EMPTY[k]
      }
    }

    const { error } = await client.from("portfolio_contents").upsert(payload, { onConflict: "user_id" })
    if (error) {
      res.status(500).json({ ok: false, error: error.message })
      return
    }

    await touchToken(token)

    const saved: Record<string, unknown> = {}
    for (const k of keys) saved[k] = payload[k]

    res.status(200).json({ ok: true, message: `Updated ${keys.length} section(s)`, updated: keys, data: saved })
    return
  }

  res.status(405).json({ ok: false, error: "Method not allowed" })
}

async function touchToken(token: string) {
  const { hashApiToken } = await import("@/lib/api-token")
  const hash = await hashApiToken(token)
  await getServerClient()
    .from("api_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("token_hash", hash)
}
