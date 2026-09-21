import type { Assessment, AssessmentScores, Session, SessionAttendance } from "@/types/training";
import { formatDate, naturalCompare, plural } from "./format";

// Workshops, facilitators, topics and participants belong to other services, so this service
// only knows their ids. These helpers turn what it has recorded into pick-lists, with a short
// description from its own data so an id is recognisable without being memorised.

export interface Option {
  value: string;
  /** What this service knows about it, e.g. "3 sessions, 1 Sep 2025 to 3 Sep 2025". */
  description?: string;
}

// A workshop usually runs three days, but longer ones exist: a session or an assessment can be on
// any day from 1 to MAX_DAY. The API and the database enforce the same limit, so keep them in step.
export const MAX_DAY = 30;
export const DAY_PATTERN = "([1-9]|[12][0-9]|30)"; // 1 to MAX_DAY, as an HTML pattern
export const DAY_RULE = `A day is a number from 1 to ${MAX_DAY}.`;
const USUAL_DAYS = 3;

function ordinal(n: number): string {
  if (n <= 3) return ["First", "Second", "Third"][n - 1];
  const suffix = n % 100 >= 11 && n % 100 <= 13 ? "th" : (["th", "st", "nd", "rd"][n % 10] ?? "th");
  return `${n}${suffix}`;
}

/** Days to pick from: 1 to 3, and on to the latest day this service has a session or an assessment on. */
export function dayOptions(sessions: Session[], assessments: Assessment[]): Option[] {
  const latest = Math.max(USUAL_DAYS, ...sessions.map((s) => s.day), ...assessments.map((a) => a.day));
  return Array.from({ length: Math.min(latest, MAX_DAY) }, (_, i) => ({
    value: String(i + 1),
    description: `${ordinal(i + 1)} day`,
  }));
}

/** "day 5", "Day 05" or "5th" → "5". Empty when what was typed has no number in it. */
export function suggestDay(text: string): string {
  const digits = text.match(/\d+/)?.[0];
  return digits === undefined ? "" : String(Number(digits));
}

/** How many days a workshop has, for "1 of 1" or "2 of 5": the days it has a session on (a day counts once). */
export function workshopDays(sessions: Session[], workshopId: string): number {
  return new Set(sessions.filter((s) => s.workshop_id === workshopId).map((s) => s.day)).size;
}

function count<T>(items: T[], key: (item: T) => string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const item of items) counts.set(key(item), (counts.get(key(item)) ?? 0) + 1);
  return counts;
}

function byValue(a: Option, b: Option): number {
  return naturalCompare(a.value, b.value);
}

function describeWorkshop(sessions: Session[], assessments: number): string {
  const parts: string[] = [];
  if (sessions.length === 0) {
    parts.push("No sessions yet");
  } else {
    parts.push(plural(sessions.length, "session"));
    const dates = sessions.map((s) => s.date).sort();
    const first = formatDate(dates[0]);
    const last = formatDate(dates[dates.length - 1]);
    parts.push(first === last ? first : `${first} to ${last}`);
  }
  if (assessments > 0) parts.push(plural(assessments, "assessment"));
  return parts.join(", ");
}

/** Every workshop this service holds a session or an assessment for. */
export function workshopOptions(sessions: Session[], assessments: Assessment[]): Option[] {
  const ids = new Set([...sessions.map((s) => s.workshop_id), ...assessments.map((a) => a.workshop_id)]);
  const assessmentCounts = count(assessments, (a) => a.workshop_id);
  return [...ids]
    .map((id) => ({
      value: id,
      description: describeWorkshop(
        sessions.filter((s) => s.workshop_id === id),
        assessmentCounts.get(id) ?? 0,
      ),
    }))
    .sort(byValue);
}

/** Facilitators already assigned to a session. */
export function facilitatorOptions(sessions: Session[]): Option[] {
  return [...count(sessions, (s) => s.facilitator_id)]
    .map(([value, n]) => ({ value, description: `Leads ${plural(n, "session")}` }))
    .sort(byValue);
}

/** Topics already assigned to a session. */
export function topicOptions(sessions: Session[]): Option[] {
  return [...count(sessions, (s) => s.topic_id)]
    .map(([value, n]) => ({ value, description: `Taught in ${plural(n, "session")}` }))
    .sort(byValue);
}

/**
 * Everyone this service has seen in one workshop: anyone with an attendance record in one of its
 * sessions or a score on one of its assessments.
 */
export function participantsIn(attendance: SessionAttendance[], scores: AssessmentScores[]): string[] {
  const ids = new Set<string>();
  for (const a of attendance) for (const r of a.records) ids.add(r.participant_id);
  for (const s of scores) for (const r of s.scores) ids.add(r.participant_id);
  return [...ids].sort(naturalCompare);
}

export interface SessionGroup {
  workshop: string;
  sessions: { value: string; label: string }[];
}

/** Sessions grouped under their workshop, in teaching order, for a picker. */
export function sessionGroups(sessions: Session[]): SessionGroup[] {
  const groups = new Map<string, Session[]>();
  for (const s of sessions) groups.set(s.workshop_id, [...(groups.get(s.workshop_id) ?? []), s]);

  return [...groups]
    .sort(([a], [b]) => naturalCompare(a, b))
    .map(([workshop, list]) => ({
      workshop,
      sessions: list
        .sort((a, b) => a.day - b.day || a.date.localeCompare(b.date) || a.time_slot.localeCompare(b.time_slot))
        .map((s) => ({
          value: s.session_id,
          label: `Day ${s.day}, ${formatDate(s.date)}, ${s.time_slot} (${s.session_id})`,
        })),
    }));
}
