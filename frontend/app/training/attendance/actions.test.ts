import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/client";

const { recordAttendance, revalidatePath } = vi.hoisted(() => ({
  recordAttendance: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/lib/api/attendance", () => ({ recordAttendance }));

import { saveAttendanceAction } from "./actions";

const idle = { status: "idle" } as const;
function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.append(key, value);
  return data;
}

beforeEach(() => vi.clearAllMocks());

describe("saveAttendanceAction", () => {
  it("sends the whole sheet for the session and confirms how many were saved", async () => {
    recordAttendance.mockResolvedValue({});

    const state = await saveAttendanceAction(
      "SES-001",
      idle,
      form({ "status:P-001": "present", "status:P-002": "absent", "status:P-003": "excused", ignored: "x" }),
    );

    expect(recordAttendance).toHaveBeenCalledWith("SES-001", [
      { participant_id: "P-001", status: "present" },
      { participant_id: "P-002", status: "absent" },
      { participant_id: "P-003", status: "excused" },
    ]);
    expect(state).toEqual({ status: "success", message: "Attendance saved for 3 participants.", link: undefined });
    expect(revalidatePath).toHaveBeenCalledWith("/training", "layout");
  });

  it("uses the singular for one participant", async () => {
    recordAttendance.mockResolvedValue({});

    const state = await saveAttendanceAction("SES-001", idle, form({ "status:P-001": "present" }));

    expect(state).toEqual({ status: "success", message: "Attendance saved for 1 participant.", link: undefined });
  });

  it("refuses an empty sheet without calling the service", async () => {
    const state = await saveAttendanceAction("SES-001", idle, form({}));

    expect(state).toMatchObject({ status: "error" });
    expect(recordAttendance).not.toHaveBeenCalled();
  });

  it("surfaces the service's error", async () => {
    recordAttendance.mockRejectedValue(new ApiError(404, ["Session SES-404 not found"]));

    const state = await saveAttendanceAction("SES-404", idle, form({ "status:P-001": "present" }));

    expect(state).toMatchObject({ status: "error", message: "Session SES-404 not found" });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
