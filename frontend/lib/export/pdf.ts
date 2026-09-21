import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { filtersLine, generatedLabel, pdfText, statusTone, TONE_HEX } from "./format";
import type { ExportSpec } from "./types";

/** The logo as PNG bytes and its size, so the file can carry it. */
export interface PdfLogo {
  bytes: Uint8Array;
  width: number;
  height: number;
}

type Rgb = [number, number, number];

const rgb = (hex: string): Rgb => [
  parseInt(hex.slice(0, 2), 16),
  parseInt(hex.slice(2, 4), 16),
  parseInt(hex.slice(4, 6), 16),
];

// The SOMNOG palette.
const BRAND = rgb("29A7DF");
const ON_BRAND = rgb("04121B");
const INK = rgb("0B1720");
const MUTED = rgb("51677A");
const RULE = rgb("DCE7EF");
const STRIPE = rgb("F3F8FB");

const MARGIN = 40;

/**
 * The PDF: the logo, the title, when it was made, what it is about and which filters were on, then
 * the table (blue header, striped rows, header repeated on every page), with page numbers.
 */
export function buildPdf(
  spec: ExportSpec,
  logo?: PdfLogo,
  now = new Date(),
  { compress = true }: { compress?: boolean } = {},
): Uint8Array {
  const doc = new jsPDF({
    orientation: spec.columns.length > 5 ? "landscape" : "portrait",
    unit: "pt",
    format: "a4",
    compress,
  });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - MARGIN * 2;

  let y = MARGIN;
  if (logo) {
    const height = 44;
    doc.addImage(logo.bytes, "PNG", MARGIN, y, (height * logo.width) / logo.height, height, "somnog-logo");
  }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(pdfText(`Generated ${generatedLabel(now)}`), pageWidth - MARGIN, y + 14, { align: "right" });
  doc.text("Training Hub", pageWidth - MARGIN, y + 27, { align: "right" });
  y += logo ? 66 : 20;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...INK);
  doc.text(pdfText(spec.title), MARGIN, y + 14);
  y += 34;

  // What the table is about, in one or two columns of "Label  value".
  const facts = spec.facts ?? [];
  const perColumn = facts.length > 4 ? Math.ceil(facts.length / 2) : facts.length;
  const columnGap = contentWidth / 2;
  doc.setFontSize(10);
  facts.forEach(([label, value], i) => {
    const x = MARGIN + Math.floor(i / perColumn) * columnGap;
    const lineY = y + (i % perColumn) * 15;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...MUTED);
    doc.text(pdfText(label), x, lineY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...INK);
    doc.text(pdfText(value), x + 78, lineY);
  });
  if (facts.length > 0) y += perColumn * 15 + 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  const filterLines = doc.splitTextToSize(pdfText(`Filters: ${filtersLine(spec.filters)}`), contentWidth) as string[];
  doc.text(filterLines, MARGIN, y);
  y += filterLines.length * 12 + 8;

  autoTable(doc, {
    startY: y,
    margin: { top: 56, left: MARGIN, right: MARGIN, bottom: 52 },
    theme: "grid",
    head: [spec.columns.map((c) => pdfText(c.header))],
    body: spec.rows.map((row) => row.map((cell) => pdfText(cell))),
    styles: {
      font: "helvetica",
      fontSize: 9.5,
      cellPadding: { top: 6, right: 7, bottom: 6, left: 7 },
      textColor: INK,
      lineColor: RULE,
      lineWidth: 0.6,
      valign: "middle",
    },
    headStyles: { fillColor: BRAND, textColor: ON_BRAND, fontStyle: "bold" },
    alternateRowStyles: { fillColor: STRIPE },
    columnStyles: Object.fromEntries(spec.columns.map((c, i) => [i, { halign: c.align ?? "left" }])),
    didParseCell: (data) => {
      if (data.section !== "body" || data.column.index !== spec.statusColumn) return;
      const tone = statusTone(data.cell.text.join(" "));
      if (!tone) return;
      data.cell.styles.textColor = rgb(TONE_HEX[tone]);
      data.cell.styles.fontStyle = "bold";
    },
  });

  // Running header from page 2 on, and a footer with the page number on every page.
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    if (page > 1) doc.text(pdfText(spec.title), MARGIN, 32);
    doc.setDrawColor(...RULE);
    doc.setLineWidth(0.6);
    doc.line(MARGIN, pageHeight - 36, pageWidth - MARGIN, pageHeight - 36);
    doc.text("Training Hub - SOMNOG 9", MARGIN, pageHeight - 22);
    doc.text(`Page ${page} of ${pages}`, pageWidth - MARGIN, pageHeight - 22, { align: "right" });
  }

  return new Uint8Array(doc.output("arraybuffer"));
}
