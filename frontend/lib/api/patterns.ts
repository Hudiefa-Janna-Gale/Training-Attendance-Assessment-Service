/**
 * The requests the Training service answers on its RabbitMQ queue: one pattern per operation, the same
 * operations as its HTTP API. The contract lives in `back-end/src/messaging/patterns.ts`; keep the two
 * in step.
 */
export const PATTERNS = {
  createSession: "sessions.create", //      CreateSessionInput           → Session
  listSessions: "sessions.list", //         {}                           → Session[], newest first
  getSession: "sessions.get", //            { session_id }               → Session
  recordAttendance: "attendance.record", // { session_id, records }      → SessionAttendance
  getAttendance: "attendance.get", //       { session_id }               → SessionAttendance
  createAssessment: "assessments.create", // CreateAssessmentInput       → Assessment
  listAssessments: "assessments.list", //   {}                          → Assessment[], newest first
  submitScore: "scores.submit", //          { assessment_id, participant_id, score } → SubmittedScore
  getScores: "scores.get", //               { assessment_id }           → AssessmentScores
  getResult: "results.get", //              { participant_id, workshop_id } → ParticipantResult
} as const;
