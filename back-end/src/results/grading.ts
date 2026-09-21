import { AssessmentResult } from '../generated/prisma/enums.js';

/**
 * Minimum number of days a participant must attend to pass: 2 of the brief's 3-day workshop, and
 * still 2 for a longer one.
 */
export const REQUIRED_DAYS = 2;

/** The brief's workshop runs 3 days; used when a caller does not say how many days there are. */
const BRIEF_WORKSHOP_DAYS = 3;

/**
 * How many days must be attended in a workshop that has `workshopDays` days (days with a session).
 * A workshop cannot ask for more days than it has: a one-day workshop needs that one day. A workshop
 * with no session at all still asks for 1, which nobody can meet (there is nothing to attend).
 */
export function requiredDays(workshopDays: number): number {
  return Math.min(REQUIRED_DAYS, Math.max(workshopDays, 1));
}

/** Result of a single assessment: score >= passMark → PASS. */
export function scoreResult(score: number, passMark: number): AssessmentResult {
  return score >= passMark ? AssessmentResult.PASS : AssessmentResult.FAIL;
}

/**
 * Final workshop result, exactly as in the brief. A participant PASSES if they
 *   - attended at least REQUIRED_DAYS days (every day, for a workshop with fewer than that), AND
 *   - scored at or above the pass mark on the final assessment.
 * Otherwise (including no final score) the result is FAIL.
 *
 * Only `present` counts as attended; `excused` is an approved absence.
 */
export function evaluateWorkshopResult(input: {
  daysAttended: number;
  finalScore: number | null;
  passMark: number;
  /** Days of the workshop that have a session. Defaults to the brief's 3. */
  workshopDays?: number;
}): AssessmentResult {
  const attended =
    input.daysAttended >=
    requiredDays(input.workshopDays ?? BRIEF_WORKSHOP_DAYS);
  const passed =
    input.finalScore !== null && input.finalScore >= input.passMark;
  return attended && passed ? AssessmentResult.PASS : AssessmentResult.FAIL;
}
