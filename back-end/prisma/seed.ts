// Demo data based on the "Sample Data" in the service brief (WS-2025-001).
// Idempotent: safe to run repeatedly (`npm run db:seed`).
//
// Expected results afterwards:
//   P-001  attended 3/3 days, scored 82  → PASS
//   P-002  attended 1/3 days, scored 45  → FAIL (attendance and score both short)
//   P-003  attended 2/3 days, scored 71  → PASS
//   P-004  attended 3/3 days, scored 55  → FAIL (attendance fine, score below 60)
//   P-005  attended 1/3 days, scored 90  → FAIL (score fine, attendance short)
//   P-006  attended 3/3 days, no score   → PENDING

import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';
import {
  AssessmentType,
  AttendanceStatus,
} from '../src/generated/prisma/enums.js';
import { scoreResult } from '../src/results/grading.js';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const WORKSHOP = 'WS-2025-001';

const sessions = [
  {
    sessionId: 'SES-001',
    day: 1,
    date: '2025-09-01',
    facilitatorId: 'FAC-001',
    topicId: 'TOP-001',
    timeSlot: '08:00–09:30',
  },
  {
    sessionId: 'SES-002',
    day: 2,
    date: '2025-09-02',
    facilitatorId: 'FAC-002',
    topicId: 'TOP-003',
    timeSlot: '08:00–10:00',
  },
  {
    sessionId: 'SES-003',
    day: 3,
    date: '2025-09-03',
    facilitatorId: 'FAC-001',
    topicId: 'TOP-004',
    timeSlot: '08:00–10:00',
  },
];

const { present: P, absent: A } = AttendanceStatus;
// participant → status for [SES-001, SES-002, SES-003]
const attendance: Record<string, AttendanceStatus[]> = {
  'P-001': [P, P, P],
  'P-002': [A, A, P],
  'P-003': [P, A, P],
  'P-004': [P, P, P],
  'P-005': [P, A, A],
  'P-006': [P, P, P],
};

const scores: Record<string, number> = {
  'P-001': 82,
  'P-002': 45,
  'P-003': 71,
  'P-004': 55,
  'P-005': 90,
};

async function main() {
  for (const s of sessions) {
    const data = {
      workshopId: WORKSHOP,
      facilitatorId: s.facilitatorId,
      topicId: s.topicId,
      day: s.day,
      date: new Date(`${s.date}T00:00:00.000Z`),
      timeSlot: s.timeSlot,
    };
    await prisma.session.upsert({
      where: { sessionId: s.sessionId },
      create: { sessionId: s.sessionId, ...data },
      update: data,
    });
  }

  for (const [participantId, statuses] of Object.entries(attendance)) {
    for (const [i, status] of statuses.entries()) {
      const sessionId = sessions[i].sessionId;
      await prisma.attendanceRecord.upsert({
        where: { sessionId_participantId: { sessionId, participantId } },
        create: { sessionId, participantId, status },
        update: { status },
      });
    }
  }

  const passMark = 60;
  await prisma.assessment.upsert({
    where: { assessmentId: 'ASS-001' },
    create: {
      assessmentId: 'ASS-001',
      workshopId: WORKSHOP,
      title: 'Day 3 Final Assessment',
      day: 3,
      type: AssessmentType.FINAL,
      totalMarks: 100,
      passMark,
    },
    update: {},
  });

  for (const [participantId, score] of Object.entries(scores)) {
    await prisma.score.upsert({
      where: {
        assessmentId_participantId: { assessmentId: 'ASS-001', participantId },
      },
      create: {
        assessmentId: 'ASS-001',
        participantId,
        score,
        result: scoreResult(score, passMark),
      },
      update: { score, result: scoreResult(score, passMark) },
    });
  }

  // Keep the id sequences ahead of the seeded ids so generated ids never collide with them.
  await prisma.$executeRawUnsafe(
    `SELECT setval('session_id_seq', GREATEST((SELECT last_value FROM session_id_seq), 3))`,
  );
  await prisma.$executeRawUnsafe(
    `SELECT setval('assessment_id_seq', GREATEST((SELECT last_value FROM assessment_id_seq), 1))`,
  );

  console.log(
    `Seeded workshop ${WORKSHOP}: ${sessions.length} sessions, ${Object.keys(attendance).length} participants, 1 final assessment.`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
