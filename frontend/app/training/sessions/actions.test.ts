import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/client";

const { createSession, revalidatePath } = vi.hoisted(() => ({
  createSession: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/lib/api/sessions", () => ({ createSession }));

import { createSessionAction } from "./actions";

const idle = { status: "idle" } as const;
function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.append(key, value);
  return data;
}

const fields = {
  session_id: "",
  workshop_id: "WS-2025-001",
  facilitator_id: "FAC-001",
  topic_id: "TOP-001",
  day: "1",
  date: "2025-09-01",
  start_time: "08:00",
  end_time: "09:30",
};

beforeEach(() => vi.clearAllMocks());

describe("createSessionAction", () => {
  it("builds the API body: numeric day, composed time slot, no id when left blank", async () => {
    createSession.mockResolvedValue({ session_id: "SES-004", workshop_id: "WS-2025-001", day: 1 });

    const state = await createSessionAction(idle, form(fields));

    expect(createSession).toHaveBeenCalledWith({
      session_id: undefined,
      workshop_id: "WS-2025-001",
      facilitator_id: "FAC-001",
      topic_id: "TOP-001",
      day: 1,
      date: "2025-09-01",
      time_slot: "08:00–09:30",
    });
    expect(state).toEqual({
      status: "success",
      message: "Session SES-004 created for WS-2025-001, day 1.",
      link: { href: "/training/attendance?session=SES-004", label: "Take attendance" },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/training", "layout");
  });

  it("passes a chosen session id through", async () => {
    createSession.mockResolvedValue({ session_id: "SES-100", workshop_id: "WS-2025-001", day: 1 });

    await createSessionAction(idle, form({ ...fields, session_id: "SES-100" }));

    expect(createSession).toHaveBeenCalledWith(expect.objectContaining({ session_id: "SES-100" }));
  });

  it("returns the service's conflict message and what the user typed", async () => {
    createSession.mockRejectedValue(
      new ApiError(409, ["Workshop WS-2025-001 already has session SES-001 on day 1 at 08:00–09:30"]),
    );

    const state = await createSessionAction(idle, form(fields));

    expect(state).toMatchObject({
      status: "error",
      message: "Workshop WS-2025-001 already has session SES-001 on day 1 at 08:00–09:30",
      values: { workshop_id: "WS-2025-001", facilitator_id: "FAC-001", start_time: "08:00", end_time: "09:30" },
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("lists every validation error when the service returns several", async () => {
    createSession.mockRejectedValue(new ApiError(400, ["day must not be greater than 3", "topic_id is invalid"]));

    const state = await createSessionAction(idle, form({ ...fields, day: "9" }));

    expect(state).toMatchObject({
      message: "day must not be greater than 3",
      details: ["topic_id is invalid"],
    });
  });

  it("gives a friendly message when the service is unreachable", async () => {
    createSession.mockRejectedValue(new ApiError(0, ["Cannot reach the Training service at http://localhost:4000"]));

    const state = await createSessionAction(idle, form(fields));

    expect(state).toMatchObject({ status: "error", message: "Cannot reach the Training service at http://localhost:4000" });
  });
});
