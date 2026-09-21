"use client";

import { useState } from "react";
import { DocumentIcon, SheetIcon } from "@/components/training/Icons";
import type { ExportSpec } from "@/lib/export/types";

type Kind = "xlsx" | "pdf";

/**
 * "Download: Excel, PDF" for the table beside it. It downloads what the table shows right now
 * (after the filters). The Excel and PDF code is loaded only when a button is pressed.
 */
export default function ExportButtons({ spec }: { spec: ExportSpec }) {
  const [busy, setBusy] = useState<Kind | null>(null);
  const [failed, setFailed] = useState(false);
  const empty = spec.rows.length === 0;

  async function download(kind: Kind) {
    setBusy(kind);
    setFailed(false);
    try {
      const { downloadPdf, downloadXlsx } = await import("@/lib/export/download");
      await (kind === "xlsx" ? downloadXlsx(spec) : downloadPdf(spec));
    } catch {
      setFailed(true);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="export" role="group" aria-label="Download this table">
      <span className="export-label">Download</span>
      <button
        type="button"
        className="btn btn-quiet btn-sm"
        data-pending={busy === "xlsx"}
        disabled={busy !== null || empty}
        title={empty ? "There is nothing to download" : "Download as an Excel file (.xlsx)"}
        onClick={() => download("xlsx")}
      >
        <SheetIcon />
        Excel
      </button>
      <button
        type="button"
        className="btn btn-quiet btn-sm"
        data-pending={busy === "pdf"}
        disabled={busy !== null || empty}
        title={empty ? "There is nothing to download" : "Download as a PDF file"}
        onClick={() => download("pdf")}
      >
        <DocumentIcon />
        PDF
      </button>
      {failed && (
        <p className="export-error" role="alert">
          The file could not be made. Please try again.
        </p>
      )}
    </div>
  );
}
