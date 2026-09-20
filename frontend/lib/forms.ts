import type { AttendanceEntry, AttendanceStatus } from "@/types/training";

const STATUSES: readonly string[] = ["present", "absent", "excused"];

/** Trimmed string value of a form field ("" when missing). */
export function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/** Same as text(), but undefined for blank so optional API fields can be left out. */
export function optionalText(formData: FormData, key: string): string | undefined {
  return text(formData, key) || undefined;
}

/** Whole number from a field, undefined when blank, NaN when not a number. */
export function optionalInt(formData: FormData, key: string): number | undefined {
  const raw = text(formData, key);
  if (raw === "") return undefined;
  return /^-?\d+$/.test(raw) ? Number(raw) : Number.NaN;
}

/** "08:00" + "09:30" → "08:00–09:30" (the en dash the service uses). */
export function composeTimeSlot(start: string, end: string): string {
  return `${start}–${end}`;
}

/** Collects `status:<participant_id>` radio values into API entries. */
export function parseAttendanceForm(formData: FormData): AttendanceEntry[] {
  const entries: AttendanceEntry[] = [];
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("status:") || typeof value !== "string") continue;
    if (!STATUSES.includes(value)) continue;
    entries.push({ participant_id: key.slice("status:".length), status: value as AttendanceStatus });
  }
  return entries;
}
