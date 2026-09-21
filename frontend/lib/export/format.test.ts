import { describe, expect, it } from "vitest";
import { columnWidth, fileDate, fileNameFor, filtersLine, generatedLabel, pdfText, safeName, statusTone } from "./format";
import type { ExportSpec } from "./types";

const spec: ExportSpec = {
  title: "Training sessions",
  fileName: "training-sessions",
  columns: [{ header: "Session" }, { header: "Facilitator" }],
  rows: [
    ["SES-001", "FAC-001"],
    ["SES-002", "A facilitator with quite a long name indeed"],
  ],
};

describe("dates in the files", () => {
  const now = new Date(2026, 8, 21, 7, 5); // 21 Sep 2026, 07:05 local time

  it("names the file with the day it was made", () => {
    expect(fileDate(now)).toBe("2026-09-21");
    expect(fileNameFor(spec, "xlsx", now)).toBe("training-sessions-2026-09-21.xlsx");
    expect(fileNameFor(spec, "pdf", now)).toBe("training-sessions-2026-09-21.pdf");
  });

  it("says when it was generated, in words", () => {
    expect(generatedLabel(now)).toBe("21 Sep 2026, 07:05");
  });
});

describe("safeName", () => {
  it.each([
    ["attendance-SES-009", "attendance-SES-009"],
    ["scores ASS/001", "scores-ASS-001"],
    ["  Fire Safety!  ", "Fire-Safety"],
    ["***", "file"],
  ])("turns %j into %j", (text, name) => {
    expect(safeName(text)).toBe(name);
  });
});

describe("filtersLine", () => {
  it("lists the filters in force, or says there are none", () => {
    expect(filtersLine([["Workshop", "technical"], ["Day", "Day 2"]])).toBe("Workshop: technical; Day: Day 2");
    expect(filtersLine([])).toBe("None");
    expect(filtersLine(undefined)).toBe("None");
  });
});

describe("columnWidth", () => {
  it("fits the longest thing in the column, within limits", () => {
    expect(columnWidth(spec, 0)).toBe(10); // short content: never narrower than 10
    expect(columnWidth(spec, 1)).toBe(46); // very long content: never wider than 46
  });
});

describe("statusTone", () => {
  it.each([
    ["PASS", "ok"],
    ["Present", "ok"],
    ["FAIL", "bad"],
    ["absent", "bad"],
    ["Excused", "warn"],
    ["Not saved yet", "warn"],
    ["something else", undefined],
    [82, undefined],
  ])("reads %j as %j", (value, tone) => {
    expect(statusTone(value)).toBe(tone);
  });
});

describe("pdfText", () => {
  it("keeps plain text and Latin-1 as they are", () => {
    expect(pdfText("Café 08:00")).toBe("Café 08:00");
    expect(pdfText(82)).toBe("82");
  });

  it("turns typographic punctuation into its plain form", () => {
    expect(pdfText("08:00–09:30 “quoted” it’s… ok")).toBe('08:00-09:30 "quoted" it\'s... ok');
  });

  it("replaces what the PDF fonts cannot draw", () => {
    expect(pdfText("ok ✓ done")).toBe("ok ? done");
  });
});
