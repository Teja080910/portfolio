import AuthActions from "@/app/components/auth-actions";
import { CursorTrail } from "@/app/components/cursor-trail";
import SettingsModal from "@/app/components/settings-modal";
import OnboardingModal from "@/app/components/onboarding-modal";
import { PopupProvider } from "@/app/components/popup";
import { ToastProvider } from "@/app/components/toast";
import { ThemeProvider } from "@/app/components/theme-provider";
import { supabase } from "@/lib/db";
import "@/styles/globals.css";
import { authProvider } from "@/utils/middleware/authMiddleware";
import { notificationProvider } from "@refinedev/antd";
import "@refinedev/antd/dist/reset.css";
import { Refine } from "@refinedev/core";
import { RefineKbarProvider } from "@refinedev/kbar";
import { dataProvider as supabaseDataProvider } from "@refinedev/supabase";
import "antd/dist/reset.css";
import type { AppProps } from "next/app";
import Link from "next/link";
import { BookOpen, Settings } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";

export default function App({ Component, pageProps }: AppProps) {
  const dataProvider = useMemo(() => supabaseDataProvider(supabase), []);
  const resources = useMemo(
    () => [
      { name: "posts", list: "/posts" },
      { name: "guide", list: "/guide" }
    ],
    [],
  );
  const refineOptions = useMemo(
    () => ({
      syncWithLocation: true,
      warnWhenUnsavedChanges: true,
    }),
    [],
  );
  const router = useRouter();
  const [isAuthRoute, setIsAuthRoute] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingData, setOnboardingData] = useState<{ username: string; email: string; firstname: string } | null>(null);
  const settingsMounted = useRef(false);

  useEffect(() => {
    if (!settingsMounted.current) {
      settingsMounted.current = true
      return
    }
    setShowSettings(false)
  }, [router.pathname]);

  useEffect(() => {
    if (router?.isReady) {
      setIsAuthRoute(["/sign-in", "/reset-password"].includes(router.pathname || ""));
    }
  }, [router?.isReady, router?.pathname]);

  useEffect(() => {
    if (typeof window === "undefined" || !router?.isReady) return

    const params = new URLSearchParams(window.location.search)
    if (params.get("onboarding") === "true") {
      supabase.auth.getUser().then(({ data }) => {
        const user = data.user
        if (!user) return

        const meta = user.user_metadata ?? {}
        setOnboardingData({
          username: user.email?.split("@")[0] || "",
          email: user.email || "",
          firstname: (meta.name as string) || (meta.full_name as string) || "",
        })
        setShowSettings(true)
        setShowOnboarding(true)

        params.delete("onboarding")
        const next = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}${window.location.hash}`
        window.history.replaceState({}, "", next)
      })
    }
  }, [router?.isReady])
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <RefineKbarProvider>
        <PopupProvider>
        <ToastProvider>
        <Refine
          dataProvider={dataProvider}
          notificationProvider={notificationProvider}
          authProvider={authProvider}
          resources={resources}
          options={refineOptions}
        >
          <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.08),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(20,184,166,0.06),transparent_24%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.22),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(45,212,191,0.18),transparent_34%),linear-gradient(180deg,#020617_0%,#0f172a_100%)]" />

          <CursorTrail />

          {!isAuthRoute && (
            <>
              <div className="fixed left-4 top-4 z-[60] flex items-center gap-2">
                <Link
                  href="/guide"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300/80 bg-white/90 shadow-sm backdrop-blur transition-all hover:bg-white hover:shadow-md dark:border-slate-700 dark:bg-slate-900/85 dark:hover:bg-slate-800"
                  title="Guide"
                >
                  <BookOpen className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                </Link>
                <button
                  onClick={() => setShowSettings(true)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300/80 bg-white/90 shadow-sm backdrop-blur transition-all hover:bg-white hover:shadow-md dark:border-slate-700 dark:bg-slate-900/85 dark:hover:bg-slate-800"
                  title="Settings"
                >
                  <Settings className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                </button>
              </div>
              <div className="fixed right-4 top-4 z-[60]">
                <AuthActions />
              </div>
            </>
          )}

          <Component {...pageProps} />

          <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} />
          {showOnboarding && onboardingData && (
            <OnboardingModal
              username={onboardingData.username}
              email={onboardingData.email}
              firstname={onboardingData.firstname}
            />
          )}
        </Refine>
        </ToastProvider>
        </PopupProvider>
      </RefineKbarProvider>
    </ThemeProvider>
  );
}
