"use client"

import { useStore } from "@/lib/store"
import { motion } from "framer-motion"
import { PencilLine } from "lucide-react"
import Link from "next/link"
import AnimatedSectionHeader from "../../app/components/animatedsectionheader"

type CreatorToolsProps = {
  isReadOnly?: boolean
}

const toolCategoryIcons: Record<string, string> = {
  camera: "📷",
  editing: "✂️",
  audio: "🎧",
  lighting: "💡",
  software: "💻",
  design: "🎨",
  analytics: "📊",
  productivity: "📋",
  other: "🔧",
}

const getCategoryIcon = (category: string) => {
  const key = Object.entries(toolCategoryIcons).find(([k]) =>
    category?.toLowerCase().includes(k)
  )
  return key ? key[1] : "🔧"
}

export default function CreatorTools({ isReadOnly = false }: CreatorToolsProps) {
  const creatorToolsStore = useStore((state) => state.creatorTools)
  const userId = useStore((state) => state.user.id)
  const username = useStore((state) => state.user.username)
  const editHref = `/u/${encodeURIComponent(username || "me")}/edit-creator-tools`
  const tools = creatorToolsStore.filter((item) => item.show && (item.name || item.category || item.description))

  if (isReadOnly && tools.length === 0) {
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
    <section id="creator-tools" className="section-shell">
      <div className="orb left-[-10%] top-[-5%] h-[30%] w-[30%] bg-emerald-500/5 dark:bg-emerald-500/10" />
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
              Edit Tools
            </Link>
          </div>
        )}

        <AnimatedSectionHeader title="Creator Tools" subtitle="The tools and equipment I use to create content." />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tools.length > 0 ? (
            tools.map((tool, index) => {
              const borderColor = borderColors[index % borderColors.length]

              return (
                <motion.div
                  key={tool.id || index}
                  initial={{ opacity: 0, y: 26 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false, amount: 0.35 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className={`glass-card group relative h-full overflow-hidden border ${borderColor}`}>
                    <div className="mb-3 inline-flex rounded-xl border border-border/50 bg-background/50 p-2.5 text-2xl">
                      {tool.icon || getCategoryIcon(tool.category)}
                    </div>

                    <h3 className="break-words text-base font-bold text-foreground [overflow-wrap:anywhere]">
                      {tool.name}
                    </h3>

                    {tool.category && (
                      <p className="mt-1 text-xs font-medium text-primary">
                        {tool.category}
                      </p>
                    )}

                    {tool.description && (
                      <p className="mt-3 break-words text-sm leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
                        {tool.description}
                      </p>
                    )}
                  </div>
                </motion.div>
              )
            })
          ) : (
            <div className="glass-card md:col-span-2 lg:col-span-3 text-center text-muted-foreground">
              No creator tools added yet. Use Edit Tools to showcase your equipment and software.
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
