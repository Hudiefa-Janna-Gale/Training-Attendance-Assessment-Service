import type { ExportSpec } from "./types";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const pad = (n: number) => String(n).padStart(2, "0");

/** "2026-09-21", for the file name (the local date). */
export function fileDate(now: Date): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** "21 Sep 2026, 15:42", for "Generated …" in the file. */
export function generatedLabel(now: Date): string {
  return `${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}, ${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

/** Ids and titles can hold anything; a file name keeps letters, digits, "-" and "_". */
export function safeName(text: string): string {
  return text.replace(/[^A-Za-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || "file";
}

export function fileNameFor(spec: ExportSpec, extension: "xlsx" | "pdf", now = new Date()): string {
  return `${safeName(spec.fileName)}-${fileDate(now)}.${extension}`;
}

/** "Workshop: technical; Day: Day 2", or "None". */
export function filtersLine(filters: ExportSpec["filters"]): string {
  return filters && filters.length > 0 ? filters.map(([name, value]) => `${name}: ${value}`).join("; ") : "None";
}

/** Excel column width, in characters, from the longest thing in the column. */
export function columnWidth(spec: ExportSpec, index: number): number {
  const longest = Math.max(
    spec.columns[index].header.length,
    ...spec.rows.map((row) => String(row[index] ?? "").length),
  );
  return Math.min(46, Math.max(10, longest + 3));
}

export type Tone = "ok" | "bad" | "warn";

/** Colours the words that carry a meaning, the same ones the screens colour. */
export function statusTone(value: string | number): Tone | undefined {
  switch (String(value).trim().toLowerCase()) {
    case "pass":
    case "present":
      return "ok";
    case "fail":
    case "absent":
      return "bad";
    case "excused":
    case "not saved yet":
      return "warn";
    default:
      return undefined;
  }
}

export const TONE_HEX: Record<Tone, string> = { ok: "0D7A50", bad: "BD3143", warn: "8F5F00" };

/**
 * The PDF's built-in fonts only draw Latin-1 (and a few Windows-1252 extras); anything else would
 * come out as garbage, so typographic punctuation is turned into its plain form and the rest into "?".
 */
export function pdfText(value: string | number): string {
  return String(value)
    .replace(/[–—−]/g, "-")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/…/g, "...")
    .replace(/ /g, " ")
    .replace(/[^ -~¡-ÿ]/g, "?");
}
