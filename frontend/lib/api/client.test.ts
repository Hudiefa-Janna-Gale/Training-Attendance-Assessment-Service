import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiFetch, apiFetchOrNull, backendUrl, extractMessages } from "./client";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("BACKEND_URL", "http://api.test:4000/");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("backendUrl", () => {
  it("reads BACKEND_URL and drops trailing slashes", () => {
    expect(backendUrl()).toBe("http://api.test:4000");
  });

  it("defaults to the local API", () => {
    vi.stubEnv("BACKEND_URL", "");
    delete process.env.BACKEND_URL;
    expect(backendUrl()).toBe("http://localhost:4000");
  });
});

describe("extractMessages", () => {
  it("handles a NestJS validation error (message is a list)", () => {
    expect(extractMessages({ statusCode: 400, message: ["day must not be greater than 3", "date is bad"] }, "x")).toEqual([
      "day must not be greater than 3",
      "date is bad",
    ]);
  });

  it("handles a single message and falls back otherwise", () => {
    expect(extractMessages({ message: "Session SES-9 not found" }, "x")).toEqual(["Session SES-9 not found"]);
    expect(extractMessages(null, "Bad Gateway")).toEqual(["Bad Gateway"]);
    expect(extractMessages({ nope: 1 }, "fallback")).toEqual(["fallback"]);
  });
});

describe("apiFetch", () => {
  it("GETs the path on the backend, uncached, and returns the parsed body", async () => {
    fetchMock.mockResolvedValue(json([{ workshop_id: "WS-1" }]));

    await expect(apiFetch("/workshops")).resolves.toEqual([{ workshop_id: "WS-1" }]);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.test:4000/workshops",
      expect.objectContaining({ method: "GET", cache: "no-store" }),
    );
  });

  it("POSTs a JSON body", async () => {
    fetchMock.mockResolvedValue(json({ ok: true }, 201));

    await apiFetch("/sessions", { method: "POST", body: { day: 1 } });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.test:4000/sessions",
      expect.objectContaining({
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ day: 1 }),
      }),
    );
  });

  it("throws an ApiError carrying the service's messages", async () => {
    fetchMock.mockResolvedValue(json({ statusCode: 409, message: "Session SES-001 already exists" }, 409));

    const error = await apiFetch<never>("/sessions").catch((e: ApiError) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 409, messages: ["Session SES-001 already exists"] });
    expect(error.message).toBe("Session SES-001 already exists");
  });

  it("reports an unreachable service as status 0 with a helpful message", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));

    const error = await apiFetch<never>("/health").catch((e: ApiError) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(0);
    expect(error.message).toContain("http://api.test:4000");
  });

  it("copes with an error response that is not JSON", async () => {
    fetchMock.mockResolvedValue(new Response("<html>Bad gateway</html>", { status: 502, statusText: "Bad Gateway" }));

    await expect(apiFetch("/x")).rejects.toMatchObject({ status: 502, messages: ["Bad Gateway"] });
  });
});

describe("apiFetchOrNull", () => {
  it("turns a 404 into null but still throws other errors", async () => {
    fetchMock.mockResolvedValueOnce(json({ message: "nope" }, 404));
    await expect(apiFetchOrNull("/workshops/WS-X")).resolves.toBeNull();

    fetchMock.mockResolvedValueOnce(json({ message: "boom" }, 500));
    await expect(apiFetchOrNull("/workshops/WS-X")).rejects.toMatchObject({ status: 500 });
  });
});
