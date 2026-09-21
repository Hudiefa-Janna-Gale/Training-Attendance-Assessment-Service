import { describe, expect, it } from "vitest";
import { comboView, fitsPattern } from "./combo";

const ID = "[A-Za-z0-9_\\-]{1,64}";
const WORKSHOPS = [
  { value: "technical", description: "1 session, 14 Sep 2026" },
  { value: "WS-2025-001", description: "3 sessions, 1 Sep 2025 to 3 Sep 2025, 1 assessment" },
];
const creatable = { options: WORKSHOPS, noun: "workshop", pattern: ID, patternHint: "IDs use letters and digits." };

describe("fitsPattern", () => {
  it("matches the whole text, like an HTML pattern", () => {
    expect(fitsPattern("WS-2025-001", ID)).toBe(true);
    expect(fitsPattern("WS 2025", ID)).toBe(false);
    expect(fitsPattern("x".repeat(65), ID)).toBe(false);
    expect(fitsPattern("2", "[1-3]")).toBe(true);
    expect(fitsPattern("12", "[1-3]")).toBe(false);
  });

  it("accepts anything when there is no pattern, or one JavaScript cannot read", () => {
    expect(fitsPattern("anything at all")).toBe(true);
    expect(fitsPattern("x", "[")).toBe(true);
  });
});

describe("comboView, when new values are allowed", () => {
  it.each([null, "", "   "])("lists every option and says a new one can be typed (query %j)", (query) => {
    expect(comboView({ ...creatable, query })).toEqual({
      rows: WORKSHOPS,
      note: "Not in the list? Type a new workshop.",
    });
  });

  it("says nothing about typing when there is nothing to pick from yet", () => {
    expect(comboView({ ...creatable, options: [], query: null })).toEqual({ rows: [], note: null });
  });

  it("offers to create what was typed when nothing matches", () => {
    const view = comboView({ ...creatable, query: "safety-101" });
    expect(view.rows).toEqual([
      { value: "safety-101", description: "New workshop, added when you save", isNew: true },
    ]);
    expect(view.note).toBeNull();
  });

  it("lists the matches first and the create row after them", () => {
    const view = comboView({ ...creatable, query: "tech" });
    expect(view.rows.map((r) => r.value)).toEqual(["technical", "tech"]);
    expect(view.rows.map((r) => r.isNew ?? false)).toEqual([false, true]);
  });

  it("matches on the description too", () => {
    const view = comboView({ ...creatable, query: "2025" });
    expect(view.rows.map((r) => r.value)).toEqual(["WS-2025-001", "2025"]);
  });

  it("offers no create row for a value that already exists", () => {
    expect(comboView({ ...creatable, query: "technical" })).toEqual({ rows: [WORKSHOPS[0]], note: null });
  });

  it("does not treat a different case as the same id", () => {
    const view = comboView({ ...creatable, query: "Technical" });
    expect(view.rows.map((r) => r.value)).toEqual(["technical", "Technical"]);
    expect(view.rows[1].isNew).toBe(true);
  });

  it("offers a tidied-up id for a name with spaces, and explains the rule", () => {
    const view = comboView({ ...creatable, query: "Fire Safety" });
    expect(view.rows).toEqual([
      { value: "Fire-Safety", description: "New workshop, from “Fire Safety”", isNew: true },
    ]);
    expect(view.note).toBe("IDs use letters and digits.");
  });

  it("uses the given way of tidying up what was typed", () => {
    const view = comboView({
      options: [{ value: "1", description: "First day" }],
      query: "day 5",
      noun: "day",
      pattern: "([1-9]|[12][0-9]|30)",
      patternHint: "A day is a number from 1 to 30.",
      suggest: (typed) => typed.match(/\d+/)?.[0] ?? "",
    });
    expect(view.rows).toEqual([{ value: "5", description: "New day, from “day 5”", isNew: true }]);
    expect(view.note).toBe("A day is a number from 1 to 30.");
  });

  it("offers nothing to create when the tidied-up value is still not allowed", () => {
    const view = comboView({
      options: [],
      query: "day 45",
      noun: "day",
      pattern: "([1-9]|[12][0-9]|30)",
      patternHint: "A day is a number from 1 to 30.",
      suggest: (typed) => typed.match(/\d+/)?.[0] ?? "",
    });
    expect(view).toEqual({ rows: [], note: "A day is a number from 1 to 30." });
  });

  it("points at the existing value when the tidied-up id is one it already has", () => {
    const view = comboView({ ...creatable, query: "WS 2025 001" });
    expect(view.rows).toEqual([WORKSHOPS[1]]);
    expect(view.note).toBe("IDs use letters and digits.");
  });

  it("only explains the rule when nothing usable can be made of what was typed", () => {
    expect(comboView({ ...creatable, query: "***" })).toEqual({ rows: [], note: "IDs use letters and digits." });
  });
});

describe("comboView, when only the listed shape is allowed", () => {
  const days = {
    options: [
      { value: "1", description: "First day" },
      { value: "2", description: "Second day" },
      { value: "3", description: "Third day" },
    ],
    pattern: "[1-3]",
    patternHint: "Use 1, 2 or 3.",
  };

  it("lists every day with no note", () => {
    expect(comboView({ ...days, query: null })).toEqual({ rows: days.options, note: null });
  });

  it("narrows the list as a day is typed, and never offers to create one", () => {
    expect(comboView({ ...days, query: "2" })).toEqual({ rows: [days.options[1]], note: null });
    expect(comboView({ ...days, query: "sec" })).toEqual({ rows: [days.options[1]], note: null });
  });

  it("explains the rule when nothing matches", () => {
    expect(comboView({ ...days, query: "4" })).toEqual({ rows: [], note: "No match. Use 1, 2 or 3." });
  });
});
