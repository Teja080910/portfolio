"use client"

import { getCurrentSession, setPostAuthRedirect } from "@/lib/auth-session"
import { getProxiedImageUrl } from "@/lib/image-proxy"
import { ITeamInvite } from "@/lib/interfaces"
import { acceptTeamInvite, getTeamInviteByToken } from "@/lib/teams"
import { motion } from "framer-motion"
import { AlertTriangle, CheckCircle2, Clock, Loader2, LogIn, Mail, ShieldX, Users } from "lucide-react"
import Head from "next/head"
import Link from "next/link"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"

type InviteState = "loading" | "ready" | "invalid" | "expired" | "used" | "revoked"

export default function InviteAccept() {
  const router = useRouter()
  const token = router.isReady && typeof router.query.token === "string" ? router.query.token : ""

  const [state, setState] = useState<InviteState>("loading")
  const [invite, setInvite] = useState<ITeamInvite | null>(null)
  const [signedIn, setSignedIn] = useState(false)
  const [sessionEmail, setSessionEmail] = useState<string | null>(null)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!token) return

    let active = true

    const load = async () => {
      const [inviteData, session] = await Promise.all([getTeamInviteByToken(token), getCurrentSession()])

      if (!active) return

      setInvite(inviteData)
      setSignedIn(Boolean(session.data.session?.user))
      setSessionEmail(session.data.session?.user?.email ?? null)

      if (!inviteData) {
        setState("invalid")
      } else if (inviteData.revoked) {
        setState("revoked")
      } else if (inviteData.acceptedAt) {
        setState("used")
      } else if (inviteData.valid === false) {
        setState("expired")
      } else {
        setState("ready")
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [token])

  const handleAccept = async () => {
    if (accepting) return
    setAccepting(true)
    setError("")

    const { slug, error: acceptError } = await acceptTeamInvite(token)

    setAccepting(false)

    if (acceptError) {
      setError(acceptError)
      return
    }

    if (slug) {
      void router.replace(`/t/${encodeURIComponent(slug)}/workspace`)
    }
  }

  const handleSignIn = () => {
    setPostAuthRedirect(`/invite/${token}`)
    void router.push("/sign-in")
  }

  const handleSwitchAccount = async () => {
    const { supabase } = await import("@/lib/db")
    await supabase.auth.signOut()
    setPostAuthRedirect(`/invite/${token}`)
    void router.replace("/sign-in")
  }

  const emailMismatch =
    Boolean(invite?.email && sessionEmail) &&
    (invite?.email ?? "").toLowerCase() !== (sessionEmail ?? "").toLowerCase()

  const teamLogo = invite?.team ? getProxiedImageUrl(invite.team.logo) : null

  return (
    <>
      <Head>
        <title>Team Invitation | folio</title>
        <meta name="description" content="Accept your team invitation on folio." />
      </Head>

      <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden px-6 py-24 transition-colors duration-300">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(20,184,166,0.14),transparent_26%)]" />
        <div className="pointer-events-none absolute left-1/2 top-10 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />

        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="relative w-full max-w-md rounded-3xl border border-border/50 bg-card/70 p-8 text-center shadow-2xl backdrop-blur-xl"
        >
          {state === "loading" && (
            <>
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <h1 className="text-xl font-semibold text-foreground">Checking invitation</h1>
              <p className="mt-2 text-sm text-muted-foreground">One moment while we verify your invite link...</p>
            </>
          )}

          {state === "invalid" && (
            <>
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500">
                <ShieldX className="h-7 w-7" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Invalid invitation</h1>
              <p className="mt-3 text-sm text-muted-foreground">
                This invite link is not valid. Ask the team owner to send a new invitation.
              </p>
              <Link
                href="/"
                className="mt-8 inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition-all hover:-translate-y-0.5"
              >
                Go to Homepage
              </Link>
            </>
          )}

          {state === "used" && (
            <>
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Invite already used</h1>
              <p className="mt-3 text-sm text-muted-foreground">
                This invitation has already been accepted. If that was you, open the team workspace below.
              </p>
              {invite?.team && (
                <Link
                  href={`/t/${encodeURIComponent(invite.team.slug)}`}
                  className="mt-8 inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition-all hover:-translate-y-0.5"
                >
                  Open {invite.team.name}
                </Link>
              )}
            </>
          )}

          {state === "revoked" && (
            <>
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500">
                <AlertTriangle className="h-7 w-7" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Invitation revoked</h1>
              <p className="mt-3 text-sm text-muted-foreground">
                The team owner revoked this invitation. Ask them for a new invite link.
              </p>
            </>
          )}

          {state === "expired" && (
            <>
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
                <Clock className="h-7 w-7" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Invitation expired</h1>
              <p className="mt-3 text-sm text-muted-foreground">
                This invite link has expired. Ask the team owner to send a fresh one.
              </p>
            </>
          )}

          {state === "ready" && invite?.team && (
            <>
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-cyan-500 to-teal-500 text-2xl font-bold text-white shadow-lg">
                {teamLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={teamLogo} alt={invite.team.name} className="h-full w-full object-cover" />
                ) : (
                  invite.team.name.charAt(0).toUpperCase()
                )}
              </div>

              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                <Users className="h-3.5 w-3.5" />
                Team invitation
              </span>

              <h1 className="mt-4 text-2xl font-bold text-foreground">Join {invite.team.name}</h1>
              <p className="mt-3 text-sm text-muted-foreground">
                You were invited to join this team on folio. Your personal portfolio stays yours — you choose which work
                to share with the team.
              </p>

              {invite.email && (
                <p className="mt-4 inline-flex items-center gap-2 rounded-xl bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" />
                  Invited as {invite.email}
                </p>
              )}

              {emailMismatch && (
                <div className="mt-4 rounded-xl border border-amber-300/60 bg-amber-50/80 px-4 py-3 text-left text-xs text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
                  You are signed in as <strong>{sessionEmail}</strong>, but this invite was sent to{" "}
                  <strong>{invite.email}</strong>.
                  <button
                    type="button"
                    onClick={handleSwitchAccount}
                    className="mt-2 block font-semibold underline underline-offset-2"
                  >
                    Sign in with a different account
                  </button>
                </div>
              )}

              {error && (
                <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-950/30 dark:text-rose-300">
                  {error}
                </div>
              )}

              <div className="mt-7 flex flex-col gap-3">
                {signedIn ? (
                  <button
                    type="button"
                    onClick={handleAccept}
                    disabled={accepting}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {accepting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    {accepting ? "Joining..." : "Accept invitation"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSignIn}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5"
                  >
                    <LogIn className="h-4 w-4" />
                    Sign in to accept
                  </button>
                )}
                <Link
                  href="/"
                  className="text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
                >
                  Not now, take me home
                </Link>
              </div>
            </>
          )}
        </motion.div>
      </main>
    </>
  )
}
