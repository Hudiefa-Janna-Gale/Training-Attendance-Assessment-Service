"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

export interface NavOption {
  value: string;
  label: string;
}

export interface NavGroup {
  label: string;
  options: NavOption[];
}

/**
 * A dropdown that drives one URL query parameter: choosing something reloads the page (a Server
 * Component) for that choice, so the view can be bookmarked or shared. `clear` names other
 * parameters that no longer make sense once this one changes (e.g. the participant when the
 * workshop changes).
 */
export default function NavSelect({
  param,
  label,
  value,
  placeholder,
  options = [],
  groups = [],
  disabled = false,
  clear = [],
}: {
  param: string;
  label: string;
  value: string;
  placeholder: string;
  options?: NavOption[];
  groups?: NavGroup[];
  disabled?: boolean;
  clear?: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const [pending, startTransition] = useTransition();

  function change(next: string) {
    const params = new URLSearchParams(search.toString());
    if (next) params.set(param, next);
    else params.delete(param);
    for (const key of clear) params.delete(key);
    const query = params.toString();
    startTransition(() => router.push(query ? `${pathname}?${query}` : pathname));
  }

  return (
    <label className="field">
      <span>{label}</span>
      <select
        className="input"
        value={value}
        disabled={disabled || pending}
        aria-busy={pending}
        onChange={(event) => change(event.target.value)}
      >
        <option value="" disabled={value !== ""}>
          {placeholder}
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
        {groups.map((g) => (
          <optgroup key={g.label} label={g.label}>
            {g.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </label>
  );
}
