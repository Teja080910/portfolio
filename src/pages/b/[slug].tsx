import { useRouter } from "next/router"

export default function BusinessProfilePlaceholderPage() {
  const router = useRouter()
  const slug = typeof router.query.slug === "string" ? router.query.slug : ""

  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.22),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(20,184,166,0.2),transparent_34%),linear-gradient(180deg,#020617_0%,#0f172a_100%)]" />
      <div className="relative w-full max-w-2xl rounded-3xl border border-white/20 bg-white/10 p-8 text-center text-slate-100 shadow-xl backdrop-blur-xl md:p-12">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Business Profile Setup</p>
        <h1 className="mt-4 text-3xl font-semibold md:text-4xl">/b/{slug || "your-business"}</h1>
        <p className="mt-4 text-slate-300">
          Basic business route is ready. You can now open URLs like <span className="font-semibold text-cyan-200">/b/ast</span> and later add
          business-specific features.
        </p>
      </div>
    </main>
  )
}
