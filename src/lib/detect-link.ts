export type LinkPlatform = "youtube" | "vimeo" | "twitter" | "instagram" | "tiktok" | "spotify" | "soundcloud" | "figma" | "image" | "unknown"

export interface DetectedLink {
  platform: LinkPlatform
  embedUrl: string | null
  thumbnailUrl: string | null
  displayType: string
}

const youtubeRegex = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
const vimeoRegex = /vimeo\.com\/(\d+)/
const twitterRegex = /(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/
const instagramRegex = /instagram\.com\/(?:p|reel|tv)\/([a-zA-Z0-9_-]+)/
const tiktokRegex = /tiktok\.com\/@[\w.]+\/video\/(\d+)/
const spotifyRegex = /open\.spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/
const soundcloudRegex = /soundcloud\.com\/[\w.-]+\/[\w.-]+/
const figmaRegex = /figma\.com\/(file|proto)\/[^/]+/
const imageUrlRegex = /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i

export function detectLink(url: string): DetectedLink {
  const trimmed = url.trim()

  const ytMatch = trimmed.match(youtubeRegex)
  if (ytMatch) {
    const videoId = ytMatch[1]
    return {
      platform: "youtube",
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      displayType: "video",
    }
  }

  const vimeoMatch = trimmed.match(vimeoRegex)
  if (vimeoMatch) {
    return {
      platform: "vimeo",
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
      thumbnailUrl: null,
      displayType: "video",
    }
  }

  const twMatch = trimmed.match(twitterRegex)
  if (twMatch) {
    return {
      platform: "twitter",
      embedUrl: null,
      thumbnailUrl: null,
      displayType: "post",
    }
  }

  const igMatch = trimmed.match(instagramRegex)
  if (igMatch) {
    return {
      platform: "instagram",
      embedUrl: null,
      thumbnailUrl: null,
      displayType: "post",
    }
  }

  const ttMatch = trimmed.match(tiktokRegex)
  if (ttMatch) {
    return {
      platform: "tiktok",
      embedUrl: null,
      thumbnailUrl: null,
      displayType: "short",
    }
  }

  const spMatch = trimmed.match(spotifyRegex)
  if (spMatch) {
    return {
      platform: "spotify",
      embedUrl: `https://open.spotify.com/embed/${spMatch[1]}/${spMatch[2]}?theme=0`,
      thumbnailUrl: null,
      displayType: "podcast",
    }
  }

  if (soundcloudRegex.test(trimmed)) {
    return {
      platform: "soundcloud",
      embedUrl: null,
      thumbnailUrl: null,
      displayType: "podcast",
    }
  }

  if (figmaRegex.test(trimmed)) {
    return {
      platform: "figma",
      embedUrl: trimmed,
      thumbnailUrl: null,
      displayType: "design",
    }
  }

  if (imageUrlRegex.test(trimmed)) {
    return {
      platform: "image",
      embedUrl: null,
      thumbnailUrl: trimmed,
      displayType: "photo",
    }
  }

  return {
    platform: "unknown",
    embedUrl: null,
    thumbnailUrl: null,
    displayType: "other",
  }
}

export function getPlatformLabel(platform: LinkPlatform): string {
  const labels: Record<LinkPlatform, string> = {
    youtube: "YouTube",
    vimeo: "Vimeo",
    twitter: "Twitter / X",
    instagram: "Instagram",
    tiktok: "TikTok",
    spotify: "Spotify",
    soundcloud: "SoundCloud",
    figma: "Figma",
    image: "Image",
    unknown: "Link",
  }
  return labels[platform]
}

export function getPlatformColor(platform: LinkPlatform): string {
  const colors: Record<LinkPlatform, string> = {
    youtube: "#FF0000",
    vimeo: "#1AB7EA",
    twitter: "#1DA1F2",
    instagram: "#E4405F",
    tiktok: "#000000",
    spotify: "#1DB954",
    soundcloud: "#FF5500",
    figma: "#A259FF",
    image: "#6B7280",
    unknown: "#6B7280",
  }
  return colors[platform]
}
