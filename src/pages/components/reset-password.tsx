import { ResetPasswordForm } from "@/app/forms/reset-password.form"

export default function ResetPasswordPage() {
  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-slate-950 px-4 py-6 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.22),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(45,212,191,0.18),transparent_34%),linear-gradient(180deg,#020617_0%,#0f172a_100%)]" />
      <div className="pointer-events-none absolute left-1/2 top-14 h-72 w-72 -translate-x-1/2 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-teal-400/15 blur-3xl" />

      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl items-center justify-center">
        <ResetPasswordForm />
      </div>
    </main>
  )
}
