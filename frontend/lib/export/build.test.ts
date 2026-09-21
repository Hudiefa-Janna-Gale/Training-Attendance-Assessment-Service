// The real Excel and PDF files, built in Node and read back. Set EXPORT_SAMPLES_DIR to also keep
// them on disk (to open in Excel / a PDF viewer and look at the layout).
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { buildPdf } from "./pdf";
import { buildXlsx } from "./xlsx";
import type { ExportSpec } from "./types";

const now = new Date(2026, 8, 21, 15, 42);

const spec: ExportSpec = {
  title: "Scores: Day 3 Final Assessment",
  fileName: "scores-ASS-001",
  facts: [
    ["Assessment", "ASS-001"],
    ["Workshop", "WS-2025-001"],
    ["Day", "Day 3"],
    ["Pass mark", "60 of 100"],
  ],
  filters: [["Result", "Pass"]],
  columns: [{ header: "Participant" }, { header: "Score", align: "right" }, { header: "Out of", align: "right" }, { header: "Result" }],
  statusColumn: 3,
  rows: [
    ["P-001", 82, 100, "PASS"],
    ["P-002", 45, 100, "FAIL"],
    ["P-003", 71, 100, "PASS"],
  ],
};

const logo = { bytes: new Uint8Array(readFileSync(path.join(__dirname, "../../public/images/somnog-640.png"))), width: 640, height: 229 };

/** The bytes as text, to look for words in an uncompressed PDF. */
const latin1 = (bytes: Uint8Array) => Buffer.from(bytes).toString("latin1");

function keep(name: string, bytes: Uint8Array) {
  const dir = process.env.EXPORT_SAMPLES_DIR;
  if (!dir) return;
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, name), bytes);
}

describe("buildXlsx", () => {
  it("makes a real .xlsx with the title, the facts, the filters and the table", async () => {
    const bytes = await buildXlsx(spec, now);
    keep("scores.xlsx", bytes);
    expect(Buffer.from(bytes).subarray(0, 2).toString()).toBe("PK"); // an .xlsx is a zip

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(bytes as unknown as ArrayBuffer);
    const sheet = workbook.worksheets[0];
    expect(sheet.name).toBe("Scores Day 3 Final Assessment"); // the colon is not allowed in a sheet name

    expect(sheet.getCell("A1").value).toBe("Scores: Day 3 Final Assessment");
    expect(sheet.getCell("A2").value).toBe("Generated 21 Sep 2026, 15:42 - Training Hub");
    expect(sheet.getCell("A4").value).toBe("Assessment");
    expect(sheet.getCell("B4").value).toBe("ASS-001");
    expect(sheet.getCell("A8").value).toBe("Filters");
    expect(sheet.getCell("B8").value).toBe("Result: Pass");

    // header at row 10, then the rows; numbers stay numbers
    expect([1, 2, 3, 4].map((c) => sheet.getCell(10, c).value)).toEqual(["Participant", "Score", "Out of", "Result"]);
    expect([1, 2, 3, 4].map((c) => sheet.getCell(11, c).value)).toEqual(["P-001", 82, 100, "PASS"]);
    expect(sheet.getCell(12, 2).value).toBe(45);
    expect(sheet.rowCount).toBe(13);
  });

  it("colours the header, the striped rows and the status words", async () => {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load((await buildXlsx(spec, now)) as unknown as ArrayBuffer);
    const sheet = workbook.worksheets[0];
    const fill = (address: string) => (sheet.getCell(address).fill as ExcelJS.FillPattern).fgColor?.argb;
    expect(fill("A10")).toBe("FF29A7DF"); // the logo blue
    expect(fill("A12")).toBe("FFF3F8FB"); // every second row is striped
    expect(sheet.getCell("D11").font?.color?.argb).toBe("FF0D7A50"); // PASS
    expect(sheet.getCell("D12").font?.color?.argb).toBe("FFBD3143"); // FAIL
  });

  it("puts filter buttons on the header, freezes it, and repeats it on printed pages", async () => {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load((await buildXlsx(spec, now)) as unknown as ArrayBuffer);
    const sheet = workbook.worksheets[0];
    expect(sheet.autoFilter).toBeTruthy();
    expect(sheet.views[0]).toMatchObject({ state: "frozen", ySplit: 10 });
    expect(sheet.pageSetup.printTitlesRow).toBe("10:10");
  });
});

describe("buildPdf", () => {
  it("makes a real PDF with the logo, the title, the filters and every row", () => {
    keep("scores.pdf", buildPdf(spec, logo, now)); // the file as it is downloaded
    const text = latin1(buildPdf(spec, logo, now, { compress: false }));
    expect(text.startsWith("%PDF-")).toBe(true);
    expect(text).toContain("/Type /Page");
    expect(text).toContain("Scores: Day 3 Final Assessment");
    expect(text).toContain("Generated 21 Sep 2026, 15:42");
    expect(text).toContain("Filters: Result: Pass");
    for (const cell of ["P-001", "P-002", "P-003", "PASS", "FAIL", "Page 1 of 1"]) expect(text).toContain(cell);
    expect(text).toContain("/Subtype /Image"); // the logo
  });

  it("works without a logo, and lays a wide table out in landscape", () => {
    const wide: ExportSpec = {
      title: "Training sessions",
      fileName: "training-sessions",
      columns: ["Session", "Workshop", "Day", "Date", "Time", "Facilitator", "Topic"].map((header) => ({ header })),
      rows: [["SES-009", "technical", 1, "14 Sep 2026", "09:01–09:30", "FAC-009", "TOP-009"]],
    };
    keep("sessions.pdf", buildPdf(wide, undefined, now));
    const text = latin1(buildPdf(wide, undefined, now, { compress: false }));
    expect(text).not.toContain("/Subtype /Image");
    expect(text).toContain("Filters: None");
    expect(text).toContain("09:01-09:30"); // the en dash becomes a plain hyphen in the PDF
    const box = /\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*\]/.exec(text);
    expect(Number(box?.[1])).toBeGreaterThan(Number(box?.[2])); // wider than tall: landscape
    expect(Number(box?.[1])).toBeCloseTo(841.89, 0); // A4
  });

  it("compresses the file by default, so the logo does not make it heavy", () => {
    expect(buildPdf(spec, logo, now).byteLength).toBeLessThan(200_000);
    expect(buildPdf(spec, logo, now).byteLength).toBeLessThan(buildPdf(spec, logo, now, { compress: false }).byteLength);
  });

  it("goes on to more pages, each with its page number", () => {
    const many: ExportSpec = {
      ...spec,
      rows: Array.from({ length: 120 }, (_, i) => [`P-${String(i + 1).padStart(3, "0")}`, i % 100, 100, i % 2 ? "PASS" : "FAIL"]),
    };
    const text = latin1(buildPdf(many, logo, now, { compress: false }));
    const pages = Number(/Page 1 of (\d+)/.exec(text)?.[1]);
    expect(pages).toBeGreaterThan(1);
    expect(text).toContain(`Page ${pages} of ${pages}`);
    expect(text).toContain("P-120");
  });
});
