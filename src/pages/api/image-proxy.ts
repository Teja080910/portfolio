import type { NextApiRequest, NextApiResponse } from "next"

/**
 * Proxies external images (e.g. Google profile photos) through the same origin
 * to bypass browser tracking protection (Firefox ETP, etc.).
 *
 * Usage: /api/image-proxy?url=https://lh3.googleusercontent.com/...
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const url = req.query.url as string | undefined

  if (!url) {
    return res.status(400).json({ error: "Missing 'url' query parameter" })
  }

  // Only allow specific image hosts
  const allowedHosts = [
    "lh3.googleusercontent.com",
    "avatars.githubusercontent.com",
    "hebbkx1anhila5yf.public.blob.vercel-storage.com",
  ]

  try {
    const parsed = new URL(url)
    if (!allowedHosts.includes(parsed.hostname)) {
      return res.status(403).json({ error: "Domain not allowed" })
    }
  } catch {
    return res.status(400).json({ error: "Invalid URL" })
  }

  try {
    const response = await fetch(url, {
      headers: {
        // No referrer so the upstream server doesn't block us
        "Referer": "",
        "User-Agent": "Portfolio-App/1.0",
      },
    })

    if (!response.ok) {
      return res.status(response.status).json({ error: "Failed to fetch image" })
    }

    // Forward the content type
    const contentType = response.headers.get("content-type") || "image/jpeg"
    res.setHeader("Content-Type", contentType)

    // Cache for 24 hours on the client
    res.setHeader("Cache-Control", "public, max-age=86400, immutable")

    // Stream the image data
    const buffer = await response.arrayBuffer()
    res.status(200).send(Buffer.from(buffer))
  } catch (error) {
    console.error("Image proxy error:", error)
    return res.status(500).json({ error: "Failed to proxy image" })
  }
}
