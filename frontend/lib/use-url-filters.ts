"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

/**
 * Filters for one table. They change instantly (the values are plain state, nothing goes back to
 * the server) and they are also written to the address bar, so a link to the page carries them.
 * `empty` lists the filter names with their "not set" value; only those names are touched, so the
 * page's other parameters (a chosen session, say) are left alone.
 */
export function useUrlFilters<T extends Record<string, string>>(empty: T) {
  const search = useSearchParams();
  const pathname = usePathname();

  // Start from the address, so a shared link opens already filtered.
  const [values, setValues] = useState<T>(
    () => Object.fromEntries(Object.keys(empty).map((key) => [key, search.get(key) ?? ""])) as T,
  );

  const remember = useCallback(
    (next: T) => {
      const params = new URLSearchParams(window.location.search);
      for (const key of Object.keys(empty)) {
        if (next[key]) params.set(key, next[key]);
        else params.delete(key);
      }
      const query = params.toString();
      window.history.replaceState(null, "", query ? `${pathname}?${query}` : pathname);
    },
    [empty, pathname],
  );

  const change = useCallback(
    (patch: Partial<T>) => {
      const next = { ...values, ...patch } as T;
      setValues(next);
      remember(next);
    },
    [values, remember],
  );

  const clear = useCallback(() => {
    const next = { ...empty };
    setValues(next);
    remember(next);
  }, [empty, remember]);

  /** A link to this page that keeps these filters and adds `extra` parameters. */
  const href = useCallback(
    (extra: Record<string, string>) => {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(values)) if (value) params.set(key, value);
      for (const [key, value] of Object.entries(extra)) params.set(key, value);
      return `${pathname}?${params.toString()}`;
    },
    [values, pathname],
  );

  return { values, change, clear, href };
}
