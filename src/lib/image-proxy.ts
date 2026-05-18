/**
 * Enhance photo URL to request a high-resolution version from the provider.
 */
function enhancePhotoUrl(url: string): string {
  let enhanced = url
  if (enhanced.includes("googleusercontent.com")) {
    if (enhanced.match(/=s\d+-c/)) {
      enhanced = enhanced.replace(/=s\d+-c/g, "=s800-c")
    } else if (!enhanced.includes("=")) {
      enhanced += "=s800-c"
    }
  } else if (enhanced.includes("avatars.githubusercontent.com")) {
    if (!enhanced.includes("s=")) {
      enhanced = enhanced.includes("?") ? `${enhanced}&s=800` : `${enhanced}?s=800`
    }
  }
  return enhanced
}

/**
 * Returns the direct high-resolution image URL from the provider.
 * Uses referrerPolicy="no-referrer" on the Image component instead of proxying,
 * so the image loads directly from the CDN without a server round trip.
 */
export function getProxiedImageUrl(url: string | undefined | null): string | undefined {
  if (!url) return undefined
  return enhancePhotoUrl(url) || undefined
}
