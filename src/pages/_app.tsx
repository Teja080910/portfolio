import AuthActions from "@/app/components/auth-actions";
import { CursorTrail } from "@/app/components/cursor-trail";
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
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";

export default function App({ Component, pageProps }: AppProps) {
  const dataProvider = useMemo(() => supabaseDataProvider(supabase), []);
  const resources = useMemo(
    () => [
      { name: "posts", list: "/posts" },
      { name: "user", list: "/user" },
      { name: "signup", list: "/signup" }
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

  useEffect(() => {
    if (router?.isReady) {
      setIsAuthRoute(["/sign-in", "/sign-up", "/reset-password"].includes(router.pathname || ""));
    }
  }, [router?.isReady, router?.pathname]);
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
            <div className="fixed right-4 top-4 z-[60]">
              <AuthActions />
            </div>
          )}

          <Component {...pageProps} />
        </Refine>
        </ToastProvider>
        </PopupProvider>
      </RefineKbarProvider>
    </ThemeProvider>
  );
}
