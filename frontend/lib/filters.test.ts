import { describe, expect, it } from "vitest";
import type { Assessment, Score, Session } from "@/types/training";
import {
  choices,
  countActive,
  dayChoices,
  describeFilters,
  filterAssessments,
  filterRoster,
  filterScores,
  filterSessions,
  matchesSearch,
  NO_ASSESSMENT_FILTERS,
  NO_ROSTER_FILTERS,
  NO_SCORE_FILTERS,
  NO_SESSION_FILTERS,
  uniqueSorted,
  type FilterField,
} from "./filters";

const session = (over: Partial<Session> & Pick<Session, "session_id">): Session => ({
  workshop_id: "technical",
  day: 1,
  date: "2026-09-14",
  facilitator_id: "FAC-009",
  topic_id: "TOP-009",
  time_slot: "09:01–09:30",
  ...over,
});

const sessions = [
  session({ session_id: "SES-001", workshop_id: "WS-2025-001", date: "2025-09-01", facilitator_id: "FAC-001", topic_id: "TOP-001", time_slot: "08:00–09:30" }),
  session({ session_id: "SES-002", workshop_id: "WS-2025-001", day: 2, date: "2025-09-02", facilitator_id: "FAC-002", topic_id: "TOP-003", time_slot: "08:00–10:00" }),
  session({ session_id: "SES-009" }),
  session({ session_id: "SES-017", workshop_id: "Multimedia", date: "2026-09-21", facilitator_id: "Hudeifa", topic_id: "marketing", time_slot: "10:00–11:00" }),
];

const ids = (list: { session_id: string }[]) => list.map((s) => s.session_id);

describe("matchesSearch", () => {
  it("needs every word, in any order and any case", () => {
    expect(matchesSearch("SES-009 technical Day 1", "TECH day")).toBe(true);
    expect(matchesSearch("SES-009 technical Day 1", "day technical")).toBe(true);
    expect(matchesSearch("SES-009 technical Day 1", "technical day 2")).toBe(false);
  });

  it("matches everything when nothing is typed", () => {
    expect(matchesSearch("anything", "")).toBe(true);
    expect(matchesSearch("anything", "   ")).toBe(true);
  });
});

describe("filterSessions", () => {
  it("keeps everything when no filter is set", () => {
    expect(filterSessions(sessions, NO_SESSION_FILTERS)).toHaveLength(4);
  });

  it("filters by workshop, day, facilitator and topic (exact choices)", () => {
    expect(ids(filterSessions(sessions, { ...NO_SESSION_FILTERS, workshop: "WS-2025-001" }))).toEqual(["SES-001", "SES-002"]);
    expect(ids(filterSessions(sessions, { ...NO_SESSION_FILTERS, day: "2" }))).toEqual(["SES-002"]);
    expect(ids(filterSessions(sessions, { ...NO_SESSION_FILTERS, facilitator: "Hudeifa" }))).toEqual(["SES-017"]);
    expect(ids(filterSessions(sessions, { ...NO_SESSION_FILTERS, topic: "TOP-003" }))).toEqual(["SES-002"]);
  });

  it("filters by a date range, both ends included", () => {
    const f = { ...NO_SESSION_FILTERS };
    expect(ids(filterSessions(sessions, { ...f, from: "2026-09-14" }))).toEqual(["SES-009", "SES-017"]);
    expect(ids(filterSessions(sessions, { ...f, to: "2025-09-01" }))).toEqual(["SES-001"]);
    expect(ids(filterSessions(sessions, { ...f, from: "2025-09-02", to: "2026-09-14" }))).toEqual(["SES-002", "SES-009"]);
  });

  it("searches the text people see, including the written date", () => {
    expect(ids(filterSessions(sessions, { ...NO_SESSION_FILTERS, q: "marketing" }))).toEqual(["SES-017"]);
    expect(ids(filterSessions(sessions, { ...NO_SESSION_FILTERS, q: "14 Sep 2026" }))).toEqual(["SES-009"]);
    expect(ids(filterSessions(sessions, { ...NO_SESSION_FILTERS, q: "09:01" }))).toEqual(["SES-009"]);
  });

  it("narrows with each extra word", () => {
    expect(ids(filterSessions(sessions, { ...NO_SESSION_FILTERS, q: "ws-2025" }))).toEqual(["SES-001", "SES-002"]);
    expect(ids(filterSessions(sessions, { ...NO_SESSION_FILTERS, q: "ws-2025 fac-002" }))).toEqual(["SES-002"]);
  });

  it("combines filters: all of them have to match", () => {
    const f = { ...NO_SESSION_FILTERS, workshop: "WS-2025-001", from: "2025-09-02", q: "fac-002" };
    expect(ids(filterSessions(sessions, f))).toEqual(["SES-002"]);
    expect(filterSessions(sessions, { ...f, day: "1" })).toEqual([]);
  });
});

describe("filterAssessments", () => {
  const assessment = (over: Partial<Assessment> & Pick<Assessment, "assessment_id">): Assessment => ({
    workshop_id: "WS-2025-001",
    title: "Day 3 Final Assessment",
    day: 3,
    type: "FINAL",
    total_marks: 100,
    pass_mark: 60,
    ...over,
  });
  const list = [
    assessment({ assessment_id: "ASS-001" }),
    assessment({ assessment_id: "ASS-002", title: "Morning quiz", day: 1, type: "QUIZ" }),
    assessment({ assessment_id: "ASS-003", workshop_id: "technical", title: "Afternoon test", type: "QUIZ", day: 2 }),
  ];
  const got = (f: Partial<typeof NO_ASSESSMENT_FILTERS>) => filterAssessments(list, { ...NO_ASSESSMENT_FILTERS, ...f }).map((a) => a.assessment_id);

  it("filters by workshop, kind and day", () => {
    expect(got({})).toEqual(["ASS-001", "ASS-002", "ASS-003"]);
    expect(got({ workshop: "technical" })).toEqual(["ASS-003"]);
    expect(got({ kind: "QUIZ" })).toEqual(["ASS-002", "ASS-003"]);
    expect(got({ day: "3" })).toEqual(["ASS-001"]);
  });

  it("searches the id, the title and the words Final / Quiz", () => {
    expect(got({ q: "morning" })).toEqual(["ASS-002"]);
    expect(got({ q: "final" })).toEqual(["ASS-001"]);
    expect(got({ q: "quiz" })).toEqual(["ASS-002", "ASS-003"]);
    expect(got({ q: "ass-003" })).toEqual(["ASS-003"]);
  });
});

describe("filterScores", () => {
  const scores: Score[] = [
    { participant_id: "P-001", score: 82, result: "PASS" },
    { participant_id: "P-002", score: 45, result: "FAIL" },
    { participant_id: "P-003", score: 60, result: "PASS" },
  ];
  const got = (f: Partial<typeof NO_SCORE_FILTERS>) => filterScores(scores, { ...NO_SCORE_FILTERS, ...f }).map((s) => s.participant_id);

  it("filters by result and by a score range, ends included", () => {
    expect(got({ result: "PASS" })).toEqual(["P-001", "P-003"]);
    expect(got({ min: "60" })).toEqual(["P-001", "P-003"]);
    expect(got({ max: "60" })).toEqual(["P-002", "P-003"]);
    expect(got({ min: "50", max: "70" })).toEqual(["P-003"]);
  });

  it("ignores a range box that is empty or not a number", () => {
    expect(got({ min: "", max: "abc" })).toEqual(["P-001", "P-002", "P-003"]);
  });

  it("searches the participant", () => {
    expect(got({ sq: "p-00" })).toEqual(["P-001", "P-002", "P-003"]);
    expect(got({ sq: "002" })).toEqual(["P-002"]);
  });
});

describe("filterRoster", () => {
  const rows = [
    { participantId: "P-001", status: "present" as const },
    { participantId: "P-002", status: "absent" as const },
    { participantId: "Test", status: null },
  ];
  const got = (f: Partial<typeof NO_ROSTER_FILTERS>) => filterRoster(rows, { ...NO_ROSTER_FILTERS, ...f }).map((r) => r.participantId);

  it("filters by the saved status, and 'unsaved' finds people added on screen", () => {
    expect(got({ status: "present" })).toEqual(["P-001"]);
    expect(got({ status: "absent" })).toEqual(["P-002"]);
    expect(got({ status: "unsaved" })).toEqual(["Test"]);
    expect(got({ status: "excused" })).toEqual([]);
  });

  it("searches the participant", () => {
    expect(got({ rq: "test" })).toEqual(["Test"]);
    expect(got({ rq: "p-00", status: "absent" })).toEqual(["P-002"]);
  });
});

describe("helpers", () => {
  it("counts the filters that are switched on", () => {
    expect(countActive(NO_SESSION_FILTERS)).toBe(0);
    expect(countActive({ ...NO_SESSION_FILTERS, day: "2", q: "x" })).toBe(2);
  });

  it("lists choices from the data, sorted naturally, without repeats", () => {
    expect(uniqueSorted(["WS-10", "WS-2", "WS-2"])).toEqual(["WS-2", "WS-10"]);
    expect(choices(["b", "a", "b"])).toEqual([
      { value: "a", label: "a" },
      { value: "b", label: "b" },
    ]);
    expect(dayChoices([3, 1, 3, 10])).toEqual([
      { value: "1", label: "Day 1" },
      { value: "3", label: "Day 3" },
      { value: "10", label: "Day 10" },
    ]);
  });

  it("describes the filters in force in words", () => {
    const fields: FilterField[] = [
      { key: "q", label: "Search", kind: "search" },
      { key: "workshop", label: "Workshop", kind: "select", options: [{ value: "technical", label: "technical" }] },
      { key: "day", label: "Day", kind: "select", options: [{ value: "2", label: "Day 2" }] },
      { key: "from", label: "From date", kind: "date" },
      { key: "to", label: "To date", kind: "date" },
    ];
    expect(describeFilters(fields, { q: "fac", workshop: "technical", day: "2", from: "2026-09-14", to: "" })).toEqual([
      ["Search", "fac"],
      ["Workshop", "technical"],
      ["Day", "Day 2"],
      ["From date", "14 Sep 2026"],
    ]);
    expect(describeFilters(fields, {})).toEqual([]);
  });
});
