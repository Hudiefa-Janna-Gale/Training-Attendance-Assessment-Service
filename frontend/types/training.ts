// Shapes of the Training, Attendance & Assessment Service API — exactly the eight
// endpoints in the service brief. Field names are the API's own snake_case.

export type AttendanceStatus = "present" | "absent" | "excused";
export type AssessmentType = "FINAL" | "QUIZ";
export type AssessmentResult = "PASS" | "FAIL";

/** POST /sessions, GET /sessions/:id */
export interface Session {
  session_id: string;
  workshop_id: string;
  day: number;
  /** YYYY-MM-DD */
  date: string;
  facilitator_id: string;
  topic_id: string;
  /** e.g. "08:00–09:30" */
  time_slot: string;
}

export interface CreateSessionInput {
  /** Omit to let the service generate SES-001, SES-002, … */
  session_id?: string;
  workshop_id: string;
  facilitator_id: string;
  topic_id: string;
  day: number;
  date: string;
  time_slot: string;
}

export interface AttendanceEntry {
  participant_id: string;
  status: AttendanceStatus;
}

/** POST / GET /sessions/:id/attendance */
export interface SessionAttendance {
  session_id: string;
  records: AttendanceEntry[];
}

/** POST /assessments */
export interface Assessment {
  assessment_id: string;
  workshop_id: string;
  title: string;
  day: number;
  type: AssessmentType;
  total_marks: number;
  pass_mark: number;
}

export interface CreateAssessmentInput {
  /** Omit to let the service generate ASS-001, ASS-002, … */
  assessment_id?: string;
  workshop_id: string;
  title: string;
  day: number;
  /** Omit: FINAL on day 3, QUIZ otherwise. */
  type?: AssessmentType;
  total_marks?: number;
  pass_mark?: number;
}

export interface Score {
  participant_id: string;
  score: number;
  result: AssessmentResult;
}

/** GET /assessments/:id/scores — the assessment with all its scores. */
export interface AssessmentScores extends Assessment {
  scores: Score[];
}

/** POST /assessments/:id/scores */
export interface SubmittedScore extends Score {
  assessment_id: string;
}

/** GET /participants/:id/results/:workshop_id */
export interface ParticipantResult {
  participant_id: string;
  workshop_id: string;
  result: AssessmentResult;
  days_attended: number;
  /** null when the participant has no score on the final assessment */
  final_score: number | null;
}
