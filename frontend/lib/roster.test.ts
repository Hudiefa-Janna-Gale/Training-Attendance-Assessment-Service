import { describe, expect, it } from "vitest";
import type { AttendanceEntry } from "@/types/training";
import { buildAttendanceRows, isValidId, parseParticipantIds, suggestId } from "./roster";

describe("buildAttendanceRows", () => {
  it("turns the session's saved records into sheet rows", () => {
    const records: AttendanceEntry[] = [
      { participant_id: "P-001", status: "present" },
      { participant_id: "P-002", status: "excused" },
    ];

    expect(buildAttendanceRows(records)).toEqual([
      { participantId: "P-001", status: "present" },
      { participantId: "P-002", status: "excused" },
    ]);
  });

  it("sorts ids naturally (P-2 before P-10)", () => {
    const rows = buildAttendanceRows([
      { participant_id: "P-10", status: "absent" },
      { participant_id: "P-2", status: "absent" },
    ]);

    expect(rows.map((r) => r.participantId)).toEqual(["P-2", "P-10"]);
  });

  it("is empty when nothing has been recorded", () => {
    expect(buildAttendanceRows([])).toEqual([]);
  });

  it("adds the workshop's other known participants, with no status yet", () => {
    const rows = buildAttendanceRows(
      [{ participant_id: "P-2", status: "present" }],
      ["P-1", "P-2", "P-10"],
    );

    expect(rows).toEqual([
      { participantId: "P-1", status: null },
      { participantId: "P-2", status: "present" }, // the saved status wins
      { participantId: "P-10", status: null },
    ]);
  });

  it("keeps someone recorded on this session even if the workshop does not list them", () => {
    expect(buildAttendanceRows([{ participant_id: "P-9", status: "excused" }], ["P-1"]).map((r) => r.participantId)).toEqual([
      "P-1",
      "P-9",
    ]);
  });
});

describe("parseParticipantIds", () => {
  it("accepts one id", () => {
    expect(parseParticipantIds("P-007")).toEqual({ ids: ["P-007"], invalid: [] });
  });

  it("accepts several ids separated by commas, spaces or new lines, without duplicates", () => {
    expect(parseParticipantIds("P-001, P-002;P-003\nP-004   P-001")).toEqual({
      ids: ["P-001", "P-002", "P-003", "P-004"],
      invalid: [],
    });
  });

  it("reports the ids the service would reject", () => {
    expect(parseParticipantIds("P-001 bad!id P/2")).toEqual({
      ids: ["P-001"],
      invalid: ["bad!id", "P/2"],
    });
  });

  it("returns nothing for blank input", () => {
    expect(parseParticipantIds("  , ;  ")).toEqual({ ids: [], invalid: [] });
  });
});

describe("isValidId", () => {
  it.each(["P-001", "WS_2025-001", "a", "x".repeat(64)])("accepts %s", (id) => {
    expect(isValidId(id)).toBe(true);
  });

  it.each(["", " ", "P 001", "P/001", "P-001;", "x".repeat(65), "é"])("rejects %j", (id) => {
    expect(isValidId(id)).toBe(false);
  });
});

describe("suggestId", () => {
  it.each([
    ["Technical Skills", "Technical-Skills"],
    ["  safety   first  ", "safety-first"],
    ["WS 2025 001", "WS-2025-001"],
    ["Café 2025", "Cafe-2025"],
    ["P/2", "P2"],
    ["a -- b", "a-b"],
    ["safety -", "safety"],
  ])("turns %j into %j", (typed, id) => {
    expect(suggestId(typed)).toBe(id);
  });

  it("keeps an id that is already valid", () => {
    expect(suggestId("WS_2025-001")).toBe("WS_2025-001");
  });

  it("gives back something the service accepts, or nothing", () => {
    expect(isValidId(suggestId("x ".repeat(100)))).toBe(true);
    expect(suggestId("x ".repeat(100)).length).toBeLessThanOrEqual(64);
    expect(suggestId("***")).toBe("");
    expect(suggestId("   ")).toBe("");
  });
});
