import type { Metadata, Viewport } from "next";
import "@fontsource-variable/figtree";
import "@fontsource-variable/bricolage-grotesque";
import "./globals.css";
import StoreProvider from "@/components/theme/StoreProvider";
import ThemeScript from "@/components/theme/ThemeScript";
import ThemeSync from "@/components/theme/ThemeSync";

export const metadata: Metadata = {
  title: "Training Hub",
  description: "Training sessions, daily attendance, assessments and final PASS/FAIL results",
  // The SOMNOG favicon, and its white-lettered copy for dark browser tab strips.
  icons: {
    icon: [
      { url: "/images/somnogFivIcon.png", type: "image/png", media: "(prefers-color-scheme: light)" },
      { url: "/images/somnogFivIconDark.png", type: "image/png", media: "(prefers-color-scheme: dark)" },
    ],
    apple: "/images/somnogFivIcon.png",
  },
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f8fb" },
    { media: "(prefers-color-scheme: dark)", color: "#0a1219" },
  ],
};

/**
 * The shell is static: it never reads the cookie on the server, so the page can be prerendered once
 * and only the data streams in per request. The saved theme is put on <html> by the inline script
 * before the first paint (hence suppressHydrationWarning: the script changes the attribute).
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="system" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body>
        <StoreProvider>
          <ThemeSync />
          {children}
        </StoreProvider>
      </body>
    </html>
  );
}
