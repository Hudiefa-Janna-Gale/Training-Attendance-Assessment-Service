/** The brief's rule: attend at least this many of the workshop's days (2 of 3, and 2 for a longer one too). */
export const REQUIRED_DAYS = 2;

/**
 * How many days a participant must attend in a workshop that has `totalDays` days. The service
 * applies the same rule: a workshop cannot ask for more days than it has, so a one-day workshop
 * needs that one day. (A workshop with no session still asks for 1, which nobody can meet.)
 */
export function daysNeeded(totalDays: number): number {
  return Math.min(REQUIRED_DAYS, Math.max(totalDays, 1));
}

/** The attendance rule in words, for the note under a result: "attends at least 2 of the 3 days". */
export function attendanceRule(needed: number, totalDays: number): string {
  if (totalDays <= 1) return "attends the workshop’s day";
  if (needed >= totalDays) return `attends all ${totalDays} days`;
  return `attends at least ${needed} of the ${totalDays} days`;
}
