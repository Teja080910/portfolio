import { UserRegistrationForm } from "@/app/forms/signup.form"
import { AlertCircle } from "lucide-react"
import { useRouter } from "next/router"

export default function UserRegister() {
  const router = useRouter()
  const noAccountError = router.query.error === "no_account"

  return (
        <main className="relative isolate min-h-screen overflow-hidden bg-slate-50 px-4 py-6 transition-colors duration-300 dark:bg-slate-950 sm:px-6 lg:px-8">
            <div className="pointer-events-none absolute left-1/2 top-14 h-72 w-72 -translate-x-1/2 rounded-full bg-cyan-400/20 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-teal-400/15 blur-3xl" />

      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl items-center justify-center">
        <div className="w-full max-w-6xl">
          {noAccountError && (
            <div className="mb-4 flex items-center gap-3 rounded-2xl border border-orange-200 bg-orange-50/90 px-5 py-4 text-sm text-orange-700 dark:border-orange-500/30 dark:bg-orange-950/20 dark:text-orange-300">
              <AlertCircle className="size-5 shrink-0" />
              <span>
                No account found for this Google/GitHub profile. Please sign up first to create your portfolio.
              </span>
            </div>
          )}
          <UserRegistrationForm />
        </div>
      </div>
    </main>
  )
}
