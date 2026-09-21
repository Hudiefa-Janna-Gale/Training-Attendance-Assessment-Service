import type { Assessment, Session } from "@/types/training";
import { getScores } from "./api/assessments";
import { getAttendance } from "./api/attendance";
import { participantsIn } from "./catalog";

function present<T>(value: T | null): value is T {
  return value !== null;
}

/**
 * The participants this service has seen in a workshop, read from the attendance of its sessions and
 * the scores of its assessments (GET /sessions/:id/attendance, GET /assessments/:id/scores).
 */
export async function loadWorkshopParticipants(
  workshopId: string,
  sessions: Session[],
  assessments: Assessment[],
): Promise<string[]> {
  const [attendance, scores] = await Promise.all([
    Promise.all(sessions.filter((s) => s.workshop_id === workshopId).map((s) => getAttendance(s.session_id))),
    Promise.all(assessments.filter((a) => a.workshop_id === workshopId).map((a) => getScores(a.assessment_id))),
  ]);
  return participantsIn(attendance.filter(present), scores.filter(present));
}
