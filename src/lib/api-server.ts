import type { NextApiRequest, NextApiResponse } from "next"
import { supabase } from "./db"
import { getServerClient } from "./server-db"
import { hashApiToken, API_TOKEN_PREFIX } from "./api-token"

export function getBearerToken(req: NextApiRequest): string | null {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith("Bearer ")) return null
  const token = auth.slice(7).trim()
  return token || null
}

export function isApiToken(token: string): boolean {
  return token.startsWith(API_TOKEN_PREFIX)
}

export async function resolveUserFromJwt(jwt: string): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getUser(jwt)
    return data.user?.id ?? null
  } catch {
    return null
  }
}

export async function resolveUserIdFromApiToken(token: string): Promise<string | null> {
  const hash = await hashApiToken(token)
  const { data } = await getServerClient()
    .from("api_tokens")
    .select("user_id")
    .eq("token_hash", hash)
    .eq("revoked", false)
    .maybeSingle()

  if (!data) return null

  return data.user_id
}

export function setCorsHeaders(res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")
}

export function handleCors(req: NextApiRequest, res: NextApiResponse): boolean {
  if (req.method === "OPTIONS") {
    setCorsHeaders(res)
    res.status(204).end()
    return true
  }
  return false
}
