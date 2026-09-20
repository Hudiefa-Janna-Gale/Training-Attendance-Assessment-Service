import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/client";

const { createAssessment, submitScore, revalidatePath } = vi.hoisted(() => ({
  createAssessment: vi.fn(),
  submitScore: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/lib/api/assessments", () => ({ createAssessment, submitScore }));

import { createAssessmentAction, submitScoreAction } from "./actions";

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.append(key, value);
  return data;
}
const idle = { status: "idle" } as const;

beforeEach(() => vi.clearAllMocks());

describe("createAssessmentAction", () => {
  const fields = {
    workshop_id: "WS-1",
    title: "Final",
    day: "3",
    type: "",
    total_marks: "",
    pass_mark: "",
    assessment_id: "",
  };

  it("sends only what was filled in, so the service applies its defaults", async () => {
    createAssessment.mockResolvedValue({ assessment_id: "ASS-007", type: "FINAL" });

    const state = await createAssessmentAction(idle, form(fields));

    expect(createAssessment).toHaveBeenCalledWith({
      assessment_id: undefined,
      workshop_id: "WS-1",
      title: "Final",
      day: 3,
      type: undefined,
      total_marks: undefined,
      pass_mark: undefined,
    });
    expect(state).toEqual({
      status: "success",
      message: "Assessment ASS-007 created (final).",
      link: { href: "/training/assessments?assessment=ASS-007", label: "Enter scores" },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/training", "layout");
  });

  it("passes explicit marks and kind through as numbers / enum", async () => {
    createAssessment.mockResolvedValue({ assessment_id: "ASS-008", type: "QUIZ" });

    await createAssessmentAction(idle, form({ ...fields, day: "1", type: "QUIZ", total_marks: "50", pass_mark: "25" }));

    expect(createAssessment).toHaveBeenCalledWith(
      expect.objectContaining({ day: 1, type: "QUIZ", total_marks: 50, pass_mark: 25 }),
    );
  });

  it("rejects non-numeric marks without calling the service, keeping what was typed", async () => {
    const state = await createAssessmentAction(idle, form({ ...fields, total_marks: "abc" }));

    expect(createAssessment).not.toHaveBeenCalled();
    expect(state).toMatchObject({ status: "error", values: { title: "Final", total_marks: "abc" } });
  });

  it("shows the service's error and keeps the typed values", async () => {
    createAssessment.mockRejectedValue(
      new ApiError(409, ["Workshop WS-1 already has a final assessment (ASS-001)"]),
    );

    const state = await createAssessmentAction(idle, form(fields));

    expect(state).toMatchObject({
      status: "error",
      message: "Workshop WS-1 already has a final assessment (ASS-001)",
      values: { workshop_id: "WS-1", title: "Final", day: "3" },
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe("submitScoreAction", () => {
  it("submits one participant's score for the assessment and reports the computed result", async () => {
    submitScore.mockResolvedValue({ assessment_id: "ASS-001", participant_id: "P-001", score: 82, result: "PASS" });

    const state = await submitScoreAction("ASS-001", idle, form({ participant_id: " P-001 ", score: "82" }));

    expect(submitScore).toHaveBeenCalledWith("ASS-001", "P-001", 82);
    expect(state).toEqual({ status: "success", message: "Saved P-001: 82 — PASS.", link: undefined });
    expect(revalidatePath).toHaveBeenCalledWith("/training", "layout");
  });

  it("accepts a score of 0", async () => {
    submitScore.mockResolvedValue({ assessment_id: "ASS-001", participant_id: "P-002", score: 0, result: "FAIL" });

    await submitScoreAction("ASS-001", idle, form({ participant_id: "P-002", score: "0" }));

    expect(submitScore).toHaveBeenCalledWith("ASS-001", "P-002", 0);
  });

  it.each(["", "7.5", "-4", "abc"])("rejects the score %j before calling the service, keeping the input", async (score) => {
    const state = await submitScoreAction("ASS-001", idle, form({ participant_id: "P-001", score }));

    expect(submitScore).not.toHaveBeenCalled();
    expect(state).toMatchObject({
      status: "error",
      message: "The score must be a whole number.",
      values: { participant_id: "P-001", score },
    });
  });

  it("shows the service's error (e.g. score above the total, or already scored) and keeps the input", async () => {
    submitScore.mockRejectedValue(new ApiError(400, ["score (101) cannot exceed the assessment's total_marks (100)"]));

    const state = await submitScoreAction("ASS-001", idle, form({ participant_id: "P-001", score: "101" }));

    expect(state).toMatchObject({
      status: "error",
      message: "score (101) cannot exceed the assessment's total_marks (100)",
      values: { participant_id: "P-001", score: "101" },
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("explains a duplicate score (one score per participant per assessment)", async () => {
    submitScore.mockRejectedValue(new ApiError(409, ["Participant P-001 already has a score for assessment ASS-001"]));

    const state = await submitScoreAction("ASS-001", idle, form({ participant_id: "P-001", score: "70" }));

    expect(state).toMatchObject({ status: "error", message: expect.stringContaining("already has a score") });
  });
});
