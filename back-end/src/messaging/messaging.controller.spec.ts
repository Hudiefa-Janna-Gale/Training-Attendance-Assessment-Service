import { BadRequestException } from '@nestjs/common';
import { CreateSessionDto } from '../sessions/dto/create-session.dto.js';
import {
  AssessmentRefDto,
  RecordAttendanceRequestDto,
  ResultRequestDto,
  SessionRefDto,
  SubmitScoreRequestDto,
} from './dto/requests.js';
import { MessagingController } from './messaging.controller.js';
import { PATTERNS } from './patterns.js';
import { rpcValidationPipe } from './validation.js';

// The very pipe the controller uses, applied by hand: a request must be as strictly checked over
// RabbitMQ as over HTTP.
const pipe = rpcValidationPipe();
const check = <T>(metatype: new () => T, value: unknown) =>
  pipe.transform(value, { type: 'custom', metatype }) as Promise<T>;

function controllerWith() {
  const sessions = { create: vi.fn(), list: vi.fn(), findOne: vi.fn() };
  const attendance = { record: vi.fn(), list: vi.fn() };
  const assessments = {
    create: vi.fn(),
    list: vi.fn(),
    submitScore: vi.fn(),
    listScores: vi.fn(),
  };
  const results = { getResult: vi.fn() };
  const controller = new MessagingController(
    sessions as never,
    attendance as never,
    assessments as never,
    results as never,
  );
  return { controller, sessions, attendance, assessments, results };
}

describe('MessagingController: every operation runs the same service as the HTTP API', () => {
  it('sessions', async () => {
    const { controller, sessions } = controllerWith();
    const dto = { session_id: 'SES-1' } as CreateSessionDto;
    sessions.create.mockResolvedValue({ ok: 'created' });
    sessions.list.mockResolvedValue([1, 2]);
    sessions.findOne.mockResolvedValue({ ok: 'one' });

    await expect(controller.createSession(dto)).resolves.toEqual({
      ok: 'created',
    });
    expect(sessions.create).toHaveBeenCalledWith(dto);
    await expect(controller.listSessions()).resolves.toEqual([1, 2]);
    await expect(
      controller.getSession({ session_id: 'SES-1' }),
    ).resolves.toEqual({ ok: 'one' });
    expect(sessions.findOne).toHaveBeenCalledWith('SES-1');
  });

  it('attendance: the id goes in as the path id does over HTTP, the rest is the body', async () => {
    const { controller, attendance } = controllerWith();
    attendance.record.mockResolvedValue({ saved: true });
    attendance.list.mockResolvedValue({ list: true });

    await controller.recordAttendance({
      session_id: 'SES-1',
      records: [{ participant_id: 'P-1', status: 'present' }],
    } as RecordAttendanceRequestDto);
    expect(attendance.record).toHaveBeenCalledWith('SES-1', {
      records: [{ participant_id: 'P-1', status: 'present' }],
    });
    await controller.getAttendance({ session_id: 'SES-1' });
    expect(attendance.list).toHaveBeenCalledWith('SES-1');
  });

  it('assessments and scores', async () => {
    const { controller, assessments } = controllerWith();
    await controller.createAssessment({ title: 'x' } as never);
    expect(assessments.create).toHaveBeenCalledWith({ title: 'x' });
    await controller.listAssessments();
    expect(assessments.list).toHaveBeenCalled();
    await controller.submitScore({
      assessment_id: 'ASS-1',
      participant_id: 'P-1',
      score: 82,
    } as SubmitScoreRequestDto);
    expect(assessments.submitScore).toHaveBeenCalledWith('ASS-1', {
      participant_id: 'P-1',
      score: 82,
    });
    await controller.getScores({ assessment_id: 'ASS-1' });
    expect(assessments.listScores).toHaveBeenCalledWith('ASS-1');
  });

  it('results', async () => {
    const { controller, results } = controllerWith();
    await controller.getResult({ participant_id: 'P-1', workshop_id: 'WS-1' });
    expect(results.getResult).toHaveBeenCalledWith('P-1', 'WS-1');
  });

  it('has a handler for every pattern of the contract', () => {
    const handlers = Object.values(PATTERNS).map((pattern) =>
      Reflect.getMetadata(
        'microservices:pattern',
        MessagingController.prototype[
          (Object.keys(PATTERNS) as (keyof typeof PATTERNS)[]).find(
            (key) => PATTERNS[key] === pattern,
          ) as keyof MessagingController
        ],
      ),
    );
    expect(handlers.every(Boolean)).toBe(true);
    expect(handlers).toHaveLength(10);
  });
});

describe('requests are validated as strictly as over HTTP', () => {
  it('accepts a good session reference and rejects a missing or empty one', async () => {
    await expect(
      check(SessionRefDto, { session_id: 'SES-001' }),
    ).resolves.toMatchObject({ session_id: 'SES-001' });
    await expect(check(SessionRefDto, {})).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(
      check(SessionRefDto, { session_id: '' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects properties the operation does not know', async () => {
    await expect(
      check(AssessmentRefDto, { assessment_id: 'ASS-1', extra: 1 }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      check(ResultRequestDto, { participant_id: 'P-1' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('applies the same rules as the HTTP body: a session outside the allowed days, an impossible date', async () => {
    const good = {
      workshop_id: 'WS-1',
      facilitator_id: 'FAC-1',
      topic_id: 'TOP-1',
      day: 2,
      date: '2026-09-21',
      time_slot: '08:00-09:00',
    };
    await expect(check(CreateSessionDto, good)).resolves.toBeInstanceOf(
      CreateSessionDto,
    );
    await expect(
      check(CreateSessionDto, { ...good, day: 31 }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      check(CreateSessionDto, { ...good, date: '2026-02-30' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('checks the body of an attendance request too, whole, with its session id', async () => {
    const body = {
      session_id: 'SES-1',
      records: [{ participant_id: 'P-1', status: 'present' }],
    };
    await expect(
      check(RecordAttendanceRequestDto, body),
    ).resolves.toBeInstanceOf(RecordAttendanceRequestDto);
    await expect(
      check(RecordAttendanceRequestDto, {
        ...body,
        records: [{ participant_id: 'P-1', status: 'late' }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      check(SubmitScoreRequestDto, {
        assessment_id: 'ASS-1',
        participant_id: 'P-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
