"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/db"
import { getFriendlySupabaseError } from "@/utils/supabase-error"
import { cn } from "@/lib/utils"
import { AnimatePresence, motion } from "framer-motion"
import { Github, Loader2 } from "lucide-react"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"

export function UserLogin({ className }: React.ComponentProps<typeof Card>) {
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [oauthPending, setOauthPending] = useState<"google" | "github" | null>(null)
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

    const isBusy = Boolean(oauthPending)

    if (isAuthenticated) {
        return null
    }

    return (
        <motion.section
            className={cn(
                "w-full max-w-md overflow-hidden rounded-[2rem] border border-white/50 bg-white/75 p-8 shadow-[0_30px_120px_rgba(15,23,42,0.25)] backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-950/55 sm:p-10",
                className,
            )}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
        >
                    <Card className="border-none bg-transparent shadow-none">
                        <CardHeader className="p-0 pb-8">
                            <CardTitle className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">Sign in</CardTitle>
                            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                                Sign in with your Google or GitHub account to access your portfolio workspace.
                            </p>
                        </CardHeader>

                        <CardContent className="space-y-6 p-0">
                            {errors.form && (
                                <div className="rounded-2xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-950/20 dark:text-red-300">
                                    {errors.form}
                                </div>
                            )}

                            <AnimatePresence mode="wait">
                                <motion.div key="social-buttons" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                                    <div className="space-y-3">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            disabled={isBusy}
                                            onClick={() => handleSocialAuth("google")}
                                            className="h-12 w-full rounded-2xl border-slate-200 text-slate-700 transition-all duration-300 hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700 dark:border-slate-700 dark:text-slate-200 dark:hover:border-cyan-500 dark:hover:bg-cyan-950/30 dark:hover:text-cyan-300"
                                        >
                                            {oauthPending === "google" ? (
                                                <Loader2 className="size-4 animate-spin" />
                                            ) : (
                                                <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
                                                    <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.2-.9 2.3-1.9 3l3 2.3c1.8-1.6 2.8-4 2.8-6.8 0-.7-.1-1.4-.2-2H12z" />
                                                    <path fill="#34A853" d="M12 22c2.7 0 4.9-.9 6.6-2.4l-3-2.3c-.8.6-2 .9-3.5.9-2.7 0-4.9-1.8-5.7-4.2l-3.1 2.4C5 19.7 8.2 22 12 22z" />
                                                    <path fill="#4A90E2" d="M6.3 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2L3.2 7.6C2.4 9.1 2 10.5 2 12s.4 2.9 1.2 4.4L6.3 14z" />
                                                    <path fill="#FBBC05" d="M12 5.8c1.5 0 2.8.5 3.9 1.5l2.9-2.9C16.9 2.6 14.7 2 12 2 8.2 2 5 4.3 3.2 7.6L6.3 10c.8-2.4 3-4.2 5.7-4.2z" />
                                                </svg>
                                            )}
                                            Continue with Google
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            disabled={isBusy}
                                            onClick={() => handleSocialAuth("github")}
                                            className="h-12 w-full rounded-2xl border-slate-200 text-slate-700 transition-all duration-300 hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700 dark:border-slate-700 dark:text-slate-200 dark:hover:border-cyan-500 dark:hover:bg-cyan-950/30 dark:hover:text-cyan-300"
                                        >
                                            {oauthPending === "github" ? <Loader2 className="size-4 animate-spin" /> : <Github className="size-4" />}
                                            Continue with GitHub
                                        </Button>
                                    </div>
                                </motion.div>
                            </AnimatePresence>

                            <p className="text-center text-xs text-slate-400 dark:text-slate-500">
                                New to Folio? Simply sign in with Google or GitHub and your account will be created automatically.
                            </p>
                        </CardContent>
                    </Card>
        </motion.section>
    )
}
