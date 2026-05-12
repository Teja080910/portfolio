"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/db"
import { getFriendlySupabaseError } from "@/utils/supabase-error"
import { IUser } from "@/lib/interfaces"
import { cn } from "@/lib/utils"
import { useLogin } from "@refinedev/core"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowRight, Eye, EyeOff, Github, Loader2, LockKeyhole, Mail, ShieldCheck, Sparkles } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"

export function UserLogin({ className }: React.ComponentProps<typeof Card>) {
    const { mutate: login } = useLogin<IUser>()
    const [pending, setPending] = useState(false)
    const [resetPending, setResetPending] = useState(false)
    const [resetSent, setResetSent] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    })
    const [oauthPending, setOauthPending] = useState<"google" | "github" | null>(null)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const router = useRouter()

    const getPortfolioRoute = (username?: string, profileType?: string) => {
        if (!username?.trim()) return "/"
        if (profileType === "business") return `/b/${encodeURIComponent(username.trim())}`
        if (profileType === "team") return `/t/${encodeURIComponent(username.trim())}`
        return `/u/${encodeURIComponent(username.trim())}`
    }

    useEffect(() => {
        let isMounted = true

        const syncAuthState = async () => {
            const { data } = await supabase.auth.getSession()
            const sessionUser = data.session?.user

            if (!isMounted) return

            setIsAuthenticated(Boolean(sessionUser))

            if (!sessionUser) {
                return
            }

            const { data: profile } = await supabase
                .from("profiles")
                .select("username, type")
                .eq("id", sessionUser.id)
                .maybeSingle()

            if (isMounted) {
                void router.replace(getPortfolioRoute(profile?.username, profile?.type))
            }
        }

        void syncAuthState()

        const { data: authSubscription } = supabase.auth.onAuthStateChange((_event, session) => {
            const sessionUser = session?.user
            setIsAuthenticated(Boolean(sessionUser))
        })

        return () => {
            isMounted = false
            authSubscription.subscription.unsubscribe()
        }
    }, [router])

    const setValidationErrors = (nextErrors: Record<string, string>) => {
        setErrors(nextErrors)
        const firstInvalidField = Object.keys(nextErrors).find((key) => key !== "form")
        if (!firstInvalidField || typeof window === "undefined") return

        requestAnimationFrame(() => {
            const element = document.getElementById(firstInvalidField)
            element?.focus()
        })
    }

    const validateStep = () => {
        const newErrors: Record<string, string> = {}
        if (!formData.email.trim()) newErrors.email = "Email is required."
        else if (!/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = "Enter a valid email address."
        if (!formData.password) newErrors.password = "Password is required."
        else if (formData.password.length < 8) newErrors.password = "Password must be at least 8 characters."

        if (Object.keys(newErrors).length > 0) {
            newErrors.form = "Please review the highlighted fields before continuing."
            setValidationErrors(newErrors)
            return false
        }

        setErrors({})
        return true
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const valid = validateStep()
        if (!valid) return

        setPending(true)
        setErrors((prev) => {
            const newErrors = { ...prev }
            delete newErrors.form
            return newErrors
        })

        login(
            {
                email: formData.email.trim().toLowerCase(),
                password: formData.password,
            } as IUser,
            {
                onSuccess: (data) => {
                    if (data?.success) {
                        void router.push(data.redirectTo || "/")
                        return
                    }

                    setErrors({ form: data?.error?.message || "Login failed. Please try again." })
                    setPending(false)
                },
                onError: (error) => {
                    setErrors({ form: getFriendlySupabaseError(error) || "Login failed. Please try again." })
                    setPending(false)
                },
            },
        )
    }

    const cardVariants = {
        hidden: { opacity: 0, y: 20, scale: 0.95 },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: { duration: 0.5 },
        },
        exit: {
            opacity: 0,
            y: -20,
            scale: 0.95,
            transition: { duration: 0.3 },
        },
    }

    const inputVariants = {
        initial: { y: 10, opacity: 0 },
        animate: (i: number) => ({
            y: 0,
            opacity: 1,
            transition: {
                delay: i * 0.1,
                duration: 0.4,
            },
        }),
        exit: (i: number) => ({
            y: 10,
            opacity: 0,
            transition: {
                delay: i * 0.05,
                duration: 0.2,
            },
        }),
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
        if (resetSent) {
            setResetSent(false)
        }
        if (errors[name] || errors.form) {
            setErrors((prev) => {
                const newErrors = { ...prev }
                delete newErrors[name]
                delete newErrors.form
                return newErrors
            })
        }
    }

    const handleForgotPassword = async () => {
        const email = formData.email.trim().toLowerCase()

        if (!email) {
            setValidationErrors({
                email: "Enter your email to reset password.",
                form: "Provide your email address first, then try again.",
            })
            return
        }

        if (!/^\S+@\S+\.\S+$/.test(email)) {
            setValidationErrors({
                email: "Enter a valid email address.",
                form: "Password reset requires a valid email address.",
            })
            return
        }

        setResetPending(true)
        setResetSent(false)
        setErrors((prev) => {
            const next = { ...prev }
            delete next.form
            return next
        })

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        })

        if (error) {
            setErrors({ form: getFriendlySupabaseError(error) || "Could not send reset email. Please try again." })
            setResetPending(false)
            return
        }

        setResetSent(true)
        setResetPending(false)
    }

    const handleSocialAuth = async (provider: "google" | "github") => {
        if (typeof window === "undefined") return

        setOauthPending(provider)
        setErrors((prev) => {
            const next = { ...prev }
            delete next.form
            return next
        })

        const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        })

        if (error) {
            setErrors({ form: getFriendlySupabaseError(error) || "Social login failed. Please try again." })
            setOauthPending(null)
        }
    }

    const isBusy = pending || Boolean(oauthPending) || resetPending

    if (isAuthenticated) {
        return null
    }

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
            <div className="grid lg:grid-cols-[0.95fr_1.05fr]">
                <div className="relative overflow-hidden bg-gradient-to-br from-cyan-600 via-sky-500 to-teal-500 p-8 text-white sm:p-10 lg:p-12">
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.28),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.18),transparent_34%)]" />
                    <div className="pointer-events-none absolute -left-14 top-10 h-40 w-40 rounded-full border border-white/20 bg-white/10 blur-3xl" />
                    <div className="pointer-events-none absolute bottom-0 right-0 h-56 w-56 rounded-full border border-white/10 bg-slate-950/15 blur-3xl" />

                    <div className="relative flex h-full flex-col">
                        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/90 backdrop-blur">
                            <Sparkles className="size-4" />
                            Welcome back
                        </div>
                        <h1 className="mt-8 text-4xl font-semibold tracking-tight sm:text-5xl">Sign in to your portfolio workspace.</h1>
                        <p className="mt-4 text-base leading-7 text-cyan-50/90 sm:text-lg">
                            Continue where you left off with secure login, smoother interactions, and a cleaner account entry flow.
                        </p>

                        <div className="mt-10 rounded-[1.75rem] border border-white/15 bg-slate-950/15 p-5 backdrop-blur">
                            <div className="flex items-start gap-3">
                                <div className="rounded-2xl bg-white/15 p-2">
                                    <ShieldCheck className="size-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold">Secure session handling</p>
                                    <p className="mt-1 text-sm leading-6 text-cyan-50/80">
                                        Authentication is validated before routing, so users land straight on their personalized dashboard.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="relative bg-white/88 p-6 sm:p-8 lg:p-10 dark:bg-slate-950/78">
                    <Card className="border-none bg-transparent shadow-none">
                        <CardHeader className="p-0 pb-8">
                            <CardTitle className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">Sign in</CardTitle>
                            <CardDescription className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                                Enter your email and password to access your portfolio account.
                            </CardDescription>
                        </CardHeader>

                        <form onSubmit={handleSubmit} noValidate>
                            <AnimatePresence mode="wait">
                                <motion.div key="signin" variants={cardVariants} initial="hidden" animate="visible" exit="exit">
                                    <CardContent className="space-y-6 p-0">
                                        {errors.form && (
                                            <div className="rounded-2xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-950/20 dark:text-red-300">
                                                {errors.form}
                                            </div>
                                        )}

                                        <motion.div
                                            className="space-y-2"
                                            data-invalid={!!errors.email}
                                            custom={0}
                                            variants={inputVariants}
                                            initial="initial"
                                            animate="animate"
                                        >
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
                                                    className={cn(
                                                        "h-12 rounded-2xl border-slate-200 bg-white/90 pl-11 shadow-sm transition-all duration-300 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-0 dark:border-slate-700 dark:bg-slate-950/70 dark:placeholder:text-slate-500",
                                                        errors.email &&
                                                            "border-red-300 bg-red-50/80 focus-visible:ring-red-500 dark:border-red-500/40 dark:bg-red-950/10",
                                                    )}
                                                    disabled={isBusy}
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                />
                                            </div>
                                            {errors.email && <p className="text-sm text-red-600 dark:text-red-300">{errors.email}</p>}
                                        </motion.div>

                                        <motion.div
                                            className="space-y-2"
                                            data-invalid={!!errors.password}
                                            custom={1}
                                            variants={inputVariants}
                                            initial="initial"
                                            animate="animate"
                                        >
                                            <Label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                                Password
                                            </Label>
                                            <div className="relative">
                                                <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                                                <Input
                                                    id="password"
                                                    name="password"
                                                    type={showPassword ? "text" : "password"}
                                                    autoComplete="current-password"
                                                    placeholder="Enter your password"
                                                    className={cn(
                                                        "h-12 rounded-2xl border-slate-200 bg-white/90 pl-11 pr-12 shadow-sm transition-all duration-300 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-0 dark:border-slate-700 dark:bg-slate-950/70 dark:placeholder:text-slate-500",
                                                        errors.password &&
                                                            "border-red-300 bg-red-50/80 focus-visible:ring-red-500 dark:border-red-500/40 dark:bg-red-950/10",
                                                    )}
                                                    disabled={isBusy}
                                                    value={formData.password}
                                                    onChange={handleChange}
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
                                            <div className="flex items-center justify-end">
                                                <button
                                                    type="button"
                                                    onClick={handleForgotPassword}
                                                    disabled={isBusy}
                                                    className="text-sm font-medium text-cyan-600 transition-colors hover:text-cyan-700 disabled:opacity-60 dark:text-cyan-300 dark:hover:text-cyan-200"
                                                >
                                                    {resetPending ? "Sending reset email..." : "Forgot password?"}
                                                </button>
                                            </div>
                                        </motion.div>

                                        {resetSent && (
                                            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-950/20 dark:text-emerald-300">
                                                Password reset link sent. Check your inbox for next steps.
                                            </div>
                                        )}
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
                                                Or sign in with email
                                            </span>
                                        </div>
                                    </CardContent>

                                    <CardFooter className="mt-8 flex flex-col gap-4 border-t border-slate-200 p-0 pt-6 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            New here?{" "}
                                            <Link
                                                href="/sign-up"
                                                className="font-semibold text-cyan-600 transition-colors hover:text-cyan-700 dark:text-cyan-300 dark:hover:text-cyan-200"
                                            >
                                                Create account
                                            </Link>
                                        </p>

                                        <Button
                                            type="submit"
                                            disabled={isBusy}
                                            className="h-12 rounded-2xl bg-gradient-to-r from-cyan-600 to-teal-500 px-6 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:from-cyan-500 hover:to-teal-400"
                                        >
                                            {pending ? (
                                                <>
                                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                                    Signing in...
                                                </>
                                            ) : (
                                                <>
                                                    Sign in
                                                    <ArrowRight className="ml-2 size-4" />
                                                </>
                                            )}
                                        </Button>
                                    </CardFooter>
                                </motion.div>
                            </AnimatePresence>
                        </form>
                    </Card>
                </div>
            </div>
        </motion.section>
    )
}
