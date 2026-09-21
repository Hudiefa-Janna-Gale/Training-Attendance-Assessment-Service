// The transport against a real RabbitMQ (docker compose up -d rabbitmq), with a small stand-in for the
// Training service on a queue of its own. Skipped when no broker answers, so `npm test` needs nothing.
import amqp, { type Channel, type ChannelModel, type ConsumeMessage } from "amqplib";
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const URL = process.env.RABBITMQ_URL || "amqp://training:training_dev_password@localhost:5672";

async function tryConnect(): Promise<ChannelModel | null> {
  try {
    return await Promise.race([
      amqp.connect(URL),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500)),
    ]);
  } catch {
    return null;
  }
}

const service = await tryConnect();

describe.skipIf(!service)("rpcCall against a real RabbitMQ", () => {
  const queue = `training_web_test_${randomUUID().slice(0, 8)}`;
  let channel: Channel;
  let consumerTag: string;
  let received: { pattern: string; data: unknown }[] = [];
  let behaviour: (request: { pattern: string; data: unknown }) => unknown = () => ({ response: null });

  // What the real service does: read { pattern, data, id }, answer on replyTo with the same correlationId.
  const answer = (message: ConsumeMessage | null) => {
    if (!message) return;
    const request = JSON.parse(message.content.toString());
    received.push({ pattern: request.pattern, data: request.data });
    const reply = behaviour(request);
    if (reply === undefined) return; // says nothing at all
    channel.sendToQueue(message.properties.replyTo, Buffer.from(JSON.stringify(reply)), {
      correlationId: message.properties.correlationId,
    });
    channel.ack(message);
  };

  beforeAll(async () => {
    vi.stubEnv("RABBITMQ_URL", URL);
    vi.stubEnv("RABBITMQ_QUEUE", queue);
    vi.stubEnv("RABBITMQ_TIMEOUT_MS", "1500");
    channel = await service!.createChannel();
    await channel.assertQueue(queue, { durable: true });
    consumerTag = (await channel.consume(queue, answer)).consumerTag;
  });

  afterAll(async () => {
    await channel?.deleteQueue(queue).catch(() => undefined);
    await service?.close().catch(() => undefined);
    vi.unstubAllEnvs();
  });

  it("sends the pattern and data and gets the response back", async () => {
    behaviour = ({ data }) => ({ response: { echoed: data }, isDisposed: true });
    received = [];
    const { rpcCall } = await import("./rabbitmq");

    await expect(rpcCall("sessions.get", { session_id: "SES-001" })).resolves.toEqual({
      echoed: { session_id: "SES-001" },
    });

    expect(received).toEqual([{ pattern: "sessions.get", data: { session_id: "SES-001" } }]);
  });

  it("handles many requests at once, each getting its own answer", async () => {
    behaviour = ({ data }) => ({ response: data, isDisposed: true });
    const { rpcCall } = await import("./rabbitmq");

    const answers = await Promise.all(Array.from({ length: 25 }, (_, n) => rpcCall("sessions.get", { n })));

    expect(answers).toEqual(Array.from({ length: 25 }, (_, n) => ({ n })));
  });

  it("rejects with the failure the service sent", async () => {
    const failure = { status: 404, error: "Not Found", messages: ["Session SES-9 not found"] };
    behaviour = () => ({ err: failure, isDisposed: true });
    const { rpcCall, RpcFailure } = await import("./rabbitmq");

    const error = await rpcCall("sessions.get", { session_id: "SES-9" }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(RpcFailure);
    expect((error as InstanceType<typeof RpcFailure>).failure).toEqual(failure);
  });

  it("times out when the service takes the request and never answers", async () => {
    behaviour = () => undefined;
    const { rpcCall } = await import("./rabbitmq");

    await expect(rpcCall("sessions.list", {})).rejects.toMatchObject({
      name: "RpcUnavailable",
      message: "No answer from the service within 2 seconds",
    });
  });

  it("fails at once when the service is not listening", async () => {
    await channel.cancel(consumerTag);
    const { rpcCall } = await import("./rabbitmq");

    const started = Date.now();
    await expect(rpcCall("sessions.list", {})).rejects.toMatchObject({
      name: "RpcUnavailable",
      message: `Nothing is listening on the queue "${queue}", so the service is not running`,
    });

    expect(Date.now() - started).toBeLessThan(1000);
  });
});
