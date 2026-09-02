import type { NextConfig } from "next";

const remotePatterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [
  {
    protocol: "https",
    hostname: "hebbkx1anhila5yf.public.blob.vercel-storage.com",
  },
  {
    protocol: "https",
    hostname: "lh3.googleusercontent.com",
  },
  {
    protocol: "https",
    hostname: "avatars.githubusercontent.com",
  },
  {
    protocol: "https",
    hostname: "db.portfoli.store",
    pathname: "/storage/v1/object/public/**",
  },
  {
    protocol: "http",
    hostname: "localhost",
    port: "54400",
    pathname: "/storage/v1/object/public/**",
  },
  {
    protocol: "https",
    hostname: "api.dicebear.com",
  },
]

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

if (supabaseUrl) {
  const { protocol, hostname } = new URL(supabaseUrl)

  remotePatterns.push({
    protocol: protocol.replace(":", "") as "http" | "https",
    hostname,
    pathname: "/storage/v1/object/public/**",
  })
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  images: {
    remotePatterns,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
