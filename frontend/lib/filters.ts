import type { Assessment, Score, Session } from "@/types/training";
import { formatDate, naturalCompare } from "./format";
import type { AttendanceRow } from "./roster";

// Filters are plain words on screen ("Workshop", "Day", "From date") and plain strings underneath:
// an empty string means "no filter". Each table has its own set, and its own names in the address
// bar (see use-url-filters), so a filtered view can be bookmarked or shared.

/** One control in a filter bar. */
export interface FilterField {
  key: string;
  label: string;
  kind: "search" | "select" | "date" | "number";
  placeholder?: string;
  /** For a select: the choice that means "no filter", e.g. "Any workshop". */
  any?: string;
  options?: { value: string; label: string }[];
  /** Tucked under "More filters" until one of them is in use. */
  advanced?: boolean;
}

/** "tech day 2": every word has to appear somewhere in the text, in any order and any case. */
export function matchesSearch(text: string, query: string): boolean {
  const haystack = text.toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
}

export function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort(naturalCompare);
}

/** How many filters are switched on. */
export function countActive(values: Record<string, string>): number {
  return Object.values(values).filter(Boolean).length;
}

/** The filters in force, in words, for the export files: [["Workshop", "technical"], ["Day", "Day 2"]]. */
export function describeFilters(fields: FilterField[], values: Record<string, string>): [string, string][] {
  return fields.flatMap((field): [string, string][] => {
    const value = values[field.key];
    if (!value) return [];
    if (field.kind === "select") return [[field.label, field.options?.find((o) => o.value === value)?.label ?? value]];
    if (field.kind === "date") return [[field.label, formatDate(value)]];
    return [[field.label, value]];
  });
}

/** Days offered as a filter: the ones that appear in the data, in order. */
export function dayChoices(days: number[]): { value: string; label: string }[] {
  return [...new Set(days)].sort((a, b) => a - b).map((day) => ({ value: String(day), label: `Day ${day}` }));
}

export function choices(values: string[]): { value: string; label: string }[] {
  return uniqueSorted(values).map((value) => ({ value, label: value }));
}

// --- sessions -------------------------------------------------------------------------------

export type SessionFilters = {
  q: string;
  workshop: string;
  day: string;
  facilitator: string;
  topic: string;
  from: string;
  to: string;
};

export const NO_SESSION_FILTERS: SessionFilters = { q: "", workshop: "", day: "", facilitator: "", topic: "", from: "", to: "" };

export function filterSessions(sessions: Session[], f: SessionFilters): Session[] {
  return sessions.filter(
    (s) =>
      (!f.workshop || s.workshop_id === f.workshop) &&
      (!f.day || String(s.day) === f.day) &&
      (!f.facilitator || s.facilitator_id === f.facilitator) &&
      (!f.topic || s.topic_id === f.topic) &&
      (!f.from || s.date >= f.from) &&
      (!f.to || s.date <= f.to) &&
      matchesSearch(
        [s.session_id, s.workshop_id, s.facilitator_id, s.topic_id, `day ${s.day}`, s.date, formatDate(s.date), s.time_slot].join(" "),
        f.q,
      ),
  );
}

// --- assessments ----------------------------------------------------------------------------

export type AssessmentFilters = {
  q: string;
  workshop: string;
  kind: string;
  day: string;
};

export const NO_ASSESSMENT_FILTERS: AssessmentFilters = { q: "", workshop: "", kind: "", day: "" };

export function filterAssessments(assessments: Assessment[], f: AssessmentFilters): Assessment[] {
  return assessments.filter(
    (a) =>
      (!f.workshop || a.workshop_id === f.workshop) &&
      (!f.kind || a.type === f.kind) &&
      (!f.day || String(a.day) === f.day) &&
      matchesSearch(
        [a.assessment_id, a.title, a.workshop_id, `day ${a.day}`, a.type === "FINAL" ? "final" : "quiz"].join(" "),
        f.q,
      ),
  );
}

// --- scores ---------------------------------------------------------------------------------

export type ScoreFilters = {
  sq: string;
  result: string;
  min: string;
  max: string;
};

export const NO_SCORE_FILTERS: ScoreFilters = { sq: "", result: "", min: "", max: "" };

/** A number typed into a filter box; anything else counts as "not set". */
function bound(text: string): number | null {
  if (text.trim() === "") return null;
  const n = Number(text);
  return Number.isFinite(n) ? n : null;
}

export function filterScores(scores: Score[], f: ScoreFilters): Score[] {
  const min = bound(f.min);
  const max = bound(f.max);
  return scores.filter(
    (s) =>
      (!f.result || s.result === f.result) &&
      (min === null || s.score >= min) &&
      (max === null || s.score <= max) &&
      matchesSearch(s.participant_id, f.sq),
  );
}

// --- the roll call --------------------------------------------------------------------------

export type RosterFilters = {
  rq: string;
  status: string;
};

export const NO_ROSTER_FILTERS: RosterFilters = { rq: "", status: "" };

/** "unsaved" stands for a participant added on screen and not saved yet. */
export function filterRoster(rows: AttendanceRow[], f: RosterFilters): AttendanceRow[] {
  return rows.filter(
    (r) => (!f.status || (r.status ?? "unsaved") === f.status) && matchesSearch(r.participantId, f.rq),
  );
}
