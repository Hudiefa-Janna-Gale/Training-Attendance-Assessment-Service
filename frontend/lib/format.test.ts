import { describe, expect, it } from "vitest";
import { formatDate, naturalCompare, plural } from "./format";

describe("formatDate", () => {
  it("formats an ISO date without shifting it across time zones", () => {
    expect(formatDate("2025-09-01")).toBe("1 Sep 2025");
    expect(formatDate("2025-12-31")).toBe("31 Dec 2025");
  });

  it("returns the input untouched when it is not a date", () => {
    expect(formatDate("soon")).toBe("soon");
  });
});

describe("plural", () => {
  it("uses the singular for exactly one", () => {
    expect(plural(1, "session")).toBe("1 session");
    expect(plural(0, "session")).toBe("0 sessions");
    expect(plural(2, "participant")).toBe("2 participants");
    expect(plural(3, "person", "people")).toBe("3 people");
  });
});

describe("naturalCompare", () => {
  it("sorts numbers inside ids numerically", () => {
    expect(["P-10", "P-2", "P-1"].sort(naturalCompare)).toEqual(["P-1", "P-2", "P-10"]);
  });
});
