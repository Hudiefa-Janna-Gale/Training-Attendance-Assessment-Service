"use client";

import { useEffect, useId, useRef, useState } from "react";
import { MonitorIcon, MoonIcon, SunIcon } from "@/components/training/Icons";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { chooseTheme, THEME_MODES, type ThemeMode } from "@/lib/store/theme";

const ICONS: Record<ThemeMode, React.ReactNode> = {
  light: <SunIcon />,
  dark: <MoonIcon />,
  system: <MonitorIcon />,
};

/**
 * The theme switch: a small tab on the edge of the sidebar that shows the current theme and opens
 * to Dark / Light / System. The choice lives in the Redux store; `chooseTheme` also puts it on the
 * page and remembers it. On a phone (`strip`) it is a round button in the strip above the page.
 *
 * The page is prerendered without knowing the saved theme, so which icon shows and which option is
 * highlighted come from the theme on <html> (the CSS), which is right from the first paint; the
 * store only adds the accessible state once the page is running.
 */
export default function ThemeDock({ placement }: { placement: "edge" | "strip" }) {
  const mode = useAppSelector((state) => state.theme.mode);
  const dispatch = useAppDispatch();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  // Close on a click elsewhere or on Escape.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      handleRef.current?.focus();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const current = THEME_MODES.find((m) => m.mode === mode) ?? THEME_MODES[0];

  return (
    <div ref={rootRef} className={`theme-dock theme-dock--${placement}`} data-open={open}>
      <button
        ref={handleRef}
        type="button"
        className="theme-dock-handle"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`Theme: ${current.label}. Change theme`}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="theme-dock-icons" aria-hidden="true">
          {THEME_MODES.map(({ mode: value }) => (
            <span key={value} data-icon={value}>
              {ICONS[value]}
            </span>
          ))}
        </span>
        <span className="theme-dock-title">Theme</span>
      </button>

      <div id={menuId} className="theme-dock-menu" role="group" aria-label="Colour theme" hidden={!open}>
        {THEME_MODES.map(({ mode: value, label, hint }) => (
          <button
            key={value}
            type="button"
            data-mode={value}
            aria-pressed={mode === value}
            title={hint}
            onClick={() => {
              dispatch(chooseTheme(value));
              setOpen(false);
              handleRef.current?.focus();
            }}
          >
            {ICONS[value]}
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
