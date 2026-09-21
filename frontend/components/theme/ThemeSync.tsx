"use client";

import { useLayoutEffect } from "react";
import { useAppDispatch } from "@/lib/store/hooks";
import { readSavedTheme, setThemeMode } from "@/lib/store/theme";

/**
 * The page is static, so the server cannot know the saved theme. The inline script in <head> puts
 * it on <html> before the first paint; this hands the same choice to the Redux store (and puts it
 * back on <html> if React's development remount cleared it), so the theme switch shows the truth.
 */
export default function ThemeSync() {
  const dispatch = useAppDispatch();

  useLayoutEffect(() => {
    const saved = readSavedTheme(document.cookie);
    document.documentElement.setAttribute("data-theme", saved);
    dispatch(setThemeMode(saved));
  }, [dispatch]);

  return null;
}
