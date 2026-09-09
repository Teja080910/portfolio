import type { NextApiRequest, NextApiResponse } from "next"
import { getBearerToken, resolveUserFromJwt, setCorsHeaders, handleCors } from "@/lib/api-server"
import { generateApiToken, hashApiToken } from "@/lib/api-token"
import { getServerClient } from "@/lib/server-db"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (handleCors(req, res)) return
  setCorsHeaders(res)

  const jwt = getBearerToken(req)
  const userId = jwt ? await resolveUserFromJwt(jwt) : null

  if (!userId) {
    res.status(401).json({ ok: false, error: "Unauthorized" })
    return
  }

  const client = getServerClient()

  if (req.method === "GET") {
    const { data, error } = await client
      .from("api_tokens")
      .select("id, name, created_at, last_used_at, revoked")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      res.status(500).json({ ok: false, error: error.message })
      return
    }

    res.status(200).json({ ok: true, tokens: data })
    return
  }

  if (req.method === "POST") {
    const name = typeof req.body?.name === "string" ? req.body.name.trim().slice(0, 60) : ""

    const token = generateApiToken()
    const tokenHash = await hashApiToken(token)

    const { data, error } = await client
      .from("api_tokens")
      .insert({ user_id: userId, token_hash: tokenHash, name })
      .select("id, name, created_at")
      .single()

    if (error || !data) {
      res.status(500).json({ ok: false, error: error?.message ?? "Failed to create token" })
      return
    }

    res.status(201).json({ ok: true, token, id: data.id, name: data.name, created_at: data.created_at })
    return
  }

  res.status(405).json({ ok: false, error: "Method not allowed" })
}
