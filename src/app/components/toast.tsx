"use client"

import { CheckCircle, X, XCircle } from "lucide-react"
import { createContext, useCallback, useContext, useState } from "react"

type ToastVariant = "success" | "error"

type ToastItem = {
  id: number
  message: string
  variant: ToastVariant
}

type ToastContextValue = {
  toast: (message: string, variant?: ToastVariant) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export const useToast = () => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used within ToastProvider")
  return ctx
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const toast = useCallback((message: string, variant: ToastVariant = "success") => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, variant }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  const dismiss = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-start gap-3 rounded-2xl border px-5 py-4 text-sm shadow-xl backdrop-blur-xl transition-all duration-300 animate-in slide-in-from-right ${
              t.variant === "success"
                ? "border-emerald-200/80 bg-emerald-50/95 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
                : "border-rose-200/80 bg-rose-50/95 text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200"
            }`}
          >
            {t.variant === "success" ? (
              <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
            ) : (
              <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" />
            )}
            <span className="min-w-0 flex-1">{t.message}</span>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="shrink-0 rounded-md p-0.5 opacity-60 transition-opacity hover:opacity-100"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
