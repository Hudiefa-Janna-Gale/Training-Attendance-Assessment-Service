import { fileNameFor } from "./format";
import type { PdfLogo } from "./pdf";
import type { ExportSpec } from "./types";

const XLSX_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/** Hands the bytes to the browser as a download. */
function save(bytes: Uint8Array, type: string, fileName: string) {
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

/** The light logo, for the top of the PDF. A file without a logo is better than no file. */
async function loadLogo(): Promise<PdfLogo | undefined> {
  try {
    const response = await fetch("/images/somnog-640.png");
    if (!response.ok) return undefined;
    return { bytes: new Uint8Array(await response.arrayBuffer()), width: 640, height: 229 };
  } catch {
    return undefined;
  }
}

// The Excel and PDF libraries are large, so they load only when a download is asked for.

export async function downloadXlsx(spec: ExportSpec): Promise<void> {
  const { buildXlsx } = await import("./xlsx");
  save(await buildXlsx(spec), XLSX_TYPE, fileNameFor(spec, "xlsx"));
}

export async function downloadPdf(spec: ExportSpec): Promise<void> {
  const [{ buildPdf }, logo] = await Promise.all([import("./pdf"), loadLogo()]);
  save(buildPdf(spec, logo), "application/pdf", fileNameFor(spec, "pdf"));
}
