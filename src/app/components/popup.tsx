"use client"

import { CheckCircle, X, XCircle } from "lucide-react"
import { createContext, useCallback, useContext, useState } from "react"

type PopupVariant = "success" | "error"

type PopupState = {
  message: string
  variant: PopupVariant
} | null

type PopupContextValue = {
  showPopup: (message: string, variant?: PopupVariant) => void
}

const PopupContext = createContext<PopupContextValue | null>(null)

export const usePopup = () => {
  const ctx = useContext(PopupContext)
  if (!ctx) throw new Error("usePopup must be used within PopupProvider")
  return ctx
}

export function PopupProvider({ children }: { children: React.ReactNode }) {
  const [popup, setPopup] = useState<PopupState>(null)

  const showPopup = useCallback((message: string, variant: PopupVariant = "success") => {
    setPopup({ message, variant })
  }, [])

  const dismiss = () => setPopup(null)

  return (
    <PopupContext.Provider value={{ showPopup }}>
      {children}
      {popup && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) dismiss()
          }}
        >
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-4 flex items-start justify-between gap-3">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {popup.variant === "success" ? "Done" : "Error"}
              </h3>
              <button
                type="button"
                onClick={dismiss}
                className="rounded-md p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-start gap-3">
              {popup.variant === "success" ? (
                <CheckCircle className="mt-0.5 h-6 w-6 shrink-0 text-emerald-500" />
              ) : (
                <XCircle className="mt-0.5 h-6 w-6 shrink-0 text-rose-500" />
              )}
              <p className="text-sm text-slate-600 dark:text-slate-300">{popup.message}</p>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={dismiss}
                className="inline-flex items-center rounded-full bg-gradient-to-r from-cyan-600 to-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-transform duration-300 hover:-translate-y-0.5"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </PopupContext.Provider>
  )
}
