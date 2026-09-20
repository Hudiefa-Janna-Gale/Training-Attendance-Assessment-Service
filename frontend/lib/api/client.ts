// Server-side HTTP client for the Training, Attendance & Assessment Service.
//
// Only Server Components and Server Actions import this, so the browser never
// talks to the API directly (no CORS, and BACKEND_URL stays private).

export function backendUrl(): string {
  return (process.env.BACKEND_URL ?? "http://localhost:4000").replace(/\/+$/, "");
}

/** A failed call to the service. `status` 0 means it could not be reached at all. */
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

/** Pulls the message(s) out of a NestJS error body: { message: string | string[] }. */
export function extractMessages(body: unknown, fallback: string): string[] {
  if (body && typeof body === "object" && "message" in body) {
    const { message } = body as { message: unknown };
    if (Array.isArray(message)) return message.map(String);
    if (typeof message === "string") return [message];
  }
  return [fallback];
}

export async function apiFetch<T>(
  path: string,
  options: { method?: "GET" | "POST"; body?: unknown } = {},
): Promise<T> {
  const url = `${backendUrl()}${path}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: options.method ?? "GET",
      headers: options.body === undefined ? undefined : { "content-type": "application/json" },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      cache: "no-store",
    });
  } catch {
    throw new ApiError(0, [`Cannot reach the Training service at ${backendUrl()}`]);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(res.status, extractMessages(body, res.statusText || "Request failed"));
  }
  return (await res.json()) as T;
}

/** Like apiFetch for a GET, but a 404 becomes `null` (looked-up id does not exist). */
export async function apiFetchOrNull<T>(path: string): Promise<T | null> {
  try {
    return await apiFetch<T>(path);
  } catch (error) {
    if (error instanceof ApiError && error.notFound) return null;
    throw error;
  }
}
