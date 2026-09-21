import type { Option } from "./catalog";
import { suggestId } from "./roster";

/** One line in the open list of a combobox. */
export interface ComboRow extends Option {
  /** A value this service has not seen yet; choosing it keeps what was typed (or its tidied-up form). */
  isNew?: boolean;
}

export interface ComboView {
  rows: ComboRow[];
  /** A short line under the rows: how to add a new value, or why nothing matched. */
  note: string | null;
}

/** Does the text satisfy an HTML `pattern`, which has to match the whole value? */
export function fitsPattern(text: string, pattern?: string): boolean {
  if (!pattern) return true;
  try {
    return new RegExp(`^(?:${pattern})$`).test(text);
  } catch {
    return true; // a pattern JavaScript cannot read: leave the check to the browser and the API
  }
}

/**
 * What the open list of a combobox shows for what has been typed: the known values that match, and,
 * when new values are allowed, a "create" row for what was typed (tidied up if it is not a valid id).
 */
export function comboView({
  options,
  query,
  noun,
  pattern,
  patternHint,
  suggest = suggestId,
}: {
  options: Option[];
  /** What was typed; null or blank shows every option. */
  query: string | null;
  /** What a new value is called ("workshop"). Leave it out when only the listed shape is allowed. */
  noun?: string;
  pattern?: string;
  /** The pattern in words. */
  patternHint?: string;
  /** Makes a valid value out of what was typed ("day 5" → "5"); "" when nothing usable is left. */
  suggest?: (typed: string) => string;
}): ComboView {
  const typed = query?.trim() ?? "";
  if (typed === "") {
    return { rows: options, note: noun && options.length > 0 ? `Not in the list? Type a new ${noun}.` : null };
  }

  const needle = typed.toLowerCase();
  const rows: ComboRow[] = options.filter((o) =>
    `${o.value} ${o.description ?? ""}`.toLowerCase().includes(needle),
  );
  if (options.some((o) => o.value === typed)) return { rows, note: null };

  if (!noun) return { rows, note: rows.length === 0 ? `No match. ${patternHint ?? ""}`.trim() : null };

  if (fitsPattern(typed, pattern)) {
    return {
      rows: [...rows, { value: typed, description: `New ${noun}, added when you save`, isNew: true }],
      note: null,
    };
  }

  // Not something the service accepts as it is (a name with spaces, say): offer the closest valid value.
  const tidy = suggest(typed);
  const note = patternHint ?? null;
  const known = options.find((o) => o.value === tidy);
  if (known) return { rows: rows.includes(known) ? rows : [...rows, known], note };
  if (tidy === "" || !fitsPattern(tidy, pattern)) return { rows, note };
  return {
    rows: [...rows, { value: tidy, description: `New ${noun}, from “${typed}”`, isNew: true }],
    note,
  };
}
