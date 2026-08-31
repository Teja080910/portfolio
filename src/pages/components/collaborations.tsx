"use client"

import { useStore } from "@/lib/store"
import { motion } from "framer-motion"
import { Calendar, ExternalLink, Handshake, PencilLine } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import AnimatedSectionHeader from "../../app/components/animatedsectionheader"

type CollaborationsProps = {
  isReadOnly?: boolean
}

const borderColors = [
  "border-primary/30",
  "border-purple-500/30",
  "border-pink-500/30",
  "border-cyan-500/30",
  "border-amber-500/30",
  "border-emerald-500/30",
]

export default function Collaborations({ isReadOnly = false }: CollaborationsProps) {
  const collaborationsStore = useStore((state) => state.collaborations)
  const userId = useStore((state) => state.user.id)
  const username = useStore((state) => state.user.username)
  const editHref = `/u/${encodeURIComponent(username || "me")}/edit-collaborations`
  const collaborations = collaborationsStore.filter((item) => item.show && (item.brand || item.description || item.url))

  if (isReadOnly && collaborations.length === 0) {
    return null
  }

  return (
    <section id="collaborations" className="section-shell">
      <div className="orb right-[-10%] top-[-5%] h-[30%] w-[30%] bg-amber-500/5 dark:bg-amber-500/10" />
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
              Edit Collaborations
            </Link>
          </div>
        )}

        <AnimatedSectionHeader title="Brand Collaborations" subtitle="Partnerships and brand work I'm proud of." />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {collaborations.length > 0 ? (
            collaborations.map((collab, index) => {
              const borderColor = borderColors[index % borderColors.length]

              return (
                <motion.div
                  key={collab.id || index}
                  initial={{ opacity: 0, y: 26 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false, amount: 0.35 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className={`glass-card group relative h-full overflow-hidden border ${borderColor}`}>
                    {collab.logo ? (
                      <div className="relative mb-4 h-12 w-12 overflow-hidden rounded-xl border border-border/50">
                        <Image
                          src={collab.logo}
                          alt={collab.brand}
                          fill
                          sizes="48px"
                          className="object-contain"
                        />
                      </div>
                    ) : (
                      <div className="mb-4 inline-flex rounded-xl border border-border/50 bg-background/50 p-2.5">
                        <Handshake className="h-6 w-6 text-primary transition-transform duration-300 group-hover:scale-110" />
                      </div>
                    )}

                    <h3 className="break-words text-base font-bold text-foreground [overflow-wrap:anywhere]">
                      {collab.brand}
                    </h3>

                    {collab.date && (
                      <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        {collab.date}
                      </p>
                    )}

                    {collab.description && (
                      <p className="mt-3 break-words text-sm leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
                        {collab.description}
                      </p>
                    )}

                    {collab.url && (
                      <div className="mt-4">
                        <a
                          href={collab.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border/50 bg-secondary/50 px-3 py-1.5 text-xs font-medium text-primary transition-all duration-200 hover:border-primary/30 hover:bg-primary/5"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          View Collaboration
                        </a>
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })
          ) : (
            <div className="glass-card md:col-span-2 lg:col-span-3 text-center text-muted-foreground">
              No collaborations added yet. Use Edit Collaborations to showcase your brand partnerships.
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
