import { describe, expect, it } from "vitest";
import type { AttendanceEntry } from "@/types/training";
import { buildAttendanceRows, isValidId, parseParticipantIds } from "./roster";

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
