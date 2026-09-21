import type { AttendanceEntry, SessionAttendance } from "@/types/training";
import { call, callOrNull } from "./client";
import { PATTERNS } from "./patterns";

/** The attendance of a session; null when there is no such session. */
export function getAttendance(sessionId: string): Promise<SessionAttendance | null> {
  return callOrNull<SessionAttendance>(PATTERNS.getAttendance, { session_id: sessionId });
}

/** Records attendance: re-sending a participant corrects their status. */
export function recordAttendance(
  sessionId: string,
  records: AttendanceEntry[],
): Promise<SessionAttendance> {
  return call<SessionAttendance>(PATTERNS.recordAttendance, { session_id: sessionId, records });
}
