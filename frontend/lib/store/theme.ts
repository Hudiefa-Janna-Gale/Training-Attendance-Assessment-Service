import { createSlice, type Dispatch, type PayloadAction } from "@reduxjs/toolkit";

/** How the app picks its colours: always light, always dark, or whatever the device prefers. */
export type ThemeMode = "light" | "dark" | "system";

/** The cookie that remembers the choice. */
export const THEME_COOKIE = "theme";

/** In the order the theme switch lists them. */
export const THEME_MODES: { mode: ThemeMode; label: string; hint: string }[] = [
  { mode: "dark", label: "Dark", hint: "Dark colours" },
  { mode: "light", label: "Light", hint: "Light colours" },
  { mode: "system", label: "System", hint: "Follow this device" },
];

/** Anything other than a saved "light" or "dark" means: follow the device. */
export function parseThemeMode(value: string | null | undefined): ThemeMode {
  return value === "light" || value === "dark" ? value : "system";
}

/**
 * Runs in <head>, before the first paint: reads the saved theme from the cookie and puts it on
 * <html>. The page itself is static (it never reads the cookie on the server), so this is what
 * makes the right colours, and the right logo, appear with no flash.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var m=document.cookie.match(/(?:^|; )${THEME_COOKIE}=(light|dark|system)/);if(m)document.documentElement.setAttribute("data-theme",m[1])}catch(e){}})()`;

/** The saved theme, from a cookie string. */
export function readSavedTheme(cookie: string): ThemeMode {
  const match = cookie.match(new RegExp(`(?:^|; )${THEME_COOKIE}=([^;]*)`));
  return parseThemeMode(match?.[1]);
}

/** Puts a theme on the page and remembers it for next time. */
export function applyTheme(
  mode: ThemeMode,
  root: { setAttribute(name: string, value: string): void } = document.documentElement,
  writeCookie: (cookie: string) => void = (cookie) => {
    document.cookie = cookie;
  },
): void {
  root.setAttribute("data-theme", mode);
  writeCookie(`${THEME_COOKIE}=${mode}; path=/; max-age=31536000; samesite=lax`);
}

export interface ThemeState {
  mode: ThemeMode;
}

const themeSlice = createSlice({
  name: "theme",
  initialState: { mode: "system" } as ThemeState,
  reducers: {
    setThemeMode(state, action: PayloadAction<ThemeMode>) {
      state.mode = action.payload;
    },
  },
});

export const { setThemeMode } = themeSlice.actions;

/** What the theme switch dispatches: update the store, then the page and the cookie. */
export const chooseTheme = (mode: ThemeMode) => (dispatch: Dispatch) => {
  dispatch(setThemeMode(mode));
  applyTheme(mode);
};

export default themeSlice.reducer;
