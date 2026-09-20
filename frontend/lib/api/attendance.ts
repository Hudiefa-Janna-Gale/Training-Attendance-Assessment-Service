import type { AttendanceEntry, SessionAttendance } from "@/types/training";
import { apiFetch, apiFetchOrNull } from "./client";

/** GET /sessions/:id/attendance — null when there is no such session. */
export function getAttendance(sessionId: string): Promise<SessionAttendance | null> {
  return apiFetchOrNull<SessionAttendance>(`/sessions/${encodeURIComponent(sessionId)}/attendance`);
}

/** POST /sessions/:id/attendance — re-sending a participant corrects their status. */
export function recordAttendance(
  sessionId: string,
  records: AttendanceEntry[],
): Promise<SessionAttendance> {
  return apiFetch<SessionAttendance>(`/sessions/${encodeURIComponent(sessionId)}/attendance`, {
    method: "POST",
    body: { records },
  });
}
