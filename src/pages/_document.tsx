import { Html, Head, Main, NextScript } from "next/document";
import { ThemeProvider } from "@/app/components/theme-provider";
import { ModeToggle } from "@/app/components/mode-toggle";

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body className="antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="fixed top-4 right-4 z-50">
            <ModeToggle />
          </div>
          <Main />
          <NextScript />
        </ThemeProvider>
      </body>
    </Html>
  );
}
