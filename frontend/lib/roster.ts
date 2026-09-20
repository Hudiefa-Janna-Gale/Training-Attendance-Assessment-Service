import type { AttendanceEntry, AttendanceStatus } from "@/types/training";
import { naturalCompare } from "./format";

/** Ids the service accepts for participants: letters, digits, "-" and "_", up to 64. */
export const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

export function isValidId(value: string): boolean {
  return ID_PATTERN.test(value);
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

/** The session's saved attendance records as sheet rows, in natural id order. */
export function buildAttendanceRows(records: AttendanceEntry[]): AttendanceRow[] {
  return records
    .map((r) => ({ participantId: r.participant_id, status: r.status }))
    .sort((a, b) => naturalCompare(a.participantId, b.participantId));
}
