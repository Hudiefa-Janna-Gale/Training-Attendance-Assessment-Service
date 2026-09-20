import { AssessmentResult } from '../generated/prisma/enums.js';

/** Minimum number of the workshop's 3 days a participant must attend to pass. */
export const REQUIRED_DAYS = 2;

/** Result of a single assessment: score >= passMark → PASS. */
export function scoreResult(score: number, passMark: number): AssessmentResult {
  return score >= passMark ? AssessmentResult.PASS : AssessmentResult.FAIL;
}

/**
 * Final workshop result, exactly as in the brief. A participant PASSES if they
 *   - attended at least REQUIRED_DAYS of the 3 days, AND
 *   - scored at or above the pass mark on the final assessment.
 * Otherwise (including no final score) the result is FAIL.
 *
 * Only `present` counts as attended; `excused` is an approved absence.
 */
export function evaluateWorkshopResult(input: {
  daysAttended: number;
  finalScore: number | null;
  passMark: number;
}): AssessmentResult {
  const attended = input.daysAttended >= REQUIRED_DAYS;
  const passed =
    input.finalScore !== null && input.finalScore >= input.passMark;
  return attended && passed ? AssessmentResult.PASS : AssessmentResult.FAIL;
}
