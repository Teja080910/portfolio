const ALLOWED_HOSTS = [
  "lh3.googleusercontent.com",
  "avatars.githubusercontent.com",
  "hebbkx1anhila5yf.public.blob.vercel-storage.com",
]

/**
 * Returns a proxied URL for external images to bypass browser tracking protection.
 * Local/Supabase images are returned as-is.
 */
export function getProxiedImageUrl(url: string | undefined | null): string | undefined {
  if (!url) return undefined

  try {
    const parsed = new URL(url)
    if (ALLOWED_HOSTS.includes(parsed.hostname)) {
      return `/api/image-proxy?url=${encodeURIComponent(url)}`
    }
    // Already local — return as-is
    return url
  } catch {
    // Invalid URL — return as-is
    return url
  }
}
