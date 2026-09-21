import { beforeEach, describe, expect, it, vi } from "vitest";

const { rpcCall, connection } = vi.hoisted(() => ({
  rpcCall: vi.fn(),
  connection: vi.fn(async () => undefined),
}));

// The transport is replaced (its own tests are in rabbitmq.test.ts); its error classes stay real.
vi.mock("./rabbitmq", async (importOriginal) => ({ ...(await importOriginal<typeof import("./rabbitmq")>()), rpcCall }));
vi.mock("next/server", () => ({ connection }));

import { ApiError, call, callOrNull, failureFrom } from "./client";
import { PATTERNS } from "./patterns";
import { RpcFailure, RpcUnavailable } from "./rabbitmq";

beforeEach(() => {
  rpcCall.mockReset();
  connection.mockClear();
  vi.stubEnv("RABBITMQ_URL", "amqp://user:secret@broker.test:5672");
});

describe("failureFrom", () => {
  it("reads the service's failure: the same status and messages as its HTTP API", () => {
    const error = failureFrom({ status: 400, error: "Bad Request", messages: ["day must not be greater than 30", "date is bad"] });

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 400, messages: ["day must not be greater than 30", "date is bad"] });
    expect(error.message).toBe("day must not be greater than 30");
  });

  it("copes with a failure in another shape", () => {
    expect(failureFrom({ message: "There is no matching message handler" })).toMatchObject({
      status: 500,
      messages: ["There is no matching message handler"],
    });
    expect(failureFrom("boom")).toMatchObject({ status: 502, messages: ["boom"] });
    expect(failureFrom(null)).toMatchObject({ status: 500 });
    expect(failureFrom({ status: 409, messages: [] })).toMatchObject({ status: 500 }); // nothing to show
  });
});

describe("call", () => {
  it("sends the pattern and data and returns the service's answer", async () => {
    rpcCall.mockResolvedValue([{ session_id: "SES-001" }]);

    await expect(call(PATTERNS.getSession, { session_id: "SES-001" })).resolves.toEqual([{ session_id: "SES-001" }]);

    expect(rpcCall).toHaveBeenCalledWith("sessions.get", { session_id: "SES-001" });
  });

  it("sends an empty object when the operation takes nothing", async () => {
    rpcCall.mockResolvedValue([]);

    await call(PATTERNS.listSessions);

    expect(rpcCall).toHaveBeenCalledWith("sessions.list", {});
  });

  it("is per-request work: it opts out of prerendering first", async () => {
    rpcCall.mockResolvedValue(null);

    await call(PATTERNS.listSessions);

    expect(connection).toHaveBeenCalledTimes(1);
    expect(connection.mock.invocationCallOrder[0]).toBeLessThan(rpcCall.mock.invocationCallOrder[0]);
  });

  it("turns the service's failure into an ApiError with its status and messages", async () => {
    rpcCall.mockRejectedValue(new RpcFailure({ status: 409, error: "Conflict", messages: ["Session SES-001 already exists"] }));

    const error = await call<never>(PATTERNS.createSession, {}).catch((e: ApiError) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 409, messages: ["Session SES-001 already exists"] });
  });

  it("reports an unreachable broker or service as status 0, without the password", async () => {
    rpcCall.mockRejectedValue(new RpcUnavailable("connect ECONNREFUSED 127.0.0.1:5672"));

    const error = await call<never>(PATTERNS.listSessions).catch((e: ApiError) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(0);
    expect(error.message).toContain("connect ECONNREFUSED 127.0.0.1:5672");
    expect(error.message).toContain("amqp://broker.test:5672");
    expect(error.message).not.toContain("secret");
  });

  it("reports any other transport error the same way", async () => {
    rpcCall.mockRejectedValue(new Error("Channel closed"));

    await expect(call(PATTERNS.listSessions)).rejects.toMatchObject({ status: 0 });
  });
});

describe("callOrNull", () => {
  it("turns a 404 into null but still throws other errors", async () => {
    rpcCall.mockRejectedValueOnce(new RpcFailure({ status: 404, error: "Not Found", messages: ["Session SES-9 not found"] }));
    await expect(callOrNull(PATTERNS.getSession, { session_id: "SES-9" })).resolves.toBeNull();

    rpcCall.mockRejectedValueOnce(new RpcFailure({ status: 500, error: "Internal Server Error", messages: ["boom"] }));
    await expect(callOrNull(PATTERNS.getSession, { session_id: "SES-9" })).rejects.toMatchObject({ status: 500 });

    rpcCall.mockRejectedValueOnce(new RpcUnavailable("nobody home"));
    await expect(callOrNull(PATTERNS.getSession, { session_id: "SES-9" })).rejects.toMatchObject({ status: 0 });
  });

  it("returns the answer when there is one", async () => {
    rpcCall.mockResolvedValue({ session_id: "SES-001" });

    await expect(callOrNull(PATTERNS.getSession, { session_id: "SES-001" })).resolves.toEqual({ session_id: "SES-001" });
  });
});
