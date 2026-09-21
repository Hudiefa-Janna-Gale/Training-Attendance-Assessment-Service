// End-to-end tests of the RabbitMQ side: the same operations as the HTTP API, asked over a real
// RabbitMQ (docker compose `rabbitmq`) and answered from a real PostgreSQL.
//   (cd .. && docker compose up -d db rabbitmq) && npm run db:deploy && npm run test:e2e
//
// The app listens on a queue of its own, not the real one, so a running stack does not answer these
// requests; everything created here belongs to a throw-away workshop and is deleted afterwards.
import { INestApplication } from '@nestjs/common';
import {
  ClientProxy,
  ClientProxyFactory,
  Transport,
} from '@nestjs/microservices';
import { Test } from '@nestjs/testing';
import amqp from 'amqplib';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { firstValueFrom } from 'rxjs';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module.js';
import { configureApp } from './../src/app.setup.js';
import { connectBroker } from './../src/messaging/connect-broker.js';
import { PATTERNS } from './../src/messaging/patterns.js';
import { PrismaService } from './../src/prisma/prisma.service.js';

const BROKER =
  process.env.RABBITMQ_URL ??
  'amqp://training:training_dev_password@localhost:5672';
const RUN = Date.now().toString(36).toUpperCase();
const QUEUE = `training_e2e_${RUN}`;
const WS = `WS-E2E-RPC-${RUN}`;
const sid = (n: number) => `SES-E2E-RPC-${RUN}-${n}`;
const aid = (n: number) => `ASS-E2E-RPC-${RUN}-${n}`;

describe('RabbitMQ gateway (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let client: ClientProxy;
  const call = <T = any>(pattern: string, data: unknown = {}) =>
    firstValueFrom(client.send<T>(pattern, data));

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = configureApp(moduleRef.createNestApplication());
    connectBroker(app, BROKER, QUEUE);
    await app.startAllMicroservices();
    await app.init();
    prisma = app.get(PrismaService);

    client = ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: {
        urls: [BROKER],
        queue: QUEUE,
        queueOptions: { durable: true },
      },
    });
    await client.connect();
  });

  afterAll(async () => {
    await prisma.session.deleteMany({ where: { workshopId: WS } });
    await prisma.assessment.deleteMany({ where: { workshopId: WS } });
    await client.close();
    await app.close();
    const connection = await amqp.connect(BROKER);
    const channel = await connection.createChannel();
    await channel.deleteQueue(QUEUE);
    await connection.close();
  });

  it('runs the whole flow of the brief over RabbitMQ: session, attendance, final, score, result', async () => {
    const session = await call(PATTERNS.createSession, {
      session_id: sid(1),
      workshop_id: WS,
      day: 1,
      date: '2026-09-21',
      facilitator_id: 'FAC-001',
      topic_id: 'TOP-001',
      time_slot: '08:00–09:30',
    });
    expect(session).toEqual({
      session_id: sid(1),
      workshop_id: WS,
      day: 1,
      date: '2026-09-21',
      facilitator_id: 'FAC-001',
      topic_id: 'TOP-001',
      time_slot: '08:00–09:30',
    });

    expect(await call(PATTERNS.getSession, { session_id: sid(1) })).toEqual(
      session,
    );
    const listed = await call<any[]>(PATTERNS.listSessions);
    expect(listed.find((s) => s.session_id === sid(1))).toEqual(session);

    const saved = await call(PATTERNS.recordAttendance, {
      session_id: sid(1),
      records: [
        { participant_id: 'P-A', status: 'present' },
        { participant_id: 'P-B', status: 'absent' },
      ],
    });
    expect(saved).toEqual({
      session_id: sid(1),
      records: [
        { participant_id: 'P-A', status: 'present' },
        { participant_id: 'P-B', status: 'absent' },
      ],
    });
    expect(await call(PATTERNS.getAttendance, { session_id: sid(1) })).toEqual(
      saved,
    );

    const final = await call(PATTERNS.createAssessment, {
      assessment_id: aid(1),
      workshop_id: WS,
      title: 'Final',
      day: 3,
    });
    expect(final).toMatchObject({ assessment_id: aid(1), type: 'FINAL' });
    expect(
      (await call<any[]>(PATTERNS.listAssessments)).map((a) => a.assessment_id),
    ).toContain(aid(1));

    for (const participant_id of ['P-A', 'P-B']) {
      expect(
        await call(PATTERNS.submitScore, {
          assessment_id: aid(1),
          participant_id,
          score: 70,
        }),
      ).toMatchObject({ participant_id, score: 70, result: 'PASS' });
    }
    const scores = await call(PATTERNS.getScores, { assessment_id: aid(1) });
    expect(scores).toMatchObject({ assessment_id: aid(1), workshop_id: WS });
    expect(scores.scores).toHaveLength(2);

    // a one-day workshop: attending its day and passing the final is a PASS; the absent one fails
    expect(
      await call(PATTERNS.getResult, {
        participant_id: 'P-A',
        workshop_id: WS,
      }),
    ).toEqual({
      participant_id: 'P-A',
      workshop_id: WS,
      result: 'PASS',
      days_attended: 1,
      final_score: 70,
    });
    expect(
      await call(PATTERNS.getResult, {
        participant_id: 'P-B',
        workshop_id: WS,
      }),
    ).toMatchObject({
      result: 'FAIL',
      days_attended: 0,
    });
  });

  it('answers a failure with the status and words of the HTTP API', async () => {
    await expect(
      call(PATTERNS.getSession, { session_id: 'SES-DOES-NOT-EXIST' }),
    ).rejects.toMatchObject({
      status: 404,
      error: 'Not Found',
      messages: [expect.stringContaining('SES-DOES-NOT-EXIST')],
    });
    await expect(
      call(PATTERNS.getResult, {
        participant_id: 'P-1',
        workshop_id: 'WS-NOPE-RPC',
      }),
    ).rejects.toMatchObject({
      status: 404,
    });
    // the same session twice: 409, exactly as POST /sessions
    await expect(
      call(PATTERNS.createSession, {
        session_id: sid(1),
        workshop_id: WS,
        day: 2,
        date: '2026-09-22',
        facilitator_id: 'FAC-001',
        topic_id: 'TOP-001',
        time_slot: '08:00–09:30',
      }),
    ).rejects.toMatchObject({ status: 409 });
  });

  it('checks a request as strictly as the HTTP body', async () => {
    const good = {
      session_id: sid(2),
      workshop_id: WS,
      day: 2,
      date: '2026-09-22',
      facilitator_id: 'FAC-001',
      topic_id: 'TOP-001',
      time_slot: '08:00–09:30',
    };
    await expect(
      call(PATTERNS.createSession, { ...good, day: 31 }),
    ).rejects.toMatchObject({
      status: 400,
      messages: [expect.stringContaining('day')],
    });
    await expect(
      call(PATTERNS.createSession, { ...good, room: 'A1' }),
    ).rejects.toMatchObject({
      status: 400,
      messages: [expect.stringContaining('room')],
    });
    await expect(call(PATTERNS.getSession, {})).rejects.toMatchObject({
      status: 400,
    });
    // nothing was created by the rejected requests
    expect(await prisma.session.count({ where: { sessionId: sid(2) } })).toBe(
      0,
    );
  });

  it('does not know an operation that is not in the contract', async () => {
    await expect(call('workshops.list')).rejects.toBeTruthy();
  });

  it('speaks the plain wire format too: a request with a replyTo, an answer with a response', async () => {
    // What the web UI does (it has no NestJS client): publish { pattern, data, id } with a
    // replyTo and a correlationId, read { response } or { err } from the direct reply-to queue.
    const connection = await amqp.connect(BROKER);
    const channel = await connection.createChannel();
    try {
      const correlationId = randomUUID();
      const reply = new Promise<any>((resolve) => {
        void channel.consume(
          'amq.rabbitmq.reply-to',
          (message) => {
            if (message?.properties.correlationId === correlationId) {
              resolve(JSON.parse(message.content.toString()));
            }
          },
          { noAck: true },
        );
      });
      channel.sendToQueue(
        QUEUE,
        Buffer.from(
          JSON.stringify({
            pattern: PATTERNS.getSession,
            data: { session_id: sid(1) },
            id: correlationId,
          }),
        ),
        {
          correlationId,
          replyTo: 'amq.rabbitmq.reply-to',
          expiration: '10000',
        },
      );
      const packet = await reply;
      expect(packet.response).toMatchObject({
        session_id: sid(1),
        workshop_id: WS,
      });
      expect(packet.err).toBeUndefined();
    } finally {
      await connection.close();
    }
  });

  it('GET /health says whether the broker is connected', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200);
    expect(res.body).toEqual({
      status: 'ok',
      database: 'up',
      rabbitmq: 'connected',
    });
  });
});
