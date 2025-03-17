import "@/styles/globals.css";
import { authProvider } from "@/utils/middleware/authMiddleware";
import { notificationProvider } from "@refinedev/antd";
import "@refinedev/antd/dist/reset.css";
import { Refine } from "@refinedev/core";
import { RefineKbarProvider } from "@refinedev/kbar";
import { dataProvider as supabaseDataProvider } from "@refinedev/supabase";
import "antd/dist/reset.css";
import type { AppProps } from "next/app";
import { supabase } from "./api/supabaseclinet";

export default function App({ Component, pageProps }: AppProps) {
  const dataProvider = supabaseDataProvider(supabase);
  return (
    <RefineKbarProvider>
      <Refine
        dataProvider={dataProvider}
        notificationProvider={notificationProvider}
        authProvider={authProvider}
        resources={[
          { name: "posts", list: "/posts" },
        ]}
        options={{
          syncWithLocation: true,
          warnWhenUnsavedChanges: true,
        }}
      >
        <Component {...pageProps} />
      </Refine>
    </RefineKbarProvider>
  );
}