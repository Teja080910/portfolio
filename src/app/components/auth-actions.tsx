"use client"

import { ModeToggle } from "@/app/components/mode-toggle"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/db"
import { useStore } from "@/lib/store"
import { Loader2, LogOut, X } from "lucide-react"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"

export default function AuthActions() {
  const router = useRouter()
  const user = useStore((state) => state.user)
  const userId = user?.id
  const removeUser = useStore((state) => state.removeUser)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  useEffect(() => {
    if (!showLogoutConfirm) return

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isLoggingOut) {
        setShowLogoutConfirm(false)
      }
    }

    window.addEventListener("keydown", handleEscape)
    return () => window.removeEventListener("keydown", handleEscape)
  }, [showLogoutConfirm, isLoggingOut])

  const displayName =
    `${user?.firstname || ""} ${user?.lastname || ""}`.trim() || user?.username || user?.email || "User"

  const avatarText = (() => {
    if (user?.firstname || user?.lastname) {
      return `${user?.firstname?.[0] || ""}${user?.lastname?.[0] || ""}`.toUpperCase()
    }

    if (user?.username) {
      return user.username.slice(0, 2).toUpperCase()
    }

    return "U"
  })()

  const handleLogout = async () => {
    if (isLoggingOut) return

    setIsLoggingOut(true)
    await supabase.auth.signOut()
    removeUser()
    setShowLogoutConfirm(false)
    void router.push("/sign-in")
    setIsLoggingOut(false)
  }

  if (!userId) {
    return (
      <div className="flex items-center gap-2">
        <ModeToggle />
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center gap-2 rounded-full border border-slate-300/80 bg-white/90 px-2 py-1 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/85">
        <div className="hidden items-center gap-2 rounded-full bg-slate-100/80 px-2 py-1 text-xs text-slate-700 dark:bg-slate-800/80 dark:text-slate-200 sm:flex">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-cyan-600 to-teal-500 text-[11px] font-semibold text-white">
            {avatarText}
          </div>
          <span className="max-w-[120px] truncate font-medium">{displayName}</span>
        </div>

        <ModeToggle />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowLogoutConfirm(true)}
          className="h-9 rounded-full border-slate-300/80 bg-white/90 px-3 text-slate-700 transition-colors hover:border-cyan-300 hover:text-cyan-700 dark:border-slate-700 dark:bg-slate-900/85 dark:text-slate-200"
        >
          <LogOut className="mr-1 h-4 w-4" />
          Logout
        </Button>
      </div>

      {showLogoutConfirm && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isLoggingOut) {
              setShowLogoutConfirm(false)
            }
          }}
        >
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-4 flex items-start justify-between gap-3">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Confirm logout</h3>
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="rounded-md p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300">
              You are signed in as <span className="font-semibold">{displayName}</span>. Do you want to logout now?
            </p>

            <div className="mt-6 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowLogoutConfirm(false)}
                disabled={isLoggingOut}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="bg-gradient-to-r from-cyan-600 to-teal-500 text-white hover:from-cyan-500 hover:to-teal-400"
              >
                {isLoggingOut ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <LogOut className="mr-1 h-4 w-4" />}
                Logout
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
