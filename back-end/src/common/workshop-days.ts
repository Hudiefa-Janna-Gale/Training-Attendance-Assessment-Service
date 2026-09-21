/**
 * A workshop usually runs 3 days, but longer ones exist: a session or an assessment can be on any
 * day from 1 to MAX_DAY. The database CHECK constraints on `day` use the same limit.
 */
export const MAX_DAY = 30;
