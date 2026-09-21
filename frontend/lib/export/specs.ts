import type { Assessment, AssessmentScores, ParticipantResult, Score, Session } from "@/types/training";
import { formatDate } from "../format";
import type { AttendanceRow } from "../roster";
import type { ExportSpec } from "./types";

type Filters = [string, string][];

const STATUS_LABEL = { present: "Present", absent: "Absent", excused: "Excused" } as const;

export function sessionsSpec(sessions: Session[], filters: Filters): ExportSpec {
  return {
    title: "Training sessions",
    fileName: "training-sessions",
    filters,
    columns: [
      { header: "Session" },
      { header: "Workshop" },
      { header: "Day", align: "right" },
      { header: "Date" },
      { header: "Time" },
      { header: "Facilitator" },
      { header: "Topic" },
    ],
    rows: sessions.map((s) => [s.session_id, s.workshop_id, s.day, formatDate(s.date), s.time_slot, s.facilitator_id, s.topic_id]),
  };
}

export function assessmentsSpec(assessments: Assessment[], filters: Filters): ExportSpec {
  return {
    title: "Assessments",
    fileName: "assessments",
    filters,
    columns: [
      { header: "Assessment" },
      { header: "Title" },
      { header: "Workshop" },
      { header: "Day", align: "right" },
      { header: "Kind" },
      { header: "Total marks", align: "right" },
      { header: "Pass mark", align: "right" },
    ],
    rows: assessments.map((a) => [
      a.assessment_id,
      a.title,
      a.workshop_id,
      a.day,
      a.type === "FINAL" ? "Final" : "Quiz",
      a.total_marks,
      a.pass_mark,
    ]),
  };
}

export function scoresSpec(assessment: AssessmentScores, scores: Score[], filters: Filters): ExportSpec {
  return {
    title: `Scores: ${assessment.title}`,
    fileName: `scores-${assessment.assessment_id}`,
    facts: [
      ["Assessment", assessment.assessment_id],
      ["Workshop", assessment.workshop_id],
      ["Day", `Day ${assessment.day}`],
      ["Pass mark", `${assessment.pass_mark} of ${assessment.total_marks}`],
    ],
    filters,
    columns: [
      { header: "Participant" },
      { header: "Score", align: "right" },
      { header: "Out of", align: "right" },
      { header: "Result" },
    ],
    statusColumn: 3,
    rows: scores.map((s) => [s.participant_id, s.score, assessment.total_marks, s.result]),
  };
}

export function rosterSpec(session: Session, rows: AttendanceRow[], filters: Filters): ExportSpec {
  return {
    title: "Attendance",
    fileName: `attendance-${session.session_id}`,
    facts: [
      ["Session", session.session_id],
      ["Workshop", session.workshop_id],
      ["Day", `Day ${session.day}`],
      ["Date", formatDate(session.date)],
      ["Time", session.time_slot],
      ["Facilitator", session.facilitator_id],
      ["Topic", session.topic_id],
    ],
    filters,
    columns: [{ header: "Participant" }, { header: "Status" }],
    statusColumn: 1,
    rows: rows.map((r) => [r.participantId, r.status ? STATUS_LABEL[r.status] : "Not saved yet"]),
  };
}

export function resultSpec(result: ParticipantResult, totalDays: number, requiredDays: number): ExportSpec {
  return {
    title: "Final result",
    fileName: `result-${result.participant_id}-${result.workshop_id}`,
    facts: [
      ["Participant", result.participant_id],
      ["Workshop", result.workshop_id],
    ],
    columns: [
      { header: "Days attended" },
      { header: "Days needed", align: "right" },
      { header: "Final score", align: "right" },
      { header: "Result" },
    ],
    statusColumn: 3,
    rows: [[`${result.days_attended} of ${totalDays}`, requiredDays, result.final_score ?? "No score yet", result.result]],
  };
}
