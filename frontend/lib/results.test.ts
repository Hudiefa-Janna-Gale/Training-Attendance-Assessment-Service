import { describe, expect, it } from "vitest";
import { attendanceRule, daysNeeded, REQUIRED_DAYS } from "./results";

describe("daysNeeded", () => {
  it("is the brief's 2 of 3, and still 2 for a longer workshop", () => {
    expect(REQUIRED_DAYS).toBe(2);
    expect([3, 5, 30].map(daysNeeded)).toEqual([2, 2, 2]);
  });

  it("never asks for more days than the workshop has", () => {
    expect(daysNeeded(1)).toBe(1);
    expect(daysNeeded(2)).toBe(2);
  });

  it("still asks for 1 when the workshop has no session (there is nothing to attend)", () => {
    expect(daysNeeded(0)).toBe(1);
  });
});

describe("attendanceRule", () => {
  it.each([
    [1, 1, "attends the workshop’s day"],
    [2, 2, "attends all 2 days"],
    [2, 3, "attends at least 2 of the 3 days"],
    [2, 5, "attends at least 2 of the 5 days"],
  ])("%i needed of %i days: %s", (needed, total, words) => {
    expect(attendanceRule(needed, total)).toBe(words);
  });
});
