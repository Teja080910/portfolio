import type { NextApiRequest, NextApiResponse } from "next"
import { getBearerToken, resolveUserFromJwt, setCorsHeaders, handleCors } from "@/lib/api-server"
import { getServerClient } from "@/lib/server-db"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (handleCors(req, res)) return
  setCorsHeaders(res)

  if (req.method !== "DELETE") {
    res.status(405).json({ ok: false, error: "Method not allowed" })
    return
  }

  const jwt = getBearerToken(req)
  const userId = jwt ? await resolveUserFromJwt(jwt) : null

  if (!userId) {
    res.status(401).json({ ok: false, error: "Unauthorized" })
    return
  }

  const id = req.query.id as string | undefined
  if (!id) {
    res.status(400).json({ ok: false, error: "Missing token id" })
    return
  }

  const client = getServerClient()
  const { error } = await client.from("api_tokens").delete().eq("id", id).eq("user_id", userId)

  if (error) {
    res.status(500).json({ ok: false, error: error.message })
    return
  }

  res.status(200).json({ ok: true })
}
