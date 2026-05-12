"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/db"
import { getFriendlySupabaseError } from "@/utils/supabase-error"
import { cn } from "@/lib/utils"
import { AnimatePresence, motion } from "framer-motion"
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ChevronLeft,
  Eye,
  EyeOff,
  Github,
  Loader2,
  LockKeyhole,
  Mail,
  MailCheck,
  Phone,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/router"
import * as React from "react"
import { useState } from "react"

const roleOptions = ["Developer", "Designer", "Product Manager", "Marketing", "Sales", "Customer Support", "Other"]

const steps = [
  {
    id: 1,
    eyebrow: "Step 1",
    label: "About you",
    title: "Create your profile",
    description: "Start with the essentials so we can set up your public profile and contact details.",
  },
  {
    id: 2,
    eyebrow: "Step 2",
    label: "Security",
    title: "Lock in your account",
    description: "Choose a strong password so your workspace is secure from the start.",
  },
] as const

const highlights = [
  {
    title: "Polished portfolio onboarding",
    description: "A clear two-step flow that feels fast, guided, and easy to complete.",
    icon: Sparkles,
  },
  {
    title: "Built-in clarity",
    description: "Errors show exactly where the form needs attention instead of feeling like the button is broken.",
    icon: CheckCircle2,
  },
  {
    title: "Secure by default",
    description: "Password guidance and confirmation checks help avoid bad signups and support issues later.",
    icon: ShieldCheck,
  },
] as const

type SignupStep = 1 | 2

type SignupFormValues = {
  firstname: string
  lastname: string
  username: string
  email: string
  phone: string
  role: string
  password: string
  confirmpassword: string
}

type SignupField = keyof SignupFormValues
type SignupErrors = Partial<Record<SignupField | "form", string>>

const baseInputClassName =
  "h-12 rounded-2xl border-slate-200 bg-white/90 pl-11 shadow-sm transition-all duration-300 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-0 dark:border-slate-700 dark:bg-slate-950/70 dark:placeholder:text-slate-500"

function getStrengthLabel(score: number) {
  if (score <= 1) return "Weak"
  if (score === 2) return "Fair"
  if (score === 3) return "Strong"
  return "Excellent"
}

type UserRegistrationFormProps = {
  className?: string
}

export function UserRegistrationForm({ className }: UserRegistrationFormProps) {
  const router = useRouter()

  const [step, setStep] = useState<SignupStep>(1)
  const [pending, setPending] = useState(false)
  const [success, setSuccess] = useState(false)
  const [requiresEmailVerification, setRequiresEmailVerification] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState("")
  const [profileType, setProfileType] = useState<"user" | "team" | "business" | null>(null)
  const [oauthPending, setOauthPending] = useState<"google" | "github" | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState<SignupFormValues>({
    firstname: "",
    lastname: "",
    username: "",
    email: "",
    phone: "",
    role: "Developer",
    password: "",
    confirmpassword: "",
  })
  const [errors, setErrors] = useState<SignupErrors>({})

  const passwordChecks = [
    formData.password.length >= 8,
    /[A-Z]/.test(formData.password),
    /[a-z]/.test(formData.password),
    /\d/.test(formData.password),
  ]
  const passwordStrength = passwordChecks.filter(Boolean).length
  const activeStep = steps[step - 1]

  const setValidationErrors = (nextErrors: SignupErrors) => {
    setErrors(nextErrors)

    const firstInvalidField = (Object.keys(nextErrors) as Array<SignupField | "form">).find((key) => key !== "form")

    if (!firstInvalidField || typeof window === "undefined") {
      return
    }

    requestAnimationFrame(() => {
      const element = document.getElementById(firstInvalidField)
      element?.focus()
    })
  }

  const clearErrors = (...fieldNames: Array<SignupField | "form">) => {
    setErrors((prev) => {
      const nextErrors = { ...prev }
      let hasChanges = false

      for (const fieldName of fieldNames) {
        if (nextErrors[fieldName]) {
          delete nextErrors[fieldName]
          hasChanges = true
        }
      }

      if (nextErrors.form) {
        delete nextErrors.form
        hasChanges = true
      }

      return hasChanges ? nextErrors : prev
    })
  }

  const updateField = (field: SignupField, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    clearErrors(field)
  }

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateField(event.target.name as SignupField, event.target.value)
  }

  const validateStepOne = () => {
    const nextErrors: SignupErrors = {}
    const phoneDigits = formData.phone.replace(/\D/g, "")

    if (!formData.firstname.trim()) nextErrors.firstname = "First name is required."
    if (!formData.lastname.trim()) nextErrors.lastname = "Last name is required."

    if (formData.username.trim() && formData.username.trim().length < 3) {
      nextErrors.username = "Username must be at least 3 characters."
    }

    if (!formData.email.trim()) {
      nextErrors.email = "Email is required."
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email.trim())) {
      nextErrors.email = "Enter a valid email address."
    }

    if (!formData.phone.trim()) {
      nextErrors.phone = "Phone number is required."
    } else if (phoneDigits.length < 7) {
      nextErrors.phone = "Enter a valid phone number."
    }

    if (!formData.role.trim()) {
      nextErrors.role = "Select the role that fits you best."
    }

    if (Object.keys(nextErrors).length > 0) {
      nextErrors.form = "Update the highlighted fields before continuing."
      setValidationErrors(nextErrors)
      return false
    }

    setErrors({})
    return true
  }

  const validateStepTwo = () => {
    const nextErrors: SignupErrors = {}

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

    if (Object.keys(nextErrors).length > 0) {
      nextErrors.form = "Review your password details before creating the account."
      setValidationErrors(nextErrors)
      return false
    }

    setErrors({})
    return true
  }

  const handleContinue = () => {
    if (pending || success) {
      return
    }

    if (validateStepOne()) {
      setStep(2)
    }
  }

  const handleBack = () => {
    clearErrors("form", "password", "confirmpassword")
    setStep(1)
  }

  const handleSocialAuth = async (provider: "google" | "github") => {
    if (typeof window === "undefined") return

    // Store selected type so the callback can apply it after OAuth
    if (profileType) {
      sessionStorage.setItem("signup_profile_type", profileType)
    }

    setOauthPending(provider)
    setErrors({})

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setErrors({ form: getFriendlySupabaseError(error) || "Social signup failed. Please try again." })
      setOauthPending(null)
    }
  }

  const handleRegister = async () => {
    if (!validateStepTwo()) {
      return
    }

    setPending(true)

    try {
      const generatedUsername =
        formData.username.trim() ||
        `${formData.firstname}${formData.lastname}`
          .replace(/[^a-zA-Z0-9]/g, "")
          .toLowerCase()
          .slice(0, 18) +
          Math.floor(Math.random() * 1000)

      const submittedEmail = formData.email.trim().toLowerCase()
      setRegisteredEmail(submittedEmail)

      const { data, error } = await supabase.auth.signUp({
        email: submittedEmail,
        password: formData.password,
        options: {
          data: {
            firstname: formData.firstname.trim(),
            lastname: formData.lastname.trim(),
            username: generatedUsername,
            phone: formData.phone.trim(),
            role: formData.role,
            type: profileType ?? "user",
          },
        },
      })

      if (error) {
        setErrors({ form: getFriendlySupabaseError(error) || "Registration failed. Please try again." })
        return
      }

      if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        setErrors({ form: "An account with this email already exists. Please sign in instead." })
        return
      }

      const needsEmailVerification = !data.session
      setRequiresEmailVerification(needsEmailVerification)

      setSuccess(true)

      if (needsEmailVerification) {
        // User must verify email first — redirect to sign-in
        window.setTimeout(() => {
          void router.push("/sign-in")
        }, 3000)
      } else {
        // Auto-logged in — redirect to portfolio page
        const selectedType = profileType ?? "user"
        const destUsername = generatedUsername || formData.username.trim()
        const portfolioPath = selectedType === "business"
          ? `/b/${encodeURIComponent(destUsername)}`
          : selectedType === "team"
            ? `/t/${encodeURIComponent(destUsername)}`
            : `/u/${encodeURIComponent(destUsername)}`
        window.setTimeout(() => {
          void router.push(portfolioPath)
        }, 1600)
      }
    } catch (error) {
      console.error("Registration error:", error)
      setErrors({ form: "Something unexpected happened. Please try again." })
    } finally {
      setPending(false)
    }
  }

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (step === 1) {
      handleContinue()
      return
    }

    await handleRegister()
  }

  const isBusy = pending || Boolean(oauthPending)

  const GoogleIcon = () => (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.2-.9 2.3-1.9 3l3 2.3c1.8-1.6 2.8-4 2.8-6.8 0-.7-.1-1.4-.2-2H12z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.9-.9 6.6-2.4l-3-2.3c-.8.6-2 .9-3.5.9-2.7 0-4.9-1.8-5.7-4.2l-3.1 2.4C5 19.7 8.2 22 12 22z" />
      <path fill="#4A90E2" d="M6.3 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2L3.2 7.6C2.4 9.1 2 10.5 2 12s.4 2.9 1.2 4.4L6.3 14z" />
      <path fill="#FBBC05" d="M12 5.8c1.5 0 2.8.5 3.9 1.5l2.9-2.9C16.9 2.6 14.7 2 12 2 8.2 2 5 4.3 3.2 7.6L6.3 10c.8-2.4 3-4.2 5.7-4.2z" />
    </svg>
  )

  return (
    <motion.section
      className={cn(
        "w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/50 bg-white/75 shadow-[0_30px_120px_rgba(15,23,42,0.25)] backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-950/55",
        className,
      )}
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.55, ease: "easeOut" }}
    >
      <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative overflow-hidden bg-gradient-to-br from-cyan-600 via-sky-500 to-teal-500 p-8 text-white sm:p-10 lg:p-12">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.28),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.18),transparent_34%)]" />
          <div className="pointer-events-none absolute -right-14 top-10 h-40 w-40 rounded-full border border-white/20 bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-56 w-56 rounded-full border border-white/10 bg-slate-950/15 blur-3xl" />

          <div className="relative flex h-full flex-col">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/90 backdrop-blur">
              <Sparkles className="size-4" />
              Modern onboarding
            </div>

            <div className="mt-8 max-w-xl">
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                Join the portfolio with a cleaner, faster signup experience.
              </h1>
              <p className="mt-4 text-base leading-7 text-cyan-50/90 sm:text-lg">
                We rebuilt the registration flow to feel more intentional, with stronger feedback, smoother step
                transitions, and a more polished interface from the first click.
              </p>
            </div>

            <div className="mt-10 space-y-4">
              {highlights.map((highlight, index) => {
                const Icon = highlight.icon

                return (
                  <motion.div
                    key={highlight.title}
                    className="rounded-3xl border border-white/15 bg-white/10 p-4 backdrop-blur"
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.08, duration: 0.4 }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 rounded-2xl bg-white/15 p-2">
                        <Icon className="size-5" />
                      </div>
                      <div>
                        <h2 className="text-base font-semibold">{highlight.title}</h2>
                        <p className="mt-1 text-sm leading-6 text-cyan-50/80">{highlight.description}</p>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>

            <div className="mt-10 rounded-[1.75rem] border border-white/15 bg-slate-950/15 p-5 backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-50/70">Progress</p>
                  <p className="mt-2 text-lg font-semibold">
                    {activeStep.label} ({step}/2)
                  </p>
                </div>
                <div className="rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-cyan-50/90">
                  {step === 1 ? "Profile details" : "Password setup"}
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {steps.map((stepItem) => {
                  const isComplete = stepItem.id < step
                  const isActive = stepItem.id === step

                  return (
                    <div
                      key={stepItem.id}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl border px-3 py-3 transition-all duration-300",
                        isActive || isComplete
                          ? "border-white/25 bg-white/12"
                          : "border-white/10 bg-white/5 text-cyan-50/60",
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold",
                          isActive || isComplete ? "border-white/30 bg-white text-sky-600" : "border-white/15 bg-white/10",
                        )}
                      >
                        {isComplete ? <CheckCircle2 className="size-4" /> : stepItem.id}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{stepItem.title}</p>
                        <p className="text-xs text-cyan-50/70">{stepItem.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="relative bg-white/88 p-6 sm:p-8 lg:p-10 dark:bg-slate-950/78">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />

          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-300">
                {activeStep.eyebrow}
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                {activeStep.title}
              </h2>
              <p className="mt-2 max-w-lg text-sm leading-6 text-slate-600 dark:text-slate-300">
                {activeStep.description}
              </p>
            </div>

            <Link
              href="/sign-in"
              className="inline-flex shrink-0 items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-300 hover:text-cyan-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-cyan-500 dark:hover:text-cyan-300"
            >
              Sign in
            </Link>
          </div>

          <div className="mb-8 grid grid-cols-2 gap-3">
            {steps.map((stepItem) => {
              const isComplete = stepItem.id < step
              const isActive = stepItem.id === step

              return (
                <div
                  key={stepItem.id}
                  className={cn(
                    "rounded-3xl border px-4 py-4 transition-all duration-300",
                    isActive
                      ? "border-cyan-200 bg-cyan-50/70 shadow-sm dark:border-cyan-500/40 dark:bg-cyan-950/35"
                      : "border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/50",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold",
                        isActive || isComplete
                          ? "bg-gradient-to-br from-cyan-500 to-teal-500 text-white"
                          : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
                      )}
                    >
                      {isComplete ? <CheckCircle2 className="size-4" /> : stepItem.id}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">{stepItem.label}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{stepItem.eyebrow}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {profileType === null ? (
            <motion.div
              key="type-selector"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h3 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                  Choose your account type
                </h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Select how you want to use your portfolio — you can change this later.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setProfileType("user")}
                  className="group flex w-full items-center gap-4 rounded-2xl border-2 border-slate-200 bg-white/80 p-5 text-left transition-all duration-300 hover:border-cyan-300 hover:bg-cyan-50/50 hover:shadow-md dark:border-slate-700 dark:bg-slate-900/60 dark:hover:border-cyan-500/50 dark:hover:bg-cyan-950/30"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 text-white shadow-sm">
                    <UserRound className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-slate-900 dark:text-slate-50">Individual User</p>
                    <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                      Create a personal portfolio to showcase your work, skills, and experience.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setProfileType("team")}
                  className="group flex w-full items-center gap-4 rounded-2xl border-2 border-slate-200 bg-white/80 p-5 text-left transition-all duration-300 hover:border-teal-300 hover:bg-teal-50/50 hover:shadow-md dark:border-slate-700 dark:bg-slate-900/60 dark:hover:border-teal-500/50 dark:hover:bg-teal-950/30"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 text-white shadow-sm">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-slate-900 dark:text-slate-50">Team</p>
                    <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                      Showcase your team{"'"}s collective work, members, and collaborative projects.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setProfileType("business")}
                  className="group flex w-full items-center gap-4 rounded-2xl border-2 border-slate-200 bg-white/80 p-5 text-left transition-all duration-300 hover:border-purple-300 hover:bg-purple-50/50 hover:shadow-md dark:border-slate-700 dark:bg-slate-900/60 dark:hover:border-purple-500/50 dark:hover:bg-purple-950/30"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-violet-500 text-white shadow-sm">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-slate-900 dark:text-slate-50">Business</p>
                    <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                      Create a business profile to highlight your company, services, and offerings.
                    </p>
                  </div>
                </button>
              </div>
            </motion.div>
          ) : (
          <AnimatePresence mode="wait" initial={false}>
            {success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -18 }}
                transition={{ duration: 0.35 }}
                className="rounded-[1.75rem] border border-emerald-200 bg-emerald-50/90 p-8 text-center shadow-sm dark:border-emerald-500/30 dark:bg-emerald-950/20"
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
                  {requiresEmailVerification ? <MailCheck className="size-8" /> : <CheckCircle2 className="size-8" />}
                </div>
                <h3 className="mt-5 text-2xl font-semibold text-slate-900 dark:text-slate-50">
                  {requiresEmailVerification ? "Verify your email" : "Account created"}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {requiresEmailVerification
                    ? `We sent a verification link to ${registeredEmail || "your email address"}. Confirm it to finish activation.`
                    : "Your signup is complete. We are sending you to the sign-in page now."}
                </p>
                <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm dark:bg-slate-900 dark:text-slate-200">
                  <Loader2 className="size-4 animate-spin" />
                  {requiresEmailVerification ? "Redirecting to sign in..." : "Redirecting..."}
                </div>
              </motion.div>
            ) : (
              <motion.form
                key={`step-${step}`}
                noValidate
                onSubmit={handleFormSubmit}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {errors.form && (
                  <div
                    aria-live="polite"
                    className="rounded-2xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-950/20 dark:text-red-300"
                  >
                    {errors.form}
                  </div>
                )}

                {step === 1 ? (
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Button
                        type="button"
                        variant="outline"
                        disabled={isBusy}
                        onClick={() => handleSocialAuth("google")}
                        className="h-12 rounded-2xl border-slate-200 bg-white text-slate-700 transition-all duration-300 hover:border-cyan-300 hover:text-cyan-700 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200"
                      >
                        {oauthPending === "google" ? <Loader2 className="size-4 animate-spin" /> : <GoogleIcon />}
                        Continue with Google
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={isBusy}
                        onClick={() => handleSocialAuth("github")}
                        className="h-12 rounded-2xl border-slate-200 bg-white text-slate-700 transition-all duration-300 hover:border-cyan-300 hover:text-cyan-700 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200"
                      >
                        {oauthPending === "github" ? <Loader2 className="size-4 animate-spin" /> : <Github className="size-4" />}
                        Continue with GitHub
                      </Button>
                    </div>

                    <div className="relative py-1">
                      <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:via-slate-700" />
                      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-xs font-medium uppercase tracking-[0.14em] text-slate-400 dark:bg-slate-950/70 dark:text-slate-500">
                        Or continue with details
                      </span>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="firstname" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                          First name
                        </Label>
                        <div className="relative">
                          <UserRound className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                          <Input
                            id="firstname"
                            name="firstname"
                            autoComplete="given-name"
                            placeholder="John"
                            value={formData.firstname}
                            onChange={handleInputChange}
                            className={cn(
                              baseInputClassName,
                              errors.firstname &&
                                "border-red-300 bg-red-50/80 focus-visible:ring-red-500 dark:border-red-500/40 dark:bg-red-950/10",
                            )}
                          />
                        </div>
                        {errors.firstname && <p className="text-sm text-red-600 dark:text-red-300">{errors.firstname}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="lastname" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                          Last name
                        </Label>
                        <div className="relative">
                          <UserRound className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                          <Input
                            id="lastname"
                            name="lastname"
                            autoComplete="family-name"
                            placeholder="Doe"
                            value={formData.lastname}
                            onChange={handleInputChange}
                            className={cn(
                              baseInputClassName,
                              errors.lastname &&
                                "border-red-300 bg-red-50/80 focus-visible:ring-red-500 dark:border-red-500/40 dark:bg-red-950/10",
                            )}
                          />
                        </div>
                        {errors.lastname && <p className="text-sm text-red-600 dark:text-red-300">{errors.lastname}</p>}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        Email address
                      </Label>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          placeholder="yourname@example.com"
                          value={formData.email}
                          onChange={handleInputChange}
                          className={cn(
                            baseInputClassName,
                            errors.email &&
                              "border-red-300 bg-red-50/80 focus-visible:ring-red-500 dark:border-red-500/40 dark:bg-red-950/10",
                          )}
                        />
                      </div>
                      {errors.email && <p className="text-sm text-red-600 dark:text-red-300">{errors.email}</p>}
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                          Phone number
                        </Label>
                        <div className="relative">
                          <Phone className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                          <Input
                            id="phone"
                            name="phone"
                            type="tel"
                            autoComplete="tel"
                            placeholder="+1 555 123 4567"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className={cn(
                              baseInputClassName,
                              errors.phone &&
                                "border-red-300 bg-red-50/80 focus-visible:ring-red-500 dark:border-red-500/40 dark:bg-red-950/10",
                            )}
                          />
                        </div>
                        {errors.phone && <p className="text-sm text-red-600 dark:text-red-300">{errors.phone}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="role" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                          Role
                        </Label>
                        <div className="relative">
                          <BriefcaseBusiness className="pointer-events-none absolute left-4 top-1/2 z-10 size-4 -translate-y-1/2 text-slate-400" />
                          <Select value={formData.role} onValueChange={(value) => updateField("role", value)}>
                            <SelectTrigger
                              id="role"
                              className={cn(
                                "h-12 rounded-2xl border-slate-200 bg-white/90 pl-11 shadow-sm transition-all duration-300 focus:ring-2 focus:ring-cyan-500 focus:ring-offset-0 dark:border-slate-700 dark:bg-slate-950/70",
                                errors.role &&
                                  "border-red-300 bg-red-50/80 focus:ring-red-500 dark:border-red-500/40 dark:bg-red-950/10",
                              )}
                            >
                              <SelectValue placeholder="Choose your role" />
                            </SelectTrigger>
                            <SelectContent>
                              {roleOptions.map((role) => (
                                <SelectItem key={role} value={role}>
                                  {role}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {errors.role && <p className="text-sm text-red-600 dark:text-red-300">{errors.role}</p>}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="username" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        Username
                        <span className="ml-2 text-xs font-normal text-slate-400">Optional</span>
                      </Label>
                      <div className="relative">
                        <UserRound className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                        <Input
                          id="username"
                          name="username"
                          autoComplete="username"
                          placeholder="johndoe"
                          value={formData.username}
                          onChange={handleInputChange}
                          className={cn(
                            baseInputClassName,
                            errors.username &&
                              "border-red-300 bg-red-50/80 focus-visible:ring-red-500 dark:border-red-500/40 dark:bg-red-950/10",
                          )}
                        />
                      </div>
                      {errors.username ? (
                        <p className="text-sm text-red-600 dark:text-red-300">{errors.username}</p>
                      ) : (
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Leave this blank and we will generate one for you automatically.
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        Password
                      </Label>
                      <div className="relative">
                        <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                        <Input
                          id="password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          autoComplete="new-password"
                          placeholder="Create a strong password"
                          value={formData.password}
                          onChange={handleInputChange}
                          className={cn(
                            baseInputClassName,
                            "pr-12",
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

                      <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Password strength</p>
                          <span className="text-sm font-semibold text-cyan-600 dark:text-cyan-300">
                            {getStrengthLabel(passwordStrength)}
                          </span>
                        </div>
                        <div className="mt-3 grid grid-cols-4 gap-2">
                          {Array.from({ length: 4 }).map((_, index) => (
                            <div
                              key={index}
                              className={cn(
                                "h-2 rounded-full transition-all duration-300",
                                index < passwordStrength
                                  ? "bg-gradient-to-r from-cyan-500 to-teal-500"
                                  : "bg-slate-200 dark:bg-slate-800",
                              )}
                            />
                          ))}
                        </div>
                        <div className="mt-4 grid gap-2 text-sm text-slate-500 dark:text-slate-400 sm:grid-cols-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle2
                              className={cn(
                                "size-4",
                                passwordChecks[0] ? "text-emerald-500" : "text-slate-300 dark:text-slate-600",
                              )}
                            />
                            8 or more characters
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2
                              className={cn(
                                "size-4",
                                passwordChecks[1] ? "text-emerald-500" : "text-slate-300 dark:text-slate-600",
                              )}
                            />
                            One uppercase letter
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2
                              className={cn(
                                "size-4",
                                passwordChecks[2] ? "text-emerald-500" : "text-slate-300 dark:text-slate-600",
                              )}
                            />
                            One lowercase letter
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2
                              className={cn(
                                "size-4",
                                passwordChecks[3] ? "text-emerald-500" : "text-slate-300 dark:text-slate-600",
                              )}
                            />
                            One number
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmpassword" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        Confirm password
                      </Label>
                      <div className="relative">
                        <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                        <Input
                          id="confirmpassword"
                          name="confirmpassword"
                          type={showConfirmPassword ? "text" : "password"}
                          autoComplete="new-password"
                          placeholder="Re-enter your password"
                          value={formData.confirmpassword}
                          onChange={handleInputChange}
                          className={cn(
                            baseInputClassName,
                            "pr-12",
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
                      {errors.confirmpassword && (
                        <p className="text-sm text-red-600 dark:text-red-300">{errors.confirmpassword}</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
                  {step === 1 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Already have an account?{" "}
                      <Link
                        href="/sign-in"
                        className="font-semibold text-cyan-600 transition-colors hover:text-cyan-700 dark:text-cyan-300 dark:hover:text-cyan-200"
                      >
                        Sign in here
                      </Link>
                    </p>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBack}
                      disabled={isBusy}
                      className="h-12 rounded-2xl border-slate-200 px-5 dark:border-slate-700"
                    >
                      <ChevronLeft className="mr-2 size-4" />
                      Back
                    </Button>
                  )}

                  <Button
                    type={step === 1 ? "button" : "submit"}
                    onClick={step === 1 ? handleContinue : undefined}
                    disabled={isBusy}
                    className="h-12 rounded-2xl bg-gradient-to-r from-cyan-600 to-teal-500 px-6 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:from-cyan-500 hover:to-teal-400"
                  >
                    {pending ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Creating account...
                      </>
                    ) : step === 1 ? (
                      <>
                        Continue
                        <ArrowRight className="ml-2 size-4" />
                      </>
                    ) : (
                      "Create account"
                    )}
                  </Button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
          )}
        </div>
      </div>
    </motion.section>
  )
}
