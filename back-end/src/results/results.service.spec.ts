import { NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service.js';
import { ResultsService } from './results.service.js';

interface Fixture {
  presentDays?: number[]; // one entry per `present` attendance record (duplicates = several sessions that day)
  sessionCount?: number;
  finalAssessment?: {
    assessmentId: string;
    passMark: number;
    totalMarks: number;
    scores: { score: number }[];
  } | null;
}

function serviceWith({
  presentDays = [],
  sessionCount = 3,
  finalAssessment = null,
}: Fixture) {
  const prisma = {
    attendanceRecord: {
      findMany: vi
        .fn()
        .mockResolvedValue(presentDays.map((day) => ({ session: { day } }))),
    },
    session: { count: vi.fn().mockResolvedValue(sessionCount) },
    assessment: { findFirst: vi.fn().mockResolvedValue(finalAssessment) },
  };
  return {
    service: new ResultsService(prisma as unknown as PrismaService),
    prisma,
  };
}

const finalWith = (score?: number) => ({
  assessmentId: 'ASS-001',
  passMark: 60,
  totalMarks: 100,
  scores: score === undefined ? [] : [{ score }],
});

describe('ResultsService', () => {
  it('PASS: attended 3 days and scored above the pass mark', async () => {
    const { service } = serviceWith({
      presentDays: [1, 2, 3],
      finalAssessment: finalWith(82),
    });

    await expect(service.getResult('P-001', 'WS-1')).resolves.toMatchObject({
      result: 'PASS',
      attendance: {
        days_attended: 3,
        days_present: [1, 2, 3],
        total_days: 3,
        required_days: 2,
        met: true,
      },
      final_assessment: {
        assessment_id: 'ASS-001',
        score: 82,
        pass_mark: 60,
        met: true,
      },
    });
  });

  it('FAIL: good score but only one day attended', async () => {
    const { service } = serviceWith({
      presentDays: [1],
      finalAssessment: finalWith(90),
    });

    await expect(service.getResult('P-005', 'WS-1')).resolves.toMatchObject({
      result: 'FAIL',
      attendance: { days_attended: 1, met: false },
      final_assessment: { met: true },
    });
  });

  it('FAIL: full attendance but score below the pass mark', async () => {
    const { service } = serviceWith({
      presentDays: [1, 2, 3],
      finalAssessment: finalWith(55),
    });

    await expect(service.getResult('P-004', 'WS-1')).resolves.toMatchObject({
      result: 'FAIL',
      final_assessment: { met: false },
    });
  });

  it('counts a day once even if the participant was present in several sessions that day', async () => {
    const { service } = serviceWith({
      presentDays: [1, 1, 1],
      finalAssessment: finalWith(95),
    });

    const result = await service.getResult('P-007', 'WS-1');
    expect(result.attendance.days_attended).toBe(1);
    expect(result.result).toBe('FAIL');
  });

  it('queries only `present` records (absent and excused never count as attendance)', async () => {
    const { service, prisma } = serviceWith({
      presentDays: [1, 2],
      finalAssessment: finalWith(70),
    });

    await service.getResult('P-003', 'WS-1');

    expect(prisma.attendanceRecord.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          participantId: 'P-003',
          status: 'present',
          session: { workshopId: 'WS-1' },
        },
      }),
    );
  });

  it('PENDING: attended but the final score has not been recorded yet', async () => {
    const { service } = serviceWith({
      presentDays: [1, 2, 3],
      finalAssessment: finalWith(),
    });

    await expect(service.getResult('P-006', 'WS-1')).resolves.toMatchObject({
      result: 'PENDING',
      final_assessment: { score: null, met: null },
    });
  });

  it('PENDING with final_assessment null when the workshop has sessions but no final yet', async () => {
    const { service } = serviceWith({
      presentDays: [1],
      sessionCount: 2,
      finalAssessment: null,
    });

    await expect(service.getResult('P-001', 'WS-1')).resolves.toMatchObject({
      result: 'PENDING',
      final_assessment: null,
    });
  });

  it('404 when the workshop has neither sessions nor a final assessment', async () => {
    const { service } = serviceWith({ sessionCount: 0, finalAssessment: null });

    await expect(service.getResult('P-001', 'WS-NOPE')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
