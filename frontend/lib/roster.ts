import type { AttendanceEntry, AttendanceStatus } from "@/types/training";
import { naturalCompare } from "./format";

/** Ids the service accepts for participants: letters, digits, "-" and "_", up to 64. */
export const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

/** The same rule in words, for the message next to a field. */
export const ID_RULE = "IDs use letters, digits, “-” and “_” only (no spaces), up to 64 characters.";

export function isValidId(value: string): boolean {
  return ID_PATTERN.test(value);
}

/**
 * Turns something typed like a name ("Technical Skills") into an id the service accepts
 * ("Technical-Skills"). Returns "" when nothing usable is left.
 */
export function suggestId(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // é → e
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^A-Za-z0-9_-]/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 64)
    .replace(/^-+|-+$/g, "");
}

/**
 * Participants belong to another service and this one has no roster endpoint, so
 * participant ids are typed in. Accepts one id or several separated by commas,
 * spaces or new lines (e.g. pasted from a list).
 */
export function parseParticipantIds(input: string): { ids: string[]; invalid: string[] } {
  const tokens = input.split(/[\s,;]+/).filter(Boolean);
  const ids: string[] = [];
  const invalid: string[] = [];
  for (const token of tokens) {
    if (!isValidId(token)) invalid.push(token);
    else if (!ids.includes(token)) ids.push(token);
  }
  return { ids, invalid };
}

export interface AttendanceRow {
  participantId: string;
  /** null = added on this screen, not saved yet */
  status: AttendanceStatus | null;
}

/**
 * The sheet for one session: its saved records, plus everyone else the workshop has seen (from its
 * other sessions and scores) who has no record here yet. Natural id order.
 */
export function buildAttendanceRows(
  records: AttendanceEntry[],
  knownParticipants: string[] = [],
): AttendanceRow[] {
  const saved = new Map(records.map((r) => [r.participant_id, r.status]));
  return [...new Set([...knownParticipants, ...saved.keys()])]
    .sort(naturalCompare)
    .map((participantId) => ({ participantId, status: saved.get(participantId) ?? null }));
}
