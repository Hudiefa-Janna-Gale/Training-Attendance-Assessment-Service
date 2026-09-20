// End-to-end tests against a real PostgreSQL (docker compose `db`, migrated).
//   (cd .. && docker compose up -d db) && npm run db:deploy && npm run test:e2e
//
// Every row created here belongs to a throw-away workshop and is deleted afterwards,
// so it is safe to run against your development database.
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module.js';
import { configureApp } from './../src/app.setup.js';
import { PrismaService } from './../src/prisma/prisma.service.js';

const RUN = Date.now().toString(36).toUpperCase();
const WS = `WS-E2E-${RUN}`; // main workshop
const WS_EMPTY = `WS-E2E-EMPTY-${RUN}`;
const sid = (n: number) => `SES-E2E-${RUN}-${n}`;
const aid = (n: number) => `ASS-E2E-${RUN}-${n}`;

describe('Training, Attendance & Assessment Service (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = configureApp(moduleRef.createNestApplication());
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    // Attendance and scores go with their sessions / assessments (ON DELETE CASCADE).
    await prisma.session.deleteMany({
      where: { workshopId: { in: [WS, WS_EMPTY] } },
    });
    await prisma.assessment.deleteMany({
      where: { workshopId: { in: [WS, WS_EMPTY] } },
    });
    await app.close();
  });

  describe('service', () => {
    it("exposes nothing beyond the brief's endpoints (no root page, no list or workshop routes)", async () => {
      for (const route of [
        '/',
        '/sessions',
        '/assessments',
        '/workshops',
        '/workshops/WS-1/results',
      ]) {
        await http().get(route).expect(404);
      }
    });

    it('GET /health reports the database as up', async () => {
      await http().get('/health').expect(200, { status: 'ok', database: 'up' });
    });
  });

  describe('sessions', () => {
    const body = (over: object = {}) => ({
      session_id: sid(1),
      workshop_id: WS,
      day: 1,
      date: '2025-09-01',
      facilitator_id: 'FAC-001',
      topic_id: 'TOP-001',
      time_slot: '08:00–09:30',
      ...over,
    });

    it("POST /sessions creates a session exactly as in the brief's sample data", async () => {
      const res = await http().post('/sessions').send(body()).expect(201);
      expect(res.body).toEqual(body()); // exactly the brief's fields, nothing more
    });

    it('GET /sessions/:id returns it (date round-trips as YYYY-MM-DD)', async () => {
      const res = await http()
        .get(`/sessions/${sid(1)}`)
        .expect(200);
      expect(res.body).toMatchObject({
        session_id: sid(1),
        date: '2025-09-01',
        day: 1,
        time_slot: '08:00–09:30',
      });
    });

    it('GET /sessions/:id → 404 for an unknown session', async () => {
      await http().get('/sessions/SES-DOES-NOT-EXIST').expect(404);
    });

    it('generates SES-nnn ids when session_id is omitted, and canonicalises the time slot', async () => {
      const res = await http()
        .post('/sessions')
        .send(
          body({
            session_id: undefined,
            day: 2,
            date: '2025-09-02',
            time_slot: '10:00 - 11:00',
          }),
        )
        .expect(201);
      expect(res.body.session_id).toMatch(/^SES-\d{3,}$/);
      expect(res.body.time_slot).toBe('10:00–11:00');
    });

    it('409 for a duplicate session_id', async () => {
      await http()
        .post('/sessions')
        .send(body({ day: 3, time_slot: '13:00–14:00' }))
        .expect(409);
    });

    it('409 when the workshop already has a session in that day and time slot', async () => {
      const res = await http()
        .post('/sessions')
        .send(body({ session_id: sid(99), time_slot: '08:00-09:30' })) // same slot, hyphen spelling
        .expect(409);
      expect(res.body.message).toContain(sid(1));
    });

    it.each([
      ['day 0', { day: 0 }],
      ['day 4', { day: 4 }],
      ['non-integer day', { day: 1.5 }],
      ['day as a string', { day: '1' }],
      ['impossible date', { date: '2025-02-30' }],
      ['date with a time part', { date: '2025-09-01T08:00:00Z' }],
      ['slot ending before it starts', { time_slot: '10:00–09:00' }],
      ['malformed slot', { time_slot: 'morning' }],
      ['missing facilitator', { facilitator_id: undefined }],
      ['unsafe id characters', { topic_id: 'TOP 001; DROP TABLE' }],
      ['unknown property', { room: 'A1' }],
    ])('400 for %s', async (_label, over) => {
      await http()
        .post('/sessions')
        .send(body({ session_id: sid(98), ...over }))
        .expect(400);
    });
  });

  describe('attendance', () => {
    it("POST /sessions/:id/attendance records the brief's sample and returns the list", async () => {
      const res = await http()
        .post(`/sessions/${sid(1)}/attendance`)
        .send({
          records: [
            { participant_id: 'P-001', status: 'present' },
            { participant_id: 'P-002', status: 'absent' },
            { participant_id: 'P-003', status: 'present' },
          ],
        })
        .expect(201);

      expect(res.body).toEqual({
        session_id: sid(1),
        records: [
          { participant_id: 'P-001', status: 'present' },
          { participant_id: 'P-002', status: 'absent' },
          { participant_id: 'P-003', status: 'present' },
        ],
      });
    });

    it('GET /sessions/:id/attendance returns the records, sorted by participant', async () => {
      const res = await http()
        .get(`/sessions/${sid(1)}/attendance`)
        .expect(200);
      expect(
        res.body.records.map((r: any) => [r.participant_id, r.status]),
      ).toEqual([
        ['P-001', 'present'],
        ['P-002', 'absent'],
        ['P-003', 'present'],
      ]);
    });

    it('re-posting a participant corrects the status instead of creating a second record', async () => {
      const res = await http()
        .post(`/sessions/${sid(1)}/attendance`)
        .send({ records: [{ participant_id: 'P-002', status: 'excused' }] })
        .expect(201);

      expect(res.body.records).toEqual([
        { participant_id: 'P-001', status: 'present' },
        { participant_id: 'P-002', status: 'excused' },
        { participant_id: 'P-003', status: 'present' },
      ]);
      expect(
        await prisma.attendanceRecord.count({
          where: { sessionId: sid(1), participantId: 'P-002' },
        }),
      ).toBe(1);
    });

    it('404 for an unknown session (POST and GET)', async () => {
      await http()
        .post('/sessions/SES-NOPE/attendance')
        .send({ records: [{ participant_id: 'P-001', status: 'present' }] })
        .expect(404);
      await http().get('/sessions/SES-NOPE/attendance').expect(404);
    });

    it.each([
      [
        'unknown status',
        { records: [{ participant_id: 'P-001', status: 'late' }] },
      ],
      [
        'duplicate participant in one request',
        {
          records: [
            { participant_id: 'P-001', status: 'present' },
            { participant_id: 'P-001', status: 'absent' },
          ],
        },
      ],
      ['empty list', { records: [] }],
      ['missing records', {}],
      ['missing participant_id', { records: [{ status: 'present' }] }],
    ])('400 for %s', async (_label, payload) => {
      await http()
        .post(`/sessions/${sid(1)}/attendance`)
        .send(payload)
        .expect(400);
    });

    it('is all-or-nothing: an invalid entry stores nothing from the request', async () => {
      await http()
        .post(`/sessions/${sid(1)}/attendance`)
        .send({
          records: [
            { participant_id: 'P-ATOMIC', status: 'present' },
            { participant_id: 'P-BAD', status: 'nope' },
          ],
        })
        .expect(400);
      expect(
        await prisma.attendanceRecord.count({
          where: { participantId: 'P-ATOMIC' },
        }),
      ).toBe(0);
    });
  });

  describe('assessments and scores', () => {
    it("POST /assessments creates the final exactly as in the brief's sample data", async () => {
      const res = await http()
        .post('/assessments')
        .send({
          assessment_id: aid(1),
          workshop_id: WS,
          title: 'Day 3 Final Assessment',
          day: 3,
          total_marks: 100,
          pass_mark: 60,
        })
        .expect(201);
      expect(res.body).toMatchObject({
        assessment_id: aid(1),
        type: 'FINAL',
        total_marks: 100,
        pass_mark: 60,
      });
    });

    it('defaults total_marks=100, pass_mark=60 and generates an ASS-nnn id', async () => {
      const res = await http()
        .post('/assessments')
        .send({ workshop_id: WS, title: 'Day 1 quiz', day: 1 })
        .expect(201);
      expect(res.body).toMatchObject({
        type: 'QUIZ',
        total_marks: 100,
        pass_mark: 60,
      });
      expect(res.body.assessment_id).toMatch(/^ASS-\d{3,}$/);
    });

    it('409 for a second FINAL in the same workshop, but other workshops can have their own', async () => {
      await http()
        .post('/assessments')
        .send({ workshop_id: WS, title: 'Another final', day: 3 })
        .expect(409);
      await http()
        .post('/assessments')
        .send({ workshop_id: WS_EMPTY, title: 'Final', day: 3 })
        .expect(201);
    });

    it('400 for a FINAL that is not on day 3, or pass_mark above total_marks', async () => {
      await http()
        .post('/assessments')
        .send({ workshop_id: WS, title: 'x', day: 2, type: 'FINAL' })
        .expect(400);
      await http()
        .post('/assessments')
        .send({
          workshop_id: WS,
          title: 'x',
          day: 1,
          total_marks: 50,
          pass_mark: 60,
        })
        .expect(400);
    });

    it('POST /assessments/:id/scores stores the score with a computed PASS/FAIL', async () => {
      const post = (participant_id: string, score: number) =>
        http()
          .post(`/assessments/${aid(1)}/scores`)
          .send({ participant_id, score });

      expect((await post('P-001', 82).expect(201)).body).toMatchObject({
        result: 'PASS',
        score: 82,
      });
      expect((await post('P-002', 45).expect(201)).body).toMatchObject({
        result: 'FAIL',
        score: 45,
      });
      expect((await post('P-003', 71).expect(201)).body).toMatchObject({
        result: 'PASS',
        score: 71,
      });
      expect((await post('P-060', 60).expect(201)).body.result).toBe('PASS'); // exactly the pass mark
      expect((await post('P-059', 59).expect(201)).body.result).toBe('FAIL');
    });

    it("GET /assessments/:id/scores returns the assessment with its scores, like the brief's sample", async () => {
      const res = await http()
        .get(`/assessments/${aid(1)}/scores`)
        .expect(200);
      expect(res.body).toMatchObject({
        assessment_id: aid(1),
        workshop_id: WS,
        title: 'Day 3 Final Assessment',
        day: 3,
        total_marks: 100,
        pass_mark: 60,
      });
      expect(res.body.scores).toHaveLength(5);
      expect(Object.keys(res.body.scores[0]).sort()).toEqual([
        'participant_id',
        'result',
        'score',
      ]);
      expect(res.body.scores).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            participant_id: 'P-001',
            score: 82,
            result: 'PASS',
          }),
        ]),
      );
    });

    it('409 when a participant is scored twice for the same assessment', async () => {
      await http()
        .post(`/assessments/${aid(1)}/scores`)
        .send({ participant_id: 'P-001', score: 99 })
        .expect(409);
      expect(
        (await http().get(`/assessments/${aid(1)}/scores`)).body.scores.find(
          (s: any) => s.participant_id === 'P-001',
        ).score,
      ).toBe(82);
    });

    it.each([
      ['score above total_marks', { participant_id: 'P-9', score: 101 }],
      ['negative score', { participant_id: 'P-9', score: -1 }],
      ['fractional score', { participant_id: 'P-9', score: 70.5 }],
      ['score as a string', { participant_id: 'P-9', score: '70' }],
      ['missing participant_id', { score: 70 }],
      [
        'unknown property',
        { participant_id: 'P-9', score: 70, result: 'PASS' },
      ], // clients cannot set the result
    ])('400 for %s', async (_label, payload) => {
      await http()
        .post(`/assessments/${aid(1)}/scores`)
        .send(payload)
        .expect(400);
    });

    it('404 for an unknown assessment (POST and GET)', async () => {
      await http()
        .post('/assessments/ASS-NOPE/scores')
        .send({ participant_id: 'P-1', score: 50 })
        .expect(404);
      await http().get('/assessments/ASS-NOPE/scores').expect(404);
    });
  });

  describe('final PASS/FAIL results', () => {
    const result = (participant: string, workshop = WS) =>
      http()
        .get(`/participants/${participant}/results/${workshop}`)
        .expect(200)
        .then((r) => r.body);

    beforeAll(async () => {
      // Two more days for the same workshop. Day 2 has TWO sessions to prove a day counts once.
      const day = (n: number, slot: string, id: string) =>
        http()
          .post('/sessions')
          .send({
            session_id: id,
            workshop_id: WS,
            day: n,
            date: `2025-09-0${n}`,
            facilitator_id: 'FAC-002',
            topic_id: 'TOP-003',
            time_slot: slot,
          })
          .expect(201);
      await day(2, '08:00–10:00', sid(2));
      await day(2, '10:30–12:00', sid(22));
      await day(3, '08:00–10:00', sid(3));

      // day 1 (sid 1) already has P-001 present, P-002 excused, P-003 present.
      const mark = (session: string, records: [string, string][]) =>
        http()
          .post(`/sessions/${session}/attendance`)
          .send({
            records: records.map(([participant_id, status]) => ({
              participant_id,
              status,
            })),
          })
          .expect(201);
      await mark(sid(2), [
        ['P-001', 'present'],
        ['P-002', 'absent'],
        ['P-003', 'absent'],
      ]);
      await mark(sid(22), [
        ['P-001', 'present'],
        ['P-002', 'excused'],
        ['P-003', 'absent'],
      ]);
      await mark(sid(3), [
        ['P-001', 'present'],
        ['P-002', 'present'],
        ['P-003', 'present'],
      ]);
      // P-059 / P-060: present on day 1 only ⇒ 1 day attended
      await mark(sid(1), [
        ['P-059', 'present'],
        ['P-060', 'present'],
      ]);
    });

    it('PASS — attended all 3 days, scored 82', async () => {
      expect(await result('P-001')).toEqual({
        participant_id: 'P-001',
        workshop_id: WS,
        result: 'PASS',
        days_attended: 3,
        final_score: 82,
      });
    });

    it('FAIL — scored 45 and attended only day 3 (excused/absent do not count)', async () => {
      expect(await result('P-002')).toMatchObject({
        result: 'FAIL',
        days_attended: 1,
        final_score: 45,
      });
    });

    it('PASS — exactly 2 days (days 1 and 3) and scored 71', async () => {
      expect(await result('P-003')).toMatchObject({
        result: 'PASS',
        days_attended: 2,
        final_score: 71,
      });
    });

    it('FAIL — scored exactly 60 (a pass on the score) but attended only 1 day', async () => {
      expect(await result('P-060')).toMatchObject({
        result: 'FAIL',
        days_attended: 1,
        final_score: 60,
      });
    });

    it('FAIL — attended 2 days but has no final score ("otherwise their result is FAIL")', async () => {
      await http()
        .post(`/sessions/${sid(3)}/attendance`)
        .send({ records: [{ participant_id: 'P-777', status: 'present' }] })
        .expect(201);
      await http()
        .post(`/sessions/${sid(1)}/attendance`)
        .send({ records: [{ participant_id: 'P-777', status: 'present' }] })
        .expect(201);

      expect(await result('P-777')).toMatchObject({
        result: 'FAIL',
        days_attended: 2,
        final_score: null,
      });
    });

    it('an unknown participant in a known workshop has 0 days attended and FAILs', async () => {
      expect(await result('P-NEVER-SEEN')).toMatchObject({
        result: 'FAIL',
        days_attended: 0,
        final_score: null,
      });
    });

    it('404 when the workshop is unknown to this service', async () => {
      await http()
        .get('/participants/P-001/results/WS-DOES-NOT-EXIST')
        .expect(404);
    });

    it('the result changes when attendance is corrected (P-002 excused → present on day 1)', async () => {
      await http()
        .post(`/sessions/${sid(1)}/attendance`)
        .send({ records: [{ participant_id: 'P-002', status: 'present' }] })
        .expect(201);
      // now days 1 and 3 ⇒ attendance met, but score is still 45
      expect(await result('P-002')).toMatchObject({
        result: 'FAIL',
        days_attended: 2,
        final_score: 45,
      });
    });
  });
});
