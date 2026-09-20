/** "2025-09-01" → Date at UTC midnight (what a Postgres DATE column round-trips as). */
export function parseDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

/** Date → "2025-09-01". */
export function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}
