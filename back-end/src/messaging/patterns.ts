/**
 * The RabbitMQ side of the service: one queue that the web UI (and any other service) sends
 * requests to, and one pattern per operation. The operations are exactly the ones the HTTP API
 * has, and they run the same code, so a result is the same on either road.
 *
 * A request is `{ "pattern": "sessions.create", "data": { … }, "id": "<any unique id>" }`, published
 * to the queue with a `replyTo` and a `correlationId` (NestJS's RabbitMQ transport: a Nest service
 * can use `ClientProxy.send(pattern, data)`). The answer is `{ "response": … }`, or
 * `{ "err": { "status": 404, "error": "Not Found", "messages": ["…"] } }` when it failed.
 */
export const RPC_QUEUE = 'training_attendance_assessment';

export const PATTERNS = {
  createSession: 'sessions.create', //     CreateSessionDto            → session
  listSessions: 'sessions.list', //        {}                          → session[], newest first
  getSession: 'sessions.get', //           { session_id }              → session
  recordAttendance: 'attendance.record', // { session_id, records }    → { session_id, records }
  getAttendance: 'attendance.get', //      { session_id }              → { session_id, records }
  createAssessment: 'assessments.create', // CreateAssessmentDto       → assessment
  listAssessments: 'assessments.list', //  {}                          → assessment[], newest first
  submitScore: 'scores.submit', //         { assessment_id, participant_id, score } → score
  getScores: 'scores.get', //              { assessment_id }           → assessment with its scores
  getResult: 'results.get', //             { participant_id, workshop_id } → final PASS/FAIL result
} as const;
