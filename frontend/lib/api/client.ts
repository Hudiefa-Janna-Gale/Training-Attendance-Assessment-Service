// Server-side client for the Training, Attendance & Assessment Service.
//
// Requests go through RabbitMQ (see rabbitmq.ts), not HTTP: the web UI's server sends each one to the
// service's queue and waits for the reply. Only Server Components and Server Actions import this, so
// the browser never talks to the broker or the service.

import { connection } from "next/server";
import { describeBroker, rpcCall, RpcFailure, RpcUnavailable } from "./rabbitmq";

/** A failed request to the service. `status` 0 means it could not be reached at all. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    /** Every message the service returned (validation errors come as a list). */
    readonly messages: string[],
  ) {
    super(messages[0] ?? `Request failed (${status})`);
    this.name = "ApiError";
  }

  get notFound(): boolean {
    return this.status === 404;
  }
}

/**
 * The service answers a failure as { status, error, messages }, the same status and words as its
 * HTTP API. Anything else (the transport's own "no handler", a plain string) still becomes an ApiError.
 */
export function failureFrom(failure: unknown): ApiError {
  if (failure && typeof failure === "object") {
    const { status, messages, message } = failure as { status?: unknown; messages?: unknown; message?: unknown };
    if (typeof status === "number" && Array.isArray(messages) && messages.length > 0) {
      return new ApiError(status, messages.map(String));
    }
    if (typeof message === "string") return new ApiError(500, [message]);
  }
  if (typeof failure === "string") return new ApiError(502, [failure]);
  return new ApiError(500, ["The service could not answer the request"]);
}

/** Asks the service for one operation (a pattern of ./patterns) and returns its answer. */
export async function call<T>(pattern: string, data: unknown = {}): Promise<T> {
  await connection(); // asking the service is per-request work, never done while prerendering
  try {
    return (await rpcCall(pattern, data)) as T;
  } catch (error) {
    if (error instanceof RpcFailure) throw failureFrom(error.failure);
    const reason = error instanceof RpcUnavailable ? `${error.message}. ` : "";
    throw new ApiError(0, [
      `${reason}Cannot reach the Training service through RabbitMQ at ${describeBroker()}. Check that RabbitMQ and the API are running.`,
    ]);
  }
}

/** Like `call`, but a 404 ("no such session") becomes `null`. */
export async function callOrNull<T>(pattern: string, data: unknown = {}): Promise<T | null> {
  try {
    return await call<T>(pattern, data);
  } catch (error) {
    if (error instanceof ApiError && error.notFound) return null;
    throw error;
  }
}
