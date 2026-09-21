import { describe, expect, it } from "vitest";
import type { Assessment, AssessmentScores, Session, SessionAttendance } from "@/types/training";
import {
  DAY_PATTERN,
  dayOptions,
  facilitatorOptions,
  MAX_DAY,
  participantsIn,
  sessionGroups,
  suggestDay,
  topicOptions,
  workshopDays,
  workshopOptions,
} from "./catalog";
import { fitsPattern } from "./combo";

const session = (over: Partial<Session> & Pick<Session, "session_id">): Session => ({
  workshop_id: "WS-1",
  day: 1,
  date: "2025-09-01",
  facilitator_id: "FAC-001",
  topic_id: "TOP-001",
  time_slot: "08:00–09:30",
  ...over,
});

const assessment = (over: Partial<Assessment> & Pick<Assessment, "assessment_id">): Assessment => ({
  workshop_id: "WS-1",
  title: "Final",
  day: 3,
  type: "FINAL",
  total_marks: 100,
  pass_mark: 60,
  ...over,
});

describe("workshopOptions", () => {
  const sessions = [
    session({ session_id: "SES-001", date: "2025-09-01" }),
    session({ session_id: "SES-002", date: "2025-09-03", day: 3 }),
    session({ session_id: "SES-003", workshop_id: "WS-10", date: "2025-10-05" }),
  ];

  it("lists each workshop once, in natural order, described from what the service holds", () => {
    expect(workshopOptions(sessions, [assessment({ assessment_id: "ASS-001" })])).toEqual([
      { value: "WS-1", description: "2 sessions, 1 Sep 2025 to 3 Sep 2025, 1 assessment" },
      { value: "WS-10", description: "1 session, 5 Oct 2025" },
    ]);
  });

  it("includes a workshop that only has an assessment", () => {
    expect(workshopOptions([], [assessment({ assessment_id: "ASS-009", workshop_id: "WS-7" })])).toEqual([
      { value: "WS-7", description: "No sessions yet, 1 assessment" },
    ]);
  });

  it("is empty when nothing has been recorded", () => {
    expect(workshopOptions([], [])).toEqual([]);
  });
});

describe("facilitatorOptions / topicOptions", () => {
  const sessions = [
    session({ session_id: "SES-001", facilitator_id: "FAC-2", topic_id: "TOP-9" }),
    session({ session_id: "SES-002", facilitator_id: "FAC-10", topic_id: "TOP-9" }),
    session({ session_id: "SES-003", facilitator_id: "FAC-2", topic_id: "TOP-1" }),
  ];

  it("counts how many sessions each facilitator leads", () => {
    expect(facilitatorOptions(sessions)).toEqual([
      { value: "FAC-2", description: "Leads 2 sessions" },
      { value: "FAC-10", description: "Leads 1 session" },
    ]);
  });

  it("counts how many sessions each topic is taught in", () => {
    expect(topicOptions(sessions)).toEqual([
      { value: "TOP-1", description: "Taught in 1 session" },
      { value: "TOP-9", description: "Taught in 2 sessions" },
    ]);
  });
});

describe("participantsIn", () => {
  const attendance: SessionAttendance[] = [
    { session_id: "SES-001", records: [{ participant_id: "P-2", status: "present" }, { participant_id: "P-1", status: "absent" }] },
    { session_id: "SES-002", records: [{ participant_id: "P-2", status: "excused" }, { participant_id: "P-10", status: "present" }] },
  ];
  const scores = [
    {
      ...assessment({ assessment_id: "ASS-001" }),
      scores: [{ participant_id: "P-3", score: 70, result: "PASS" }],
    } as AssessmentScores,
  ];

  it("unions attendance and scores, without duplicates, in natural order", () => {
    expect(participantsIn(attendance, scores)).toEqual(["P-1", "P-2", "P-3", "P-10"]);
  });

  it("is empty when nobody has been recorded", () => {
    expect(participantsIn([], [])).toEqual([]);
  });
});

describe("days", () => {
  it("the pattern accepts exactly 1 to MAX_DAY, the same range as the API", () => {
    for (const day of [1, 9, 10, 29, MAX_DAY]) expect(fitsPattern(String(day), DAY_PATTERN)).toBe(true);
    for (const day of ["0", "01", String(MAX_DAY + 1), "99", "4th", "day 4", "1.5", ""]) {
      expect(fitsPattern(day, DAY_PATTERN)).toBe(false);
    }
  });

  it("dayOptions offers days 1 to 3, named, when nothing has been recorded", () => {
    expect(dayOptions([], [])).toEqual([
      { value: "1", description: "First day" },
      { value: "2", description: "Second day" },
      { value: "3", description: "Third day" },
    ]);
  });

  it("dayOptions goes on to the latest day in use, by a session or an assessment", () => {
    const options = dayOptions(
      [session({ session_id: "SES-001", day: 5 })],
      [assessment({ assessment_id: "ASS-001", type: "QUIZ", day: 11 })],
    );
    expect(options.map((o) => o.value)).toEqual(["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"]);
    expect(options.slice(3, 5).map((o) => o.description)).toEqual(["4th day", "5th day"]);
    expect(options[10].description).toBe("11th day");
  });

  it("dayOptions never goes past MAX_DAY", () => {
    expect(dayOptions([session({ session_id: "SES-001", day: 99 })], [])).toHaveLength(MAX_DAY);
  });

  it.each([
    ["day 5", "5"],
    ["Day 05", "5"],
    ["5th", "5"],
    ["  12 ", "12"],
    ["day", ""],
    ["", ""],
  ])("suggestDay turns %j into %j", (typed, day) => {
    expect(suggestDay(typed)).toBe(day);
  });

  it("workshopDays counts the days a workshop has sessions on, each day once", () => {
    const sessions = [
      session({ session_id: "SES-001", day: 1 }),
      session({ session_id: "SES-002", day: 1, time_slot: "10:00–11:00" }), // a second session on day 1
      session({ session_id: "SES-003", workshop_id: "WS-2", day: 1 }),
      session({ session_id: "SES-004", workshop_id: "WS-3", day: 1 }),
      session({ session_id: "SES-005", workshop_id: "WS-3", day: 2 }),
      session({ session_id: "SES-006", workshop_id: "WS-3", day: 5 }),
    ];
    expect(workshopDays(sessions, "WS-1")).toBe(1); // a one-day workshop is one day, not three
    expect(workshopDays(sessions, "WS-2")).toBe(1);
    expect(workshopDays(sessions, "WS-3")).toBe(3);
    expect(workshopDays(sessions, "WS-unknown")).toBe(0);
  });
});

describe("sessionGroups", () => {
  it("groups sessions under their workshop, in teaching order, with readable labels", () => {
    const groups = sessionGroups([
      session({ session_id: "SES-002", day: 2, date: "2025-09-02", time_slot: "08:00–10:00" }),
      session({ session_id: "SES-009", workshop_id: "WS-0", day: 1, date: "2026-09-14", time_slot: "09:01–09:30" }),
      session({ session_id: "SES-001", day: 1, date: "2025-09-01" }),
    ]);

    expect(groups).toEqual([
      { workshop: "WS-0", sessions: [{ value: "SES-009", label: "Day 1, 14 Sep 2026, 09:01–09:30 (SES-009)" }] },
      {
        workshop: "WS-1",
        sessions: [
          { value: "SES-001", label: "Day 1, 1 Sep 2025, 08:00–09:30 (SES-001)" },
          { value: "SES-002", label: "Day 2, 2 Sep 2025, 08:00–10:00 (SES-002)" },
        ],
      },
    ]);
  });
});
