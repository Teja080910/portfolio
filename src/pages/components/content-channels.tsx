"use client"

import { useStore } from "@/lib/store"
import { motion } from "framer-motion"
import { ExternalLink, PencilLine } from "lucide-react"
import Link from "next/link"
import AnimatedSectionHeader from "../../app/components/animatedsectionheader"

type ContentChannelsProps = {
  isReadOnly?: boolean
}

const platformIcons: Record<string, string> = {
  youtube: "📺",
  instagram: "📸",
  tiktok: "🎵",
  twitter: "🐦",
  blog: "✍️",
  podcast: "🎙️",
  newsletter: "📧",
  other: "🌐",
}

const getPlatformIcon = (platform: string) => {
  const key = Object.entries(platformIcons).find(([k]) =>
    platform?.toLowerCase().includes(k)
  )
  return key ? key[1] : "🌐"
}

export default function ContentChannels({ isReadOnly = false }: ContentChannelsProps) {
  const contentChannelsStore = useStore((state) => state.contentChannels)
  const userId = useStore((state) => state.user.id)
  const username = useStore((state) => state.user.username)
  const editHref = `/u/${encodeURIComponent(username || "me")}/edit-content-channels`
  const channels = contentChannelsStore.filter((item) => item.show && (item.platform || item.handle || item.url))

  if (isReadOnly && channels.length === 0) {
    return null
  }

  const borderColors = [
    "border-primary/30",
    "border-purple-500/30",
    "border-pink-500/30",
    "border-cyan-500/30",
    "border-amber-500/30",
    "border-emerald-500/30",
  ]

  return (
    <section id="content-channels" className="section-shell">
      <div className="orb right-[-10%] top-[-5%] h-[30%] w-[30%] bg-purple-500/5 dark:bg-purple-500/10" />
      <div className="orb left-[-5%] bottom-[-5%] h-[25%] w-[25%] bg-primary/5 dark:bg-primary/10" />

      <div className="surface-grid relative z-10">
        {!isReadOnly && userId && (
          <div className="mb-6 flex justify-end">
            <Link
              href={editHref}
              scroll={false}
              className="inline-flex items-center gap-2 rounded-xl border border-border/50 bg-card/50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:text-primary"
            >
              <PencilLine className="h-3.5 w-3.5" />
              Edit Channels
            </Link>
          </div>
        )}

        <AnimatedSectionHeader title="Content Channels" subtitle="Where you create and share content." />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {channels.length > 0 ? (
            channels.map((channel, index) => {
              const borderColor = borderColors[index % borderColors.length]

              return (
                <motion.div
                  key={channel.id || index}
                  initial={{ opacity: 0, y: 26 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false, amount: 0.35 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className={`glass-card group relative h-full overflow-hidden border ${borderColor}`}>
                    <div className="mb-4 inline-flex rounded-xl border border-border/50 bg-background/50 p-2.5 text-2xl">
                      {getPlatformIcon(channel.platform)}
                    </div>

                    <h3 className="break-words text-base font-bold text-foreground [overflow-wrap:anywhere]">
                      {channel.platform}
                    </h3>

                    {channel.handle && (
                      <p className="mt-1 text-sm font-medium text-primary">
                        {channel.handle}
                      </p>
                    )}

                    {channel.subscriberCount && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {channel.subscriberCount}
                      </p>
                    )}

                    {channel.description && (
                      <p className="mt-3 break-words text-sm leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
                        {channel.description}
                      </p>
                    )}

                    {channel.url && (
                      <div className="mt-4">
                        <a
                          href={channel.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border/50 bg-secondary/50 px-3 py-1.5 text-xs font-medium text-primary transition-all duration-200 hover:border-primary/30 hover:bg-primary/5"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Visit Channel
                        </a>
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })
          ) : (
            <div className="glass-card md:col-span-2 lg:col-span-3 text-center text-muted-foreground">
              No content channels added yet. Use Edit Channels to showcase your platforms.
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
