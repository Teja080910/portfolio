import AuthActions from "@/app/components/auth-actions";
import { ThemeProvider } from "@/app/components/theme-provider";
import "@/styles/globals.css";
import { authProvider } from "@/utils/middleware/authMiddleware";
import { notificationProvider } from "@refinedev/antd";
import "@refinedev/antd/dist/reset.css";
import { Refine } from "@refinedev/core";
import { RefineKbarProvider } from "@refinedev/kbar";
import { dataProvider as supabaseDataProvider } from "@refinedev/supabase";
import "antd/dist/reset.css";
import { AnimatePresence, motion } from "framer-motion";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import { useMemo, useState, useEffect } from "react";
import { supabase } from "@/lib/db";

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
        <Refine
          dataProvider={dataProvider}
          notificationProvider={notificationProvider}
          authProvider={authProvider}
          resources={resources}
          options={refineOptions}
        >
          {!isAuthRoute && (
            <div className="fixed right-4 top-4 z-[60]">
              <AuthActions />
            </div>
          )}

          <AnimatePresence mode="wait" initial={false} onExitComplete={() => window.scrollTo(0, 0)}>
            <motion.div
              key={router?.asPath || "initial"}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
            >
              <Component {...pageProps} />
            </motion.div>
          </AnimatePresence>
        </Refine>
      </RefineKbarProvider>
    </ThemeProvider>
  );
}
