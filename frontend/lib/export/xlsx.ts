import ExcelJS from "exceljs";
import { columnWidth, filtersLine, generatedLabel, statusTone, TONE_HEX } from "./format";
import type { ExportSpec } from "./types";

// The SOMNOG palette, as Excel wants it (ARGB).
const BRAND = "FF29A7DF";
const ON_BRAND = "FF04121B";
const INK = "FF0B1720";
const MUTED = "FF51677A";
const RULE = "FFDCE7EF";
const STRIPE = "FFF3F8FB";

const thin = { style: "thin" as const, color: { argb: RULE } };
const BORDER = { top: thin, left: thin, bottom: thin, right: thin };

/** Sheet names are at most 31 characters and cannot hold \ / * ? : [ ]. */
function sheetName(title: string): string {
  return title.replace(/[\\/*?:[\]]/g, " ").replace(/\s+/g, " ").trim().slice(0, 31) || "Sheet";
}

/**
 * The Excel file: a title, when it was made, what it is about and which filters were on, then the
 * table with a blue header, striped rows and Excel's own filter buttons on the header.
 */
export async function buildXlsx(spec: ExportSpec, now = new Date()): Promise<Uint8Array> {
  const cols = spec.columns.length;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Training Hub";
  workbook.created = now;

  const sheet = workbook.addWorksheet(sheetName(spec.title), {
    properties: { tabColor: { argb: BRAND } },
    views: [{ showGridLines: false }],
  });
  spec.columns.forEach((_, i) => {
    sheet.getColumn(i + 1).width = columnWidth(spec, i);
  });

  let row = 1;

  const title = sheet.getCell(row, 1);
  title.value = spec.title;
  title.font = { name: "Calibri", size: 16, bold: true, color: { argb: INK } };
  if (cols > 1) sheet.mergeCells(row, 1, row, cols);
  sheet.getRow(row).height = 28;
  row += 1;

  const generated = sheet.getCell(row, 1);
  generated.value = `Generated ${generatedLabel(now)} - Training Hub`;
  generated.font = { name: "Calibri", size: 10, color: { argb: MUTED } };
  if (cols > 1) sheet.mergeCells(row, 1, row, cols);
  row += 2;

  const details: [string, string][] = [...(spec.facts ?? []), ["Filters", filtersLine(spec.filters)]];
  for (const [label, value] of details) {
    const name = sheet.getCell(row, 1);
    name.value = label;
    name.font = { name: "Calibri", size: 11, bold: true, color: { argb: MUTED } };
    const cell = sheet.getCell(row, cols > 1 ? 2 : 1);
    cell.value = cols > 1 ? value : `${label}: ${value}`;
    cell.font = { name: "Calibri", size: 11, color: { argb: INK } };
    cell.alignment = { horizontal: "left" };
    if (cols > 2) sheet.mergeCells(row, 2, row, cols);
    row += 1;
  }
  row += 1;

  const headerRow = row;
  spec.columns.forEach((column, i) => {
    const cell = sheet.getCell(headerRow, i + 1);
    cell.value = column.header;
    cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: ON_BRAND } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND } };
    cell.border = BORDER;
    cell.alignment = { horizontal: column.align ?? "left", vertical: "middle" };
  });
  sheet.getRow(headerRow).height = 24;

  spec.rows.forEach((values, r) => {
    values.forEach((value, i) => {
      const cell = sheet.getCell(headerRow + 1 + r, i + 1);
      cell.value = value;
      cell.border = BORDER;
      cell.alignment = {
        horizontal: spec.columns[i].align ?? (typeof value === "number" ? "right" : "left"),
        vertical: "middle",
        wrapText: true,
      };
      cell.font = { name: "Calibri", size: 11, color: { argb: INK } };
      if (r % 2 === 1) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: STRIPE } };
      const tone = i === spec.statusColumn ? statusTone(value) : undefined;
      if (tone) cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: `FF${TONE_HEX[tone]}` } };
    });
  });

  // Excel's own filter buttons on the header, and the header stays put while scrolling (unless the
  // block above it is tall enough to eat the screen).
  sheet.autoFilter = {
    from: { row: headerRow, column: 1 },
    to: { row: headerRow + Math.max(spec.rows.length, 1), column: cols },
  };
  if (headerRow <= 10) sheet.views = [{ state: "frozen", ySplit: headerRow, showGridLines: false }];

  sheet.pageSetup = {
    paperSize: 9, // A4
    orientation: cols > 5 ? "landscape" : "portrait",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    printTitlesRow: `${headerRow}:${headerRow}`,
  };

  return new Uint8Array((await workbook.xlsx.writeBuffer()) as ArrayBuffer);
}
