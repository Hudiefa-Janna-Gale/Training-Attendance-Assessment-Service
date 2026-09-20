import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import type { IdGeneratorService } from '../prisma/id-generator.service.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { AssessmentsService } from './assessments.service.js';

const NOW = new Date('2025-09-03T10:00:00.000Z');

function setup(
  opts: {
    existingFinal?: boolean;
    assessment?: object | null;
    existingScore?: boolean;
  } = {},
) {
  const prisma = {
    assessment: {
      findUnique: vi.fn().mockResolvedValue(opts.assessment ?? null),
      findFirst: vi
        .fn()
        .mockResolvedValue(
          opts.existingFinal ? { assessmentId: 'ASS-000' } : null,
        ),
      create: vi
        .fn()
        .mockImplementation(({ data }) =>
          Promise.resolve({ ...data, createdAt: NOW }),
        ),
    },
    score: {
      findUnique: vi
        .fn()
        .mockResolvedValue(opts.existingScore ? { id: 'x' } : null),
      create: vi
        .fn()
        .mockImplementation(({ data }) =>
          Promise.resolve({ ...data, submittedAt: NOW }),
        ),
      findMany: vi.fn().mockResolvedValue([]),
    },
  };
  const ids = { next: vi.fn().mockResolvedValue('ASS-007') };
  const service = new AssessmentsService(
    prisma as unknown as PrismaService,
    ids as unknown as IdGeneratorService,
  );
  return { service, prisma, ids };
}

const base = { workshop_id: 'WS-1', title: 'Final', day: 3 };

describe('AssessmentsService.create', () => {
  it('defaults to a FINAL worth 100 with a pass mark of 60 on day 3, and generates the id', async () => {
    const { service } = setup();

    await expect(service.create(base)).resolves.toMatchObject({
      assessment_id: 'ASS-007',
      type: 'FINAL',
      total_marks: 100,
      pass_mark: 60,
    });
  });

  it('defaults to a QUIZ on days 1 and 2', async () => {
    const { service } = setup();
    await expect(service.create({ ...base, day: 2 })).resolves.toMatchObject({
      type: 'QUIZ',
    });
  });

  it('rejects pass_mark above total_marks', async () => {
    const { service } = setup();
    await expect(
      service.create({ ...base, total_marks: 50, pass_mark: 60 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a FINAL that is not on day 3', async () => {
    const { service } = setup();
    await expect(
      service.create({ ...base, day: 2, type: 'FINAL' }),
    ).rejects.toThrow('day 3');
  });

  it('allows only one FINAL per workshop', async () => {
    const { service, prisma } = setup({ existingFinal: true });

    await expect(service.create(base)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(prisma.assessment.create).not.toHaveBeenCalled();
  });

  it('still allows a QUIZ when the workshop already has a FINAL', async () => {
    const { service } = setup({ existingFinal: true });
    await expect(service.create({ ...base, day: 1 })).resolves.toMatchObject({
      type: 'QUIZ',
    });
  });

  it('rejects a client-supplied id that already exists', async () => {
    const { service } = setup({ assessment: { id: 'exists' } });
    await expect(
      service.create({ ...base, assessment_id: 'ASS-001' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

describe('AssessmentsService.submitScore', () => {
  const assessment = { assessmentId: 'ASS-001', totalMarks: 100, passMark: 60 };

  it('computes PASS at or above the pass mark', async () => {
    const { service } = setup({ assessment });
    await expect(
      service.submitScore('ASS-001', { participant_id: 'P-001', score: 60 }),
    ).resolves.toMatchObject({
      result: 'PASS',
    });
  });

  it('computes FAIL below the pass mark', async () => {
    const { service } = setup({ assessment });
    await expect(
      service.submitScore('ASS-001', { participant_id: 'P-002', score: 45 }),
    ).resolves.toMatchObject({
      result: 'FAIL',
    });
  });

  it('rejects a score above total_marks', async () => {
    const { service, prisma } = setup({ assessment });

    await expect(
      service.submitScore('ASS-001', { participant_id: 'P-001', score: 101 }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.score.create).not.toHaveBeenCalled();
  });

  it('404s for an unknown assessment', async () => {
    const { service } = setup({ assessment: null });
    await expect(
      service.submitScore('ASS-NOPE', { participant_id: 'P-001', score: 50 }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('409s when the participant already has a score (one score per participant per assessment)', async () => {
    const { service } = setup({ assessment, existingScore: true });
    await expect(
      service.submitScore('ASS-001', { participant_id: 'P-001', score: 70 }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
