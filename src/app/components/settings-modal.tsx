"use client"

import ApiTokenSection from "@/app/components/api-token-section"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { ExternalLink, Pencil, Settings2, X } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"
import Link from "next/link"
import { useEffect, useRef } from "react"

export default function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const user = useStore((state) => state.user)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)

    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener("keydown", onKey)
    }
  }, [open, onClose])

  const username = user?.username?.trim() || ""
  const profileHref = username ? `/u/${encodeURIComponent(username)}` : "/"

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200/70 bg-white/95 p-6 shadow-2xl dark:border-slate-700/70 dark:bg-slate-900/95"
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full p-2 text-slate-500 transition hover:bg-slate-200/70 hover:text-slate-900 dark:hover:bg-slate-700 dark:hover:text-slate-100"
              aria-label="Close settings"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 pr-10">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-500 dark:text-cyan-300">
                <Settings2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Account Settings</h2>
                <p className="text-sm text-slate-600 dark:text-slate-300">Manage your account, portfolio links, and API access.</p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/60">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  {user?.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.photo}
                      alt={user.firstname || "avatar"}
                      className="h-14 w-14 rounded-full object-cover ring-2 ring-cyan-400/40"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 text-lg font-bold text-white">
                      {(user?.firstname || user?.username || "U").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-slate-900 dark:text-slate-100">
                      {user?.firstname || "Your account"}
                    </p>
                    <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                      {user?.email || ""}
                    </p>
                    {username && <p className="truncate text-xs text-cyan-600 dark:text-cyan-400">@{username}</p>}
                  </div>
                </div>

                <div className="flex shrink-0 flex-col gap-2">
                  <Link
                    href={profileHref}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    View portfolio
                  </Link>
                  <Link
                    href={`${profileHref}/profile`}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-500 px-4 py-2 text-xs font-semibold text-slate-900 transition hover:opacity-90"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit profile
                  </Link>
                </div>
              </div>
            </div>

            <div className={cn("mt-6")}>
              <ApiTokenSection />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
