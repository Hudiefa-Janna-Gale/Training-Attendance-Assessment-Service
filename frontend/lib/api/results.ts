import type { ParticipantResult } from "@/types/training";
import { apiFetchOrNull } from "./client";

/**
 * GET /participants/:id/results/:workshop_id — the final PASS / FAIL result.
 * null when the service has no sessions or assessments for that workshop.
 */
export function getParticipantResult(
  participantId: string,
  workshopId: string,
): Promise<ParticipantResult | null> {
  return apiFetchOrNull<ParticipantResult>(
    `/participants/${encodeURIComponent(participantId)}/results/${encodeURIComponent(workshopId)}`,
  );
}
