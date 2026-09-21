import type {
  Assessment,
  AssessmentScores,
  CreateAssessmentInput,
  SubmittedScore,
} from "@/types/training";
import { call, callOrNull } from "./client";
import { PATTERNS } from "./patterns";

/** The workshop's final (day 3) or an optional daily quiz. */
export function createAssessment(input: CreateAssessmentInput): Promise<Assessment> {
  return call<Assessment>(PATTERNS.createAssessment, input);
}

/** Every assessment, newest first. */
export function listAssessments(): Promise<Assessment[]> {
  return call<Assessment[]>(PATTERNS.listAssessments);
}

/** The assessment with all its scores; null when unknown. */
export function getScores(assessmentId: string): Promise<AssessmentScores | null> {
  return callOrNull<AssessmentScores>(PATTERNS.getScores, { assessment_id: assessmentId });
}

/** Saves a score; the service computes PASS/FAIL for it. */
export function submitScore(
  assessmentId: string,
  participantId: string,
  score: number,
): Promise<SubmittedScore> {
  return call<SubmittedScore>(PATTERNS.submitScore, {
    assessment_id: assessmentId,
    participant_id: participantId,
    score,
  });
}
