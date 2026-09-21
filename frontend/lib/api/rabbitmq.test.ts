import { EventEmitter } from "node:events";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// A stand-in for amqplib: a connection and a channel that record what is sent and let a test answer.
class FakeChannel extends EventEmitter {
  replyHandler?: (message: unknown) => void;
  sent: { queue: string; body: { pattern: string; data: unknown; id: string }; options: Record<string, unknown> }[] = [];
  consumers = 1;
  consume = vi.fn(async (_queue: string, handler: (message: unknown) => void) => {
    this.replyHandler = handler;
    return { consumerTag: "tag" };
  });
  assertQueue = vi.fn(async (queue: string) => ({ queue, messageCount: 0, consumerCount: this.consumers }));
  sendToQueue = vi.fn((queue: string, content: Buffer, options: Record<string, unknown>) => {
    this.sent.push({ queue, body: JSON.parse(content.toString()), options });
    return true;
  });

  /** The service answers request number `index` (or any packet, for a stray reply). */
  answer(packet: unknown, correlationId = this.sent.at(-1)?.body.id) {
    this.replyHandler?.({ content: Buffer.from(JSON.stringify(packet)), properties: { correlationId } });
  }
}

class FakeConnection extends EventEmitter {
  channel = new FakeChannel();
  createChannel = vi.fn(async () => this.channel);
  close = vi.fn(async () => undefined);
}

const { connect } = vi.hoisted(() => ({ connect: vi.fn() }));
vi.mock("amqplib", () => ({ default: { connect } }));

import { brokerUrl, describeBroker, requestQueue, rpcCall, RpcFailure, RpcUnavailable, timeoutMs } from "./rabbitmq";

const KEY = Symbol.for("training-hub.rabbitmq");
/** Let pending promise callbacks run. */
const flush = async () => {
  for (let i = 0; i < 20; i++) await Promise.resolve();
};

let connection: FakeConnection;

beforeEach(() => {
  delete (globalThis as Record<symbol, unknown>)[KEY]; // no connection carried over from another test
  connection = new FakeConnection();
  connect.mockReset();
  connect.mockResolvedValue(connection);
  vi.stubEnv("RABBITMQ_URL", "amqp://user:secret@broker.test:5672");
  vi.stubEnv("RABBITMQ_QUEUE", "training_queue");
  vi.stubEnv("RABBITMQ_TIMEOUT_MS", "");
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe("settings", () => {
  it("reads the broker, queue and timeout from the environment, with working defaults", () => {
    expect(brokerUrl()).toBe("amqp://user:secret@broker.test:5672");
    expect(requestQueue()).toBe("training_queue");
    expect(timeoutMs()).toBe(10_000);

    vi.stubEnv("RABBITMQ_URL", "");
    vi.stubEnv("RABBITMQ_QUEUE", "");
    vi.stubEnv("RABBITMQ_TIMEOUT_MS", "2500");
    expect(brokerUrl()).toBe("amqp://training:training_dev_password@localhost:5672");
    expect(requestQueue()).toBe("training_attendance_assessment");
    expect(timeoutMs()).toBe(2500);
  });

  it.each(["0", "-5", "abc", "1.5"])("falls back to the default timeout for %j", (value) => {
    vi.stubEnv("RABBITMQ_TIMEOUT_MS", value);
    expect(timeoutMs()).toBe(10_000);
  });

  it("describes the broker without its credentials", () => {
    expect(describeBroker("amqp://user:secret@broker.test:5672/vhost")).toBe("amqp://broker.test:5672");
    expect(describeBroker("amqps://user:secret@broker.test")).toBe("amqps://broker.test");
    expect(describeBroker("not a url")).toBe("RabbitMQ");
  });
});

describe("rpcCall", () => {
  it("sends { pattern, data, id } to the queue and resolves with the reply's response", async () => {
    const reply = rpcCall("sessions.get", { session_id: "SES-001" });
    await flush();

    const { channel } = connection;
    expect(channel.consume).toHaveBeenCalledWith("amq.rabbitmq.reply-to", expect.any(Function), { noAck: true });
    expect(channel.sent).toHaveLength(1);
    const [{ queue, body, options }] = channel.sent;
    expect(queue).toBe("training_queue");
    expect(body).toEqual({ pattern: "sessions.get", data: { session_id: "SES-001" }, id: expect.any(String) });
    expect(options).toMatchObject({
      correlationId: body.id,
      replyTo: "amq.rabbitmq.reply-to",
      expiration: "10000",
      contentType: "application/json",
    });

    channel.answer({ response: { session_id: "SES-001" }, isDisposed: true });
    await expect(reply).resolves.toEqual({ session_id: "SES-001" });
  });

  it("declares the queue the way the service does, and connects once for many calls", async () => {
    const first = rpcCall("sessions.list", {});
    await flush();
    connection.channel.answer({ response: [] });
    await first;

    const second = rpcCall("sessions.list", {});
    await flush();
    connection.channel.answer({ response: [] });
    await second;

    expect(connect).toHaveBeenCalledTimes(1);
    expect(connect).toHaveBeenCalledWith("amqp://user:secret@broker.test:5672");
    expect(connection.channel.assertQueue).toHaveBeenCalledWith("training_queue", { durable: true });
  });

  it("matches each answer to its own request, whatever the order they come back in", async () => {
    const a = rpcCall("sessions.get", { session_id: "A" });
    const b = rpcCall("sessions.get", { session_id: "B" });
    await flush();
    const [first, second] = connection.channel.sent;

    connection.channel.answer({ response: "answer for B" }, second.body.id);
    connection.channel.answer({ response: "answer for A" }, first.body.id);

    await expect(a).resolves.toBe("answer for A");
    await expect(b).resolves.toBe("answer for B");
  });

  it("rejects with the service's failure, untouched", async () => {
    const reply = rpcCall("sessions.get", { session_id: "SES-9" });
    const failure = { status: 404, error: "Not Found", messages: ["Session SES-9 not found"] };
    await flush();

    connection.channel.answer({ err: failure, isDisposed: true });

    const error = await reply.catch((e: RpcFailure) => e);
    expect(error).toBeInstanceOf(RpcFailure);
    expect((error as RpcFailure).failure).toEqual(failure);
  });

  it("resolves an empty answer (only { isDisposed }) with undefined", async () => {
    const reply = rpcCall("sessions.get", {});
    await flush();

    connection.channel.answer({ isDisposed: true });

    await expect(reply).resolves.toBeUndefined();
  });

  it("ignores a repeat, or an answer nobody is waiting for", async () => {
    const reply = rpcCall("sessions.list", {});
    await flush();

    connection.channel.answer({ response: ["once"] });
    connection.channel.answer({ isDisposed: true }); // the service ends the stream separately
    connection.channel.answer({ response: ["stray"] }, "someone-elses-id");
    connection.channel.answer({ response: ["no id at all"] }, undefined);

    await expect(reply).resolves.toEqual(["once"]);
  });

  it("rejects a reply it cannot read", async () => {
    const reply = rpcCall("sessions.list", {});
    await flush();
    const { id } = connection.channel.sent[0].body;

    connection.channel.replyHandler?.({ content: Buffer.from("<html>"), properties: { correlationId: id } });

    await expect(reply).rejects.toBeInstanceOf(RpcFailure);
  });

  it("gives up when the service does not answer in time, and ignores a late answer", async () => {
    vi.useFakeTimers();
    vi.stubEnv("RABBITMQ_TIMEOUT_MS", "3000");
    const reply = rpcCall("sessions.list", {});
    const outcome = reply.catch((e: unknown) => e);
    await flush();
    expect(connection.channel.sent[0].options.expiration).toBe("3000");

    await vi.advanceTimersByTimeAsync(3000);

    const error = await outcome;
    expect(error).toBeInstanceOf(RpcUnavailable);
    expect((error as Error).message).toBe("No answer from the service within 3 seconds");
    expect(() => connection.channel.answer({ response: ["too late"] })).not.toThrow();
  });

  it("fails at once when nothing is listening on the queue", async () => {
    connection.channel.consumers = 0;

    const error = await rpcCall("sessions.list", {}).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(RpcUnavailable);
    expect((error as Error).message).toBe('Nothing is listening on the queue "training_queue", so the service is not running');
    expect(connection.channel.sent).toHaveLength(0); // nothing was sent that could be carried out later
  });

  it("reports a broker that cannot be reached, and tries again on the next call", async () => {
    connect.mockRejectedValueOnce(new Error("connect ECONNREFUSED 127.0.0.1:5672"));

    await expect(rpcCall("sessions.list", {})).rejects.toMatchObject({
      name: "RpcUnavailable",
      message: "connect ECONNREFUSED 127.0.0.1:5672",
    });

    const reply = rpcCall("sessions.list", {});
    await flush();
    connection.channel.answer({ response: ["back"] });
    await expect(reply).resolves.toEqual(["back"]);
    expect(connect).toHaveBeenCalledTimes(2);
  });

  it("tells requests still waiting when the connection is lost, and connects again for the next one", async () => {
    const waiting = rpcCall("sessions.list", {});
    const outcome = waiting.catch((e: unknown) => e);
    await flush();

    connection.emit("close", new Error("CONNECTION_FORCED"));

    const error = await outcome;
    expect(error).toBeInstanceOf(RpcUnavailable);
    expect((error as Error).message).toBe("CONNECTION_FORCED");

    // the next request opens a new connection
    const second = new FakeConnection();
    connect.mockResolvedValue(second);
    const again = rpcCall("sessions.list", {});
    await flush();
    second.channel.answer({ response: ["reconnected"] });
    await expect(again).resolves.toEqual(["reconnected"]);
    expect(connect).toHaveBeenCalledTimes(2);
  });

  it("closes the connection when its channel fails, and does not let an 'error' event escape", async () => {
    const first = rpcCall("sessions.list", {});
    await flush();
    connection.channel.answer({ response: [] });
    await first;

    expect(() => connection.emit("error", new Error("socket hang up"))).not.toThrow();
    connection.channel.emit("error", new Error("PRECONDITION_FAILED")); // a repeat changes nothing

    expect(connection.close).toHaveBeenCalledTimes(1);
  });

  it("reports a request that cannot be sent", async () => {
    connection.channel.sendToQueue.mockImplementation(() => {
      throw new Error("Channel closed");
    });

    await expect(rpcCall("sessions.list", {})).rejects.toMatchObject({ name: "RpcUnavailable", message: "Channel closed" });
  });
});
