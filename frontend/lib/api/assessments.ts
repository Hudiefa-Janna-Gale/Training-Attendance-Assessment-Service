import type {
  Assessment,
  AssessmentScores,
  CreateAssessmentInput,
  SubmittedScore,
} from "@/types/training";
import { apiFetch, apiFetchOrNull } from "./client";

/** POST /assessments — the workshop's final (day 3) or an optional daily quiz. */
export function createAssessment(input: CreateAssessmentInput): Promise<Assessment> {
  return apiFetch<Assessment>("/assessments", { method: "POST", body: input });
}

/** GET /assessments/:id/scores — the assessment with all its scores; null when unknown. */
export function getScores(assessmentId: string): Promise<AssessmentScores | null> {
  return apiFetchOrNull<AssessmentScores>(`/assessments/${encodeURIComponent(assessmentId)}/scores`);
}

/** POST /assessments/:id/scores — the service computes PASS/FAIL for the score. */
export function submitScore(
  assessmentId: string,
  participantId: string,
  score: number,
): Promise<SubmittedScore> {
  return apiFetch<SubmittedScore>(`/assessments/${encodeURIComponent(assessmentId)}/scores`, {
    method: "POST",
    body: { participant_id: participantId, score },
  });
}
