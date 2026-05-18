import { supabase } from "@/lib/db"
import { useStore } from "@/lib/store"
import { useRouter } from "next/router"
import { useEffect } from "react"

const enhancePhotoUrl = (url?: string | null) => {
    if (!url) return ""
    let enhancedUrl = url
    if (enhancedUrl.includes("googleusercontent.com")) {
        if (enhancedUrl.match(/=s\d+-c/)) {
            enhancedUrl = enhancedUrl.replace(/=s\d+-c/g, "=s800-c")
        } else if (!enhancedUrl.includes("=")) {
            enhancedUrl += "=s800-c"
        }
    } else if (enhancedUrl.includes("avatars.githubusercontent.com")) {
        if (!enhancedUrl.includes("s=")) {
            enhancedUrl = enhancedUrl.includes("?") ? `${enhancedUrl}&s=800` : `${enhancedUrl}?s=800`
        }
    }
    return enhancedUrl
}

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

      const signinIntent = typeof window !== "undefined" ? sessionStorage.getItem("oauth_signin_intent") : null
      const signupType = typeof window !== "undefined" ? sessionStorage.getItem("signup_profile_type") : null

      if (typeof window !== "undefined") {
        sessionStorage.removeItem("oauth_signin_intent")
      }

      // If profile already exists — existing user signing in
      if (profile) {
        if (typeof window !== "undefined") {
          const storedType = sessionStorage.getItem("signup_profile_type")
          if (storedType && (profile.type === "user" || !profile.type)) {
            await supabase
              .from("profiles")
              .update({ type: storedType })
              .eq("id", sessionUser.id)
            profile.type = storedType
          }
          sessionStorage.removeItem("signup_profile_type")
        }

        const meta = sessionUser.user_metadata ?? {}
        useStore.getState().addUser({
          id: sessionUser.id,
          username: profile?.username || meta.username || sessionUser.email?.split("@")[0] || "",
          email: sessionUser.email ?? "",
          photo: enhancePhotoUrl((meta.avatar_url as string) || (meta.picture as string) || ""),
          firstname: (meta.name as string) || (meta.full_name as string) || (meta.firstname as string) || "",
          lastname: "",
          role: profile?.role ?? (meta.role as string) ?? "Developer",
          description: profile?.description,
          gitlink: profile?.gitlink,
          likedlin: profile?.likedlin,
          resumelink: profile?.resumelink,
          phone: profile?.phone ?? "",
          password: profile?.password ?? "",
          show: profile?.show ?? true,
        })

        const pUsername = profile?.username?.trim()
        const pType = profile?.type
        const destination = pUsername
          ? pType === "business"
            ? `/b/${encodeURIComponent(pUsername)}`
            : pType === "team"
              ? `/t/${encodeURIComponent(pUsername)}`
              : `/u/${encodeURIComponent(pUsername)}`
          : "/"

        if (isActive) {
          void router.replace(destination)
        }
        return
      }

      // No profile exists — check intent
      if (signinIntent && !signupType) {
        // Came from sign-in page without an account — reject
        await supabase.auth.signOut()
        if (isActive) {
          void router.replace("/sign-up?error=no_account")
        }
        return
      }

      // Came from sign-up page — create the profile
      const meta = sessionUser.user_metadata ?? {}
      const rawPhoto = (meta.avatar_url as string) || (meta.picture as string) || ""
      const oauthFullName = (meta.name as string) || (meta.full_name as string) || (meta.firstname as string) || ""
      const enhancedPhoto = enhancePhotoUrl(rawPhoto)
      const generatedUsername = oauthFullName
        ? oauthFullName.replace(/[^a-zA-Z0-9]/g, "").toLowerCase().slice(0, 18)
        : sessionUser.email?.split("@")[0]?.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase().slice(0, 18) || "user"

      const storedType = typeof window !== "undefined" ? sessionStorage.getItem("signup_profile_type") : null
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("signup_profile_type")
      }

      const { data: createdProfile } = await supabase
        .from("profiles")
        .insert({
          id: sessionUser.id,
          email: sessionUser.email ?? "",
          username: generatedUsername,
          firstname: oauthFullName || "New",
          lastname: "",
          role: (meta.role as string) || "Developer",
          phone: "",
          photo: enhancedPhoto,
          password: "oauth-placeholder-password",
          show: true,
          type: storedType || "user",
        })
        .select("*")
        .single()

      if (!createdProfile) {
        await supabase.auth.signOut()
        if (isActive) {
          void router.replace("/sign-up?error=no_account")
        }
        return
      }

      useStore.getState().addUser({
        id: sessionUser.id,
        username: createdProfile.username,
        email: sessionUser.email ?? "",
        photo: enhancePhotoUrl(rawPhoto),
        firstname: oauthFullName,
        lastname: "",
        role: createdProfile.role ?? (meta.role as string) ?? "Developer",
        description: createdProfile.description,
        gitlink: createdProfile.gitlink,
        likedlin: createdProfile.likedlin,
        resumelink: createdProfile.resumelink,
        phone: createdProfile.phone ?? "",
        password: createdProfile.password ?? "",
        show: createdProfile.show ?? true,
      })

      const cUsername = createdProfile.username?.trim()
      const cType = createdProfile.type
      const destination = cUsername
        ? cType === "business"
          ? `/b/${encodeURIComponent(cUsername)}`
          : cType === "team"
            ? `/t/${encodeURIComponent(cUsername)}`
            : `/u/${encodeURIComponent(cUsername)}`
        : "/"

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
