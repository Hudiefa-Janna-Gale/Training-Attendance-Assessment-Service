"use client";

import { THEME_INIT_SCRIPT } from "@/lib/store/theme";

/**
 * The inline script that puts the saved theme on <html> before the first paint. It is a script
 * only in the HTML the server sends; when React renders it in the browser it is inert text (React
 * warns about scripts it creates itself, and this one has already run by then).
 */
export default function ThemeScript() {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
    />
  );
}
