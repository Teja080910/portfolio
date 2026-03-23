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
import { supabase } from "./api/supabaseclinet";

export default function App({ Component, pageProps }: AppProps) {
  const dataProvider = supabaseDataProvider(supabase);
  const router = useRouter();
  return (
    <RefineKbarProvider>
      <Refine
        dataProvider={dataProvider}
        notificationProvider={notificationProvider}
        authProvider={authProvider}
        resources={[
          { name: "posts", list: "/posts" },
          { name: "user", list: "/user" },
          { name: "signup", list: "/signup" }
        ]}
        options={{
          syncWithLocation: true,
          warnWhenUnsavedChanges: true,
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={router.asPath}
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
  );
}