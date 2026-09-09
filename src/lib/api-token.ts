export const API_TOKEN_PREFIX = "folio_"

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

export function generateApiToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return `${API_TOKEN_PREFIX}${toHex(bytes)}`
}

export async function hashApiToken(token: string): Promise<string> {
  const data = new TextEncoder().encode(token)
  const digest = await crypto.subtle.digest("SHA-256", data)
  return toHex(new Uint8Array(digest))
}

export function maskApiToken(token: string): string {
  if (token.length <= 12) return token
  return `${token.slice(0, 8)}……${token.slice(-4)}`
}
