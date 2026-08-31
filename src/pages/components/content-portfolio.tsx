"use client"

import { useStore } from "@/lib/store"
import { motion } from "framer-motion"
import { Calendar, Eye, ExternalLink, PencilLine } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import AnimatedSectionHeader from "../../app/components/animatedsectionheader"

type ContentPortfolioProps = {
  isReadOnly?: boolean
}

const contentTypeIcons: Record<string, string> = {
  video: "🎬",
  article: "📝",
  photo: "📷",
  podcast: "🎙️",
  reel: "🎞️",
  short: "⚡",
  other: "📄",
}

const getContentTypeIcon = (type: string) => {
  const key = Object.entries(contentTypeIcons).find(([k]) =>
    type?.toLowerCase().includes(k)
  )
  return key ? key[1] : "📄"
}

export default function ContentPortfolio({ isReadOnly = false }: ContentPortfolioProps) {
  const contentWorksStore = useStore((state) => state.contentWorks)
  const userId = useStore((state) => state.user.id)
  const username = useStore((state) => state.user.username)
  const editHref = `/u/${encodeURIComponent(username || "me")}/edit-content-portfolio`
  const works = contentWorksStore
    .filter((item) => item.show && (item.title || item.url || item.description))
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))

  if (isReadOnly && works.length === 0) {
    return null
  }

  return (
    <section id="content-portfolio" className="section-shell">
      <div className="orb left-[-10%] top-[-5%] h-[30%] w-[30%] bg-pink-500/5 dark:bg-pink-500/10" />
      <div className="orb right-[-5%] bottom-[-5%] h-[25%] w-[25%] bg-primary/5 dark:bg-primary/10" />

      <div className="surface-grid relative z-10">
        {!isReadOnly && userId && (
          <div className="mb-6 flex justify-end">
            <Link
              href={editHref}
              scroll={false}
              className="inline-flex items-center gap-2 rounded-xl border border-border/50 bg-card/50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:text-primary"
            >
              <PencilLine className="h-3.5 w-3.5" />
              Edit Content
            </Link>
          </div>
        )}

        <AnimatedSectionHeader title="Content Portfolio" subtitle="A showcase of my best content and creative work." />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {works.length > 0 ? (
            works.map((work, index) => (
              <motion.div
                key={work.id || index}
                initial={{ opacity: 0, y: 26 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.35 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="glass-card group relative h-full overflow-hidden">
                  {work.thumbnail && (
                    <div className="relative mb-4 h-40 w-full overflow-hidden rounded-xl">
                      <Image
                        src={work.thumbnail}
                        alt={work.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  )}

                  {!work.thumbnail && (
                    <div className="mb-4 inline-flex rounded-xl border border-border/50 bg-background/50 p-2.5 text-2xl">
                      {getContentTypeIcon(work.type)}
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-2">
                    <h3 className="break-words text-base font-bold text-foreground [overflow-wrap:anywhere]">
                      {work.title}
                    </h3>
                    <span className="shrink-0 text-lg">{getContentTypeIcon(work.type)}</span>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {work.date && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {work.date}
                      </span>
                    )}
                    {work.views && (
                      <span className="inline-flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" />
                        {work.views}
                      </span>
                    )}
                  </div>

                  {work.description && (
                    <p className="mt-3 break-words text-sm leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
                      {work.description}
                    </p>
                  )}

                  {work.url && (
                    <div className="mt-4">
                      <a
                        href={work.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border/50 bg-secondary/50 px-3 py-1.5 text-xs font-medium text-primary transition-all duration-200 hover:border-primary/30 hover:bg-primary/5"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        View Content
                      </a>
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          ) : (
            <div className="glass-card md:col-span-2 lg:col-span-3 text-center text-muted-foreground">
              No content works added yet. Use Edit Content to showcase your portfolio.
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
