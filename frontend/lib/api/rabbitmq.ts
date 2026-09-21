// Server-side RabbitMQ transport to the Training, Attendance & Assessment Service.
//
// The web UI does not call the service over HTTP. Its server sends each request to the service's
// queue on RabbitMQ and waits for the reply: a message { pattern, data, id } with a replyTo and a
// correlationId (the wire format of NestJS's RabbitMQ transport), answered by { response } or
// { err }. RabbitMQ is the gateway between the two. Only Server Components and Server Actions
// import this, so the browser never talks to RabbitMQ.

import { randomUUID } from "node:crypto";
import amqp, { type Channel, type ConsumeMessage } from "amqplib";

const DEFAULT_URL = "amqp://training:training_dev_password@localhost:5672";
const DEFAULT_QUEUE = "training_attendance_assessment";
/** RabbitMQ's "direct reply-to": answers come back on this pseudo-queue, no queue to create. */
const REPLY_QUEUE = "amq.rabbitmq.reply-to";

export function brokerUrl(): string {
  return process.env.RABBITMQ_URL || DEFAULT_URL;
}

export function requestQueue(): string {
  return process.env.RABBITMQ_QUEUE || DEFAULT_QUEUE;
}

/** How long a request may wait for its answer, and for a message to stay queued. */
export function timeoutMs(): number {
  const value = Number(process.env.RABBITMQ_TIMEOUT_MS);
  return Number.isInteger(value) && value > 0 ? value : 10_000;
}

/** The broker's address without the password, for messages people read. */
export function describeBroker(url = brokerUrl()): string {
  try {
    const { protocol, hostname, port } = new URL(url);
    return `${protocol}//${hostname}${port ? `:${port}` : ""}`;
  } catch {
    return "RabbitMQ";
  }
}

/** RabbitMQ could not be reached, or the service did not answer in time. */
export class RpcUnavailable extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RpcUnavailable";
  }
}

/** The service answered, and the answer is a failure (`err` in its reply). */
export class RpcFailure extends Error {
  constructor(readonly failure: unknown) {
    super("The service answered with a failure");
    this.name = "RpcFailure";
  }
}

interface Waiting {
  resolve: (value: unknown) => void;
  reject: (error: unknown) => void;
  timer: NodeJS.Timeout;
}

interface Rpc {
  channel: Channel;
  /** Requests sent and not yet answered, by correlation id. */
  waiting: Map<string, Waiting>;
}

// One connection per server process, kept on globalThis so that a hot reload (development) or a
// second copy of this module does not open another one.
const KEY = Symbol.for("training-hub.rabbitmq");
const shared = globalThis as typeof globalThis & { [KEY]?: Promise<Rpc> };

/** Takes a request off the waiting list (when answered, timed out or failed); undefined if it is gone. */
function settle(rpc: Rpc, id: string): Waiting | undefined {
  const waiting = rpc.waiting.get(id);
  if (waiting) {
    clearTimeout(waiting.timer);
    rpc.waiting.delete(id);
  }
  return waiting;
}

function onReply(rpc: Rpc, message: ConsumeMessage | null) {
  const id = message?.properties.correlationId as string | undefined;
  if (!message || !id) return;
  const waiting = settle(rpc, id);
  if (!waiting) return; // it timed out already, or the reply is a repeat

  let packet: { response?: unknown; err?: unknown };
  try {
    packet = JSON.parse(message.content.toString("utf8"));
  } catch {
    waiting.reject(new RpcFailure({ message: "The service sent a reply that cannot be read" }));
    return;
  }
  // { response } is an answer, { err } a failure, { isDisposed } alone the end of an empty answer.
  if (packet.err !== undefined) waiting.reject(new RpcFailure(packet.err));
  else waiting.resolve(packet.response);
}

async function open(forget: () => void): Promise<Rpc> {
  const connection = await amqp.connect(brokerUrl());
  const waiting = new Map<string, Waiting>();
  let lostAlready = false;

  // The connection or its channel is gone: forget it (the next request connects again), close what
  // is left of it, and tell every request still waiting.
  const lost = (error?: unknown) => {
    if (lostAlready) return;
    lostAlready = true;
    forget();
    void connection.close().catch(() => undefined);
    const reason = error instanceof Error ? error.message : "The RabbitMQ connection was lost";
    for (const [id, entry] of waiting) {
      clearTimeout(entry.timer);
      waiting.delete(id);
      entry.reject(new RpcUnavailable(reason));
    }
  };
  connection.on("error", lost); // an unhandled "error" event would stop the whole server
  connection.on("close", lost);

  try {
    const channel = await connection.createChannel();
    channel.on("error", lost);
    channel.on("close", lost);
    const rpc: Rpc = { channel, waiting };
    await channel.consume(REPLY_QUEUE, (message) => onReply(rpc, message), { noAck: true });
    return rpc;
  } catch (error) {
    lost(error);
    throw error;
  }
}

function connect(): Promise<Rpc> {
  let current = shared[KEY];
  if (!current) {
    const attempt: Promise<Rpc> = open(() => {
      if (shared[KEY] === attempt) delete shared[KEY];
    }).catch((error: unknown) => {
      if (shared[KEY] === attempt) delete shared[KEY]; // try again on the next request
      throw new RpcUnavailable(error instanceof Error ? error.message : "Could not connect to RabbitMQ");
    });
    shared[KEY] = current = attempt;
  }
  return current;
}

/**
 * Sends one request to the service and waits for its answer. Resolves with the reply's `response`,
 * rejects with RpcFailure (the service said no) or RpcUnavailable (no broker, nobody listening, no
 * answer in time).
 */
export async function rpcCall(pattern: string, data: unknown): Promise<unknown> {
  const rpc = await connect();
  const queue = requestQueue();
  const ttl = timeoutMs();

  // Declaring the queue is what the service does too (same settings, so this is a no-op when it is
  // running) and it reports how many consumers the queue has: with none, the service is not running,
  // and there is no point waiting for an answer that cannot come.
  const { consumerCount } = await rpc.channel.assertQueue(queue, { durable: true });
  if (consumerCount === 0) {
    throw new RpcUnavailable(`Nothing is listening on the queue "${queue}", so the service is not running`);
  }

  const id = randomUUID();
  return new Promise<unknown>((resolve, reject) => {
    const timer = setTimeout(() => {
      settle(rpc, id);
      reject(new RpcUnavailable(`No answer from the service within ${Math.round(ttl / 1000)} seconds`));
    }, ttl);
    rpc.waiting.set(id, { resolve, reject, timer });

    try {
      // `expiration`: RabbitMQ drops a request nobody took in time, so that one this caller has
      // already given up on is not carried out later.
      rpc.channel.sendToQueue(queue, Buffer.from(JSON.stringify({ pattern, data, id })), {
        correlationId: id,
        replyTo: REPLY_QUEUE,
        expiration: String(ttl),
        contentType: "application/json",
      });
    } catch (error) {
      settle(rpc, id);
      reject(new RpcUnavailable(error instanceof Error ? error.message : "The request could not be sent"));
    }
  });
}
