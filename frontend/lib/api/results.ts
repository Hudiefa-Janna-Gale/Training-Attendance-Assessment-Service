import type { ParticipantResult } from "@/types/training";
import { callOrNull } from "./client";
import { PATTERNS } from "./patterns";

/**
 * The final PASS / FAIL result of a participant in a workshop.
 * null when the service has no sessions or assessments for that workshop.
 */
export function getParticipantResult(
  participantId: string,
  workshopId: string,
): Promise<ParticipantResult | null> {
  return callOrNull<ParticipantResult>(PATTERNS.getResult, {
    participant_id: participantId,
    workshop_id: workshopId,
  });
}
