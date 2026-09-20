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

    await expect(service.getResult('P-001', 'WS-1')).resolves.toEqual({
      participant_id: 'P-001',
      workshop_id: 'WS-1',
      result: 'PASS',
      days_attended: 3,
      final_score: 82,
    });
  });

  it('FAIL: good score but only one day attended', async () => {
    const { service } = serviceWith({
      presentDays: [1],
      finalAssessment: finalWith(90),
    });

    await expect(service.getResult('P-005', 'WS-1')).resolves.toMatchObject({
      result: 'FAIL',
      days_attended: 1,
      final_score: 90,
    });
  });

  it('FAIL: full attendance but score below the pass mark', async () => {
    const { service } = serviceWith({
      presentDays: [1, 2, 3],
      finalAssessment: finalWith(55),
    });

    await expect(service.getResult('P-004', 'WS-1')).resolves.toMatchObject({
      result: 'FAIL',
      days_attended: 3,
    });
  });

  it('counts a day once even if the participant was present in several sessions that day', async () => {
    const { service } = serviceWith({
      presentDays: [1, 1, 1],
      finalAssessment: finalWith(95),
    });

    const result = await service.getResult('P-007', 'WS-1');
    expect(result.days_attended).toBe(1);
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

  it('FAIL with a null final_score when the participant has no final score ("otherwise FAIL")', async () => {
    const { service } = serviceWith({
      presentDays: [1, 2, 3],
      finalAssessment: finalWith(),
    });

    await expect(service.getResult('P-006', 'WS-1')).resolves.toMatchObject({
      result: 'FAIL',
      days_attended: 3,
      final_score: null,
    });
  });

  it('FAIL when the workshop has sessions but no final assessment yet', async () => {
    const { service } = serviceWith({
      presentDays: [1],
      sessionCount: 2,
      finalAssessment: null,
    });

    await expect(service.getResult('P-001', 'WS-1')).resolves.toMatchObject({
      result: 'FAIL',
      final_score: null,
    });
  });

  it('404 when the workshop has neither sessions nor a final assessment', async () => {
    const { service } = serviceWith({ sessionCount: 0, finalAssessment: null });

    await expect(service.getResult('P-001', 'WS-NOPE')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
