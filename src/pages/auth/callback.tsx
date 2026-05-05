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
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.22),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(45,212,191,0.18),transparent_34%),linear-gradient(180deg,#020617_0%,#0f172a_100%)]" />
      <div className="relative w-full max-w-md rounded-3xl border border-white/20 bg-white/10 p-8 text-center text-slate-100 shadow-xl backdrop-blur-xl">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-cyan-300 border-t-transparent" />
        <h2 className="text-xl font-semibold">Finishing sign in</h2>
        <p className="mt-2 text-sm text-slate-300">We&apos;re opening your portfolio workspace now.</p>
      </div>
    </main>
  )
}
