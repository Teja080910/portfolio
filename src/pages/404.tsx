import Link from "next/link"
import { Compass, Home, SearchX } from "lucide-react"

export default function NotFoundPage() {
  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden px-6 py-16 transition-colors duration-300">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(20,184,166,0.12),transparent_24%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.2),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(45,212,191,0.16),transparent_34%)]" />
      <div className="pointer-events-none absolute left-1/2 top-10 h-72 w-72 -translate-x-1/2 rounded-full bg-cyan-400/10 blur-3xl dark:bg-cyan-400/15" />

      <section className="relative z-10 w-full max-w-xl rounded-[2rem] border border-slate-200/70 bg-white/80 p-8 text-center text-slate-900 shadow-2xl backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/70 dark:text-white sm:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-300">
          <SearchX className="h-8 w-8" />
        </div>

        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.24em] text-cyan-600 dark:text-cyan-300">404</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">No route found</h1>
        <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
          The page you’re looking for doesn&apos;t exist, or the link may be broken.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-600 to-teal-500 px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:from-cyan-500 hover:to-teal-400"
          >
            <Home className="h-4 w-4" />
            Back to Explore
          </Link>

          <Link
            href="/sign-in"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300/70 bg-white/70 px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-white dark:border-white/20 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
          >
            <Compass className="h-4 w-4" />
            Sign In
          </Link>
        </div>
      </section>
    </main>
  )
}
