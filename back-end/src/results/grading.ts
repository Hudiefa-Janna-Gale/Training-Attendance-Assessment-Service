import { AssessmentResult } from '../generated/prisma/enums.js';

/** A workshop runs for 3 days. */
export const TOTAL_DAYS = 3;
/** Minimum number of days a participant must attend to be eligible to pass. */
export const REQUIRED_DAYS = 2;

export type WorkshopResult = AssessmentResult | 'PENDING';

/** Result of a single assessment: score >= passMark → PASS. */
export function scoreResult(score: number, passMark: number): AssessmentResult {
  return score >= passMark ? AssessmentResult.PASS : AssessmentResult.FAIL;
}

/**
 * Final workshop result:
 *   PASS    — attended at least REQUIRED_DAYS of TOTAL_DAYS AND final score >= passMark
 *   FAIL    — otherwise
 *   PENDING — no final score recorded yet, so the outcome cannot be decided
 *             (avoids telling the certificate service "FAIL" before marking is done)
 *
 * Only `present` counts as attended; `excused` is an approved absence, not attendance.
 */
export function evaluateWorkshopResult(input: {
  daysAttended: number;
  finalScore: number | null;
  passMark: number;
}): WorkshopResult {
  if (input.finalScore === null) return 'PENDING';
  const attendanceMet = input.daysAttended >= REQUIRED_DAYS;
  const scoreMet = input.finalScore >= input.passMark;
  return attendanceMet && scoreMet
    ? AssessmentResult.PASS
    : AssessmentResult.FAIL;
}
