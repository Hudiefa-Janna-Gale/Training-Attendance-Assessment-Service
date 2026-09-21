import { describe, expect, it } from "vitest";
import type { AssessmentScores, ParticipantResult, Session } from "@/types/training";
import { assessmentsSpec, resultSpec, rosterSpec, scoresSpec, sessionsSpec } from "./specs";

const session: Session = {
  session_id: "SES-009",
  workshop_id: "technical",
  day: 1,
  date: "2026-09-14",
  facilitator_id: "FAC-009",
  topic_id: "TOP-009",
  time_slot: "09:01–09:30",
};

describe("sessionsSpec", () => {
  it("has one row per session, in the words of the screen, with the day as a number", () => {
    const spec = sessionsSpec([session], [["Workshop", "technical"]]);
    expect(spec.columns.map((c) => c.header)).toEqual(["Session", "Workshop", "Day", "Date", "Time", "Facilitator", "Topic"]);
    expect(spec.rows).toEqual([["SES-009", "technical", 1, "14 Sep 2026", "09:01–09:30", "FAC-009", "TOP-009"]]);
    expect(spec.filters).toEqual([["Workshop", "technical"]]);
    expect(spec.rows[0]).toHaveLength(spec.columns.length);
  });
});

describe("assessmentsSpec", () => {
  it("names the kind and keeps marks as numbers", () => {
    const spec = assessmentsSpec(
      [
        { assessment_id: "ASS-001", workshop_id: "WS-1", title: "Final", day: 3, type: "FINAL", total_marks: 100, pass_mark: 60 },
        { assessment_id: "ASS-002", workshop_id: "WS-1", title: "Quiz", day: 1, type: "QUIZ", total_marks: 20, pass_mark: 10 },
      ],
      [],
    );
    expect(spec.rows).toEqual([
      ["ASS-001", "Final", "WS-1", 3, "Final", 100, 60],
      ["ASS-002", "Quiz", "WS-1", 1, "Quiz", 20, 10],
    ]);
    expect(spec.rows.every((row) => row.length === spec.columns.length)).toBe(true);
  });
});

describe("scoresSpec", () => {
  const assessment: AssessmentScores = {
    assessment_id: "ASS-001",
    workshop_id: "WS-2025-001",
    title: "Day 3 Final Assessment",
    day: 3,
    type: "FINAL",
    total_marks: 100,
    pass_mark: 60,
    scores: [],
  };

  it("describes the assessment above a table of the scores shown", () => {
    const spec = scoresSpec(assessment, [{ participant_id: "P-001", score: 82, result: "PASS" }], [["Result", "Pass"]]);
    expect(spec.title).toBe("Scores: Day 3 Final Assessment");
    expect(spec.fileName).toBe("scores-ASS-001");
    expect(spec.facts).toContainEqual(["Pass mark", "60 of 100"]);
    expect(spec.rows).toEqual([["P-001", 82, 100, "PASS"]]);
    expect(spec.statusColumn).toBe(3);
  });
});

describe("rosterSpec", () => {
  it("lists each participant with the saved status in words, and marks people not saved yet", () => {
    const spec = rosterSpec(
      session,
      [
        { participantId: "P-001", status: "present" },
        { participantId: "P-002", status: "excused" },
        { participantId: "Test", status: null },
      ],
      [],
    );
    expect(spec.title).toBe("Attendance");
    expect(spec.fileName).toBe("attendance-SES-009");
    expect(spec.facts).toContainEqual(["Date", "14 Sep 2026"]);
    expect(spec.rows).toEqual([
      ["P-001", "Present"],
      ["P-002", "Excused"],
      ["Test", "Not saved yet"],
    ]);
    expect(spec.statusColumn).toBe(1);
  });
});

describe("resultSpec", () => {
  const result: ParticipantResult = { participant_id: "P-001", workshop_id: "WS-2025-001", result: "PASS", days_attended: 3, final_score: 82 };

  it("is one row: days out of the workshop's days, days needed, score, result", () => {
    const spec = resultSpec(result, 3, 2);
    expect(spec.rows).toEqual([["3 of 3", 2, 82, "PASS"]]);
    expect(spec.fileName).toBe("result-P-001-WS-2025-001");
  });

  it("says so when there is no final score, and counts a longer workshop's days", () => {
    expect(resultSpec({ ...result, final_score: null, result: "FAIL", days_attended: 1 }, 5, 2).rows).toEqual([
      ["1 of 5", 2, "No score yet", "FAIL"],
    ]);
  });
});
