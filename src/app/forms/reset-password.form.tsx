"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/db"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { ArrowRight, CheckCircle2, Eye, EyeOff, Loader2, LockKeyhole, ShieldCheck } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"

type ResetPasswordFormProps = {
  className?: string
}

export function ResetPasswordForm({ className }: ResetPasswordFormProps) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [hasRecoverySession, setHasRecoverySession] = useState(false)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    password: "",
    confirmpassword: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    let isActive = true

    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()
      if (!isActive) return

      setHasRecoverySession(Boolean(data.session))
      setCheckingSession(false)
    }

    void checkSession()

    const { data: authSubscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isActive) return

      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setHasRecoverySession(Boolean(session))
        setCheckingSession(false)
      }

      if (event === "SIGNED_OUT") {
        setHasRecoverySession(false)
      }
    })

    return () => {
      isActive = false
      authSubscription.subscription.unsubscribe()
    }
  }, [])

  const setValidationErrors = (nextErrors: Record<string, string>) => {
    setErrors(nextErrors)
    const firstInvalidField = Object.keys(nextErrors).find((key) => key !== "form")

    if (!firstInvalidField || typeof window === "undefined") {
      return
    }

    requestAnimationFrame(() => {
      const element = document.getElementById(firstInvalidField)
      element?.focus()
    })
  }

  const validate = () => {
    const nextErrors: Record<string, string> = {}

    if (!formData.password) {
      nextErrors.password = "Password is required."
    } else if (formData.password.length < 8 || !/[A-Za-z]/.test(formData.password) || !/\d/.test(formData.password)) {
      nextErrors.password = "Use at least 8 characters with both letters and numbers."
    }

    if (!formData.confirmpassword) {
      nextErrors.confirmpassword = "Please confirm your password."
    } else if (formData.password !== formData.confirmpassword) {
      nextErrors.confirmpassword = "Passwords do not match."
    }

    if (!hasRecoverySession) {
      nextErrors.form = "Recovery session not found. Request a new reset link from sign in."
    }

    if (Object.keys(nextErrors).length > 0) {
      setValidationErrors(nextErrors)
      return false
    }

    setErrors({})
    return true
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name] || errors.form) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[name]
        delete next.form
        return next
      })
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!validate()) {
      return
    }

    setPending(true)

    const { error } = await supabase.auth.updateUser({ password: formData.password })

    if (error) {
      setErrors({ form: error.message || "Could not update password. Please try again." })
      setPending(false)
      return
    }

    await supabase.auth.signOut()
    setSuccess(true)
    setPending(false)

    window.setTimeout(() => {
      void router.push("/sign-in")
    }, 1300)
  }

  if (checkingSession) {
    return (
      <div className="w-full max-w-lg rounded-[1.75rem] border border-white/20 bg-white/10 p-8 text-center text-slate-100 shadow-xl backdrop-blur-xl">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-cyan-300 border-t-transparent" />
        <h2 className="text-xl font-semibold">Preparing password reset</h2>
        <p className="mt-2 text-sm text-slate-300">Checking your recovery link and secure session...</p>
      </div>
    )
  }

  if (!hasRecoverySession && !success) {
    return (
      <div className="w-full max-w-lg rounded-[1.75rem] border border-red-500/30 bg-red-950/20 p-8 text-center shadow-xl backdrop-blur-xl">
        <h2 className="text-xl font-semibold text-red-200">Recovery link is invalid or expired</h2>
        <p className="mt-2 text-sm text-red-100/80">Open a fresh reset link from the sign-in page to continue.</p>
        <div className="mt-6">
          <Link
            href="/sign-in"
            className="inline-flex items-center rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-100"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <motion.section
      className={cn(
        "w-full max-w-3xl overflow-hidden rounded-[2rem] border border-white/50 bg-white/75 shadow-[0_30px_120px_rgba(15,23,42,0.25)] backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-950/55",
        className,
      )}
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="grid lg:grid-cols-[0.92fr_1.08fr]">
        <div className="relative overflow-hidden bg-gradient-to-br from-cyan-600 via-sky-500 to-teal-500 p-8 text-white sm:p-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.28),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.18),transparent_34%)]" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/90 backdrop-blur">
              <ShieldCheck className="size-4" />
              Account security
            </div>
            <h1 className="mt-8 text-3xl font-semibold tracking-tight sm:text-4xl">Set a new password</h1>
            <p className="mt-4 text-sm leading-7 text-cyan-50/90 sm:text-base">
              Choose a new secure password for your account. After updating, you will be redirected to sign in.
            </p>
          </div>
        </div>

        <div className="bg-white/88 p-6 sm:p-8 dark:bg-slate-950/78">
          {success ? (
            <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50/90 p-8 text-center dark:border-emerald-500/30 dark:bg-emerald-950/20">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
                <CheckCircle2 className="size-7" />
              </div>
              <h2 className="mt-4 text-2xl font-semibold text-slate-900 dark:text-slate-50">Password updated</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Redirecting you to sign in...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              {errors.form && (
                <div className="rounded-2xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-950/20 dark:text-red-300">
                  {errors.form}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  New password
                </Label>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Enter new password"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={pending}
                    className={cn(
                      "h-12 rounded-2xl border-slate-200 bg-white/90 pl-11 pr-12 shadow-sm transition-all duration-300 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-0 dark:border-slate-700 dark:bg-slate-950/70",
                      errors.password &&
                        "border-red-300 bg-red-50/80 focus-visible:ring-red-500 dark:border-red-500/40 dark:bg-red-950/10",
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-700 dark:hover:text-slate-200"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-red-600 dark:text-red-300">{errors.password}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmpassword" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Confirm new password
                </Label>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="confirmpassword"
                    name="confirmpassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Re-enter new password"
                    value={formData.confirmpassword}
                    onChange={handleChange}
                    disabled={pending}
                    className={cn(
                      "h-12 rounded-2xl border-slate-200 bg-white/90 pl-11 pr-12 shadow-sm transition-all duration-300 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-0 dark:border-slate-700 dark:bg-slate-950/70",
                      errors.confirmpassword &&
                        "border-red-300 bg-red-50/80 focus-visible:ring-red-500 dark:border-red-500/40 dark:bg-red-950/10",
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-700 dark:hover:text-slate-200"
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  >
                    {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {errors.confirmpassword && <p className="text-sm text-red-600 dark:text-red-300">{errors.confirmpassword}</p>}
              </div>

              <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-6 dark:border-slate-800">
                <Link
                  href="/sign-in"
                  className="text-sm font-medium text-slate-500 transition-colors hover:text-cyan-700 dark:text-slate-400 dark:hover:text-cyan-200"
                >
                  Back to sign in
                </Link>

                <Button
                  type="submit"
                  disabled={pending}
                  className="h-12 rounded-2xl bg-gradient-to-r from-cyan-600 to-teal-500 px-6 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:from-cyan-500 hover:to-teal-400"
                >
                  {pending ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      Update password
                      <ArrowRight className="ml-2 size-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </motion.section>
  )
}
