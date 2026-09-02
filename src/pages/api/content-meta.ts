import type { NextApiRequest, NextApiResponse } from 'next';
import { detectLink } from '@/lib/detect-link';

export interface ContentMeta {
  title?: string;
  author?: string;
  thumbnail?: string;
  date?: string;
  views?: string;
  description?: string;
  language?: string;
  stars?: number;
  topics?: string[];
}

const ytViewRegex = /"viewCount":\{"simpleText":"([^"]+)"\}/;
const ytDateRegex = /"publishDate":"([^"]+)"|"uploadDate":"([^"]+)"/;

async function fetchYouTubeMeta(videoId: string): Promise<Partial<ContentMeta>> {
  const meta: Partial<ContentMeta> = {};

  try {
    const oembedRes = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=json`,
      { signal: AbortSignal.timeout(6000) },
    );
    if (oembedRes.ok) {
      const data = (await oembedRes.json()) as { title?: string; author_name?: string; thumbnail_url?: string };
      meta.title = data.title;
      meta.author = data.author_name;
      meta.thumbnail = meta.thumbnail ?? data.thumbnail_url;
    }
  } catch {
    // thumbnail already computed locally; continue with page scrape
  }

  try {
    const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: { 'Accept-Language': 'en' },
      signal: AbortSignal.timeout(6000),
    });
    if (pageRes.ok) {
      const html = await pageRes.text();
      const viewMatch = html.match(ytViewRegex);
      const dateMatch = html.match(ytDateRegex);
      if (viewMatch?.[1]) meta.views = viewMatch[1];
      if (dateMatch) meta.date = (dateMatch[1] ?? dateMatch[2]).slice(0, 10);
    }
  } catch {
    // metadata optional — fail silently
  }

  return meta;
}

async function fetchVimeoMeta(videoId: string): Promise<Partial<ContentMeta>> {
  const meta: Partial<ContentMeta> = {};
  try {
    const res = await fetch(
      `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(`https://vimeo.com/${videoId}`)}`,
      { signal: AbortSignal.timeout(6000) },
    );
    if (res.ok) {
      const data = (await res.json()) as { title?: string; author_name?: string; thumbnail_url?: string };
      meta.title = data.title;
      meta.author = data.author_name;
      meta.thumbnail = data.thumbnail_url;
    }
  } catch {
    // optional
  }
  return meta;
}

async function fetchSpotifyMeta(url: string): Promise<Partial<ContentMeta>> {
  const meta: Partial<ContentMeta> = {};
  try {
    const res = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`, {
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) {
      const data = (await res.json()) as { title?: string; thumbnail_url?: string };
      meta.title = data.title;
      meta.thumbnail = data.thumbnail_url;
    }
  } catch {
    // optional
  }
  return meta;
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)));
}

function extractMetaTag(html: string, property: string): string | null {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, 'i'),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

async function fetchGenericMeta(url: string): Promise<Partial<ContentMeta>> {
  const meta: Partial<ContentMeta> = {};
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36', 'Accept-Language': 'en' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return meta;
    const html = await res.text();

    const title =
      extractMetaTag(html, 'og:title') ?? extractMetaTag(html, 'twitter:title') ?? html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1];
    const image =
      extractMetaTag(html, 'og:image') ??
      extractMetaTag(html, 'twitter:image') ??
      extractMetaTag(html, 'og:image:url') ??
      html.match(/<link[^>]+rel=["']apple-touch-icon["'][^>]+href=["']([^"']+)["']/i)?.[1] ??
      html.match(/<link[^>]+rel=["']icon["'][^>]+href=["']([^"']+)["']/i)?.[1];
    const description =
      extractMetaTag(html, 'og:description') ?? extractMetaTag(html, 'description') ?? extractMetaTag(html, 'twitter:description');
    const date = extractMetaTag(html, 'article:published_time');
    const epochDate = html.match(/"taken_at_timestamp"\s*:\s*(\d{10,11})/i)?.[1];
    const views =
      html.match(/"video_view_count"\s*:\s*"?(\d{1,12})"?/i)?.[1] ??
      html.match(/"viewCount"\s*:\s*"?(\d{1,12})"?/i)?.[1] ??
      html.match(/"play_count"\s*:\s*"?(\d{1,12})"?/i)?.[1] ??
      html.match(/"views_count"\s*:\s*"?(\d{1,12})"?/i)?.[1];

    if (title) meta.title = decodeHtmlEntities(title).trim();
    if (image) {
      const resolved =
        image.startsWith('//')
          ? `https:${image}`
          : image.startsWith('http')
            ? image
            : image.startsWith('/')
              ? new URL(image, url).toString()
              : image;
      meta.thumbnail = decodeHtmlEntities(resolved);
    }
    if (description) meta.description = decodeHtmlEntities(description).trim();
    if (date) meta.date = date.slice(0, 10);
    else if (epochDate) meta.date = new Date(Number(epochDate) * 1000).toISOString().slice(0, 10);
    if (views) {
      const cleanViews = views.replace(/[^\d]/g, '');
      if (cleanViews.length > 0) {
        meta.views = Number(cleanViews).toLocaleString('en-US');
      }
    }
  } catch {
    // optional
  }
  return meta;
}

async function fetchGitHubMeta(repoUrl: string): Promise<Partial<ContentMeta>> {
  const meta: Partial<ContentMeta> = {};
  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/?#]+?)(?:\.git)?(?:\/.*)?$/i);
  if (!match) return meta;
  try {
    const res = await fetch(`https://api.github.com/repos/${match[1]}/${match[2]}`, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'folio-portfolio-builder',
      },
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) {
      const data = (await res.json()) as {
        name?: string;
        description?: string;
        language?: string;
        stargazers_count?: number;
        topics?: string[];
        owner?: { avatar_url?: string };
      };
      if (data.name) meta.title = data.name;
      if (data.description) meta.description = data.description;
      if (data.language) meta.language = data.language;
      if (data.stargazers_count != null) meta.stars = data.stargazers_count;
      if (Array.isArray(data.topics) && data.topics.length > 0) meta.topics = data.topics;
      if (data.owner?.avatar_url) meta.thumbnail = data.owner.avatar_url;
    }
  } catch {
    // optional
  }
  return meta;
}

async function fetchWebsiteMeta(url: string): Promise<Partial<ContentMeta>> {
  const meta = await fetchGenericMeta(url);
  return meta;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const url = String(req.query.url ?? '').trim();
  if (!url) {
    return res.status(400).json({ error: 'No URL provided' });
  }

  const detected = detectLink(url);
  let meta: Partial<ContentMeta> = {};

  if (detected.platform === 'youtube') {
    const videoId = detected.embedUrl?.split('/embed/')[1];
    if (videoId) {
      meta = await fetchYouTubeMeta(videoId);
      if (!meta.thumbnail && detected.thumbnailUrl) {
        meta.thumbnail = detected.thumbnailUrl;
      }
    }
  } else if (detected.platform === 'vimeo') {
    const videoId = url.match(/vimeo\.com\/(\d+)/)?.[1];
    if (videoId) {
      meta = await fetchVimeoMeta(videoId);
    }
  } else if (detected.platform === 'spotify') {
    meta = await fetchSpotifyMeta(url);
  } else if (detected.platform === 'image') {
    meta.thumbnail = detected.thumbnailUrl ?? undefined;
  } else if (/github\.com\//i.test(url)) {
    meta = await fetchGitHubMeta(url);
  } else if (['instagram', 'tiktok', 'twitter', 'soundcloud'].includes(detected.platform)) {
    meta = await fetchGenericMeta(url);
  } else if (detected.platform === 'unknown' || url.startsWith('http')) {
    meta = await fetchWebsiteMeta(url);
  }

  return res.status(200).json({ meta });
}
