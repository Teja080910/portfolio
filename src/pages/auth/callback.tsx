import { supabase } from "@/lib/db"
import { useStore } from "@/lib/store"
import { useRouter } from "next/router"
import { useEffect } from "react"

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    let isActive = true

    const resolveRedirect = async () => {
      const { data } = await supabase.auth.getSession()
      const sessionUser = data.session?.user

      if (!sessionUser) {
        if (isActive) {
          void router.replace("/sign-in")
        }
        return
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", sessionUser.id)
        .maybeSingle()

      if (profile) {
        useStore.getState().addUser({
          id: profile.id,
          username: profile.username ?? "",
          email: profile.email ?? "",
          photo: profile.photo,
          firstname: profile.firstname ?? "",
          lastname: profile.lastname ?? "",
          role: profile.role ?? "",
          description: profile.description,
          gitlink: profile.gitlink,
          likedlin: profile.likedlin,
          resumelink: profile.resumelink,
          phone: profile.phone ?? "",
          password: profile.password ?? "",
          show: profile.show ?? true,
        })
      }

      const destination = profile?.username?.trim() ? `/u/${encodeURIComponent(profile.username.trim())}` : "/"

      if (isActive) {
        void router.replace(destination)
      }
    }

    void resolveRedirect()

    return () => {
      isActive = false
    }
  }, [router])

  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden px-6 transition-colors duration-300">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(20,184,166,0.12),transparent_24%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.22),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(45,212,191,0.18),transparent_34%)]" />
      <div className="relative w-full max-w-md rounded-3xl border border-slate-200/70 bg-white/80 p-8 text-center text-slate-900 shadow-xl backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/70 dark:text-slate-100">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent dark:border-cyan-300" />
        <h2 className="text-xl font-semibold">Finishing sign in</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">We&apos;re opening your portfolio workspace now.</p>
      </div>
    </main>
  )
}
