"use client";

import { useState } from "react";
import { Provider } from "react-redux";
import { makeStore, type RootState } from "@/lib/store";

/** What the server rendered with: the theme is not known until the browser has read its cookie. */
const SERVER_STATE: RootState = { theme: { mode: "system" } };

/**
 * The app's Redux store. The page is prerendered without knowing the saved theme, so the first
 * render in the browser must match "system" (`serverState`, or hydration would see a mismatch);
 * ThemeSync then adopts the saved choice and the theme switch updates.
 */
export default function StoreProvider({ children }: { children: React.ReactNode }) {
  const [store] = useState(() => makeStore());
  return (
    <Provider store={store} serverState={SERVER_STATE}>
      {children}
    </Provider>
  );
}
