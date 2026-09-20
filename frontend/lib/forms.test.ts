import { describe, expect, it } from "vitest";
import {
  composeTimeSlot,
  optionalInt,
  optionalText,
  parseAttendanceForm,
  text,
} from "./forms";

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.append(key, value);
  return data;
}

describe("text / optionalText / optionalInt", () => {
  it("trims, and treats a missing field as empty", () => {
    const data = form({ a: "  WS-1  ", blank: "   " });
    expect(text(data, "a")).toBe("WS-1");
    expect(text(data, "missing")).toBe("");
    expect(optionalText(data, "blank")).toBeUndefined();
    expect(optionalText(data, "a")).toBe("WS-1");
  });

  it("optionalInt: undefined when blank, a number when whole, NaN when junk", () => {
    const data = form({ ok: "100", zero: "0", blank: "", junk: "12.5", word: "abc" });
    expect(optionalInt(data, "ok")).toBe(100);
    expect(optionalInt(data, "zero")).toBe(0);
    expect(optionalInt(data, "blank")).toBeUndefined();
    expect(optionalInt(data, "missing")).toBeUndefined();
    expect(optionalInt(data, "junk")).toBeNaN();
    expect(optionalInt(data, "word")).toBeNaN();
  });
});

describe("composeTimeSlot", () => {
  it("joins start and end with the en dash the service uses", () => {
    expect(composeTimeSlot("08:00", "09:30")).toBe("08:00–09:30");
  });
});

describe("parseAttendanceForm", () => {
  it("collects status:<id> fields into API entries", () => {
    const data = form({
      "status:P-001": "present",
      "status:P-002": "absent",
      "status:P-003": "excused",
    });

    expect(parseAttendanceForm(data)).toEqual([
      { participant_id: "P-001", status: "present" },
      { participant_id: "P-002", status: "absent" },
      { participant_id: "P-003", status: "excused" },
    ]);
  });

  it("ignores unrelated fields and unknown statuses", () => {
    const data = form({ "status:P-001": "late", other: "present", "status:P-002": "present" });

    expect(parseAttendanceForm(data)).toEqual([{ participant_id: "P-002", status: "present" }]);
  });
});
