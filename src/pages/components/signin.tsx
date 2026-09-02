import { UserLogin } from "@/app/forms/signin.form";

export default function UserSignIn() {
    return (
        <main className="relative isolate min-h-screen overflow-hidden bg-slate-50 px-4 py-6 transition-colors duration-300 dark:bg-slate-950 sm:px-6 lg:px-8">
            <div className="pointer-events-none absolute left-1/2 top-14 h-72 w-72 -translate-x-1/2 rounded-full bg-cyan-400/10 blur-3xl dark:bg-cyan-400/20" />
            <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-teal-400/8 blur-3xl dark:bg-teal-400/15" />

            <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] max-w-lg items-center justify-center">
                <UserLogin />
            </div>
        </main>
    )
}