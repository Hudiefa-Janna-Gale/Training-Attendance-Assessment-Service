/** A value as it is shown in the file. Numbers stay numbers, so Excel can sort and add them. */
export type ExportCell = string | number;

export interface ExportColumn {
  header: string;
  align?: "left" | "right" | "center";
}

/**
 * Everything a download needs, already in the words people see on screen. Each table builds one of
 * these from what it is showing (after the filters), and the Excel and PDF files are drawn from it.
 */
export interface ExportSpec {
  title: string;
  /** What the table is about, above it: [["Workshop", "technical"], ["Day", "1"]]. */
  facts?: [string, string][];
  /** The filters in force, in words: [["Day", "Day 2"]]. Left out or empty means "none". */
  filters?: [string, string][];
  columns: ExportColumn[];
  rows: ExportCell[][];
  /** The column (0-based) whose words are coloured by meaning: PASS/FAIL, Present/Absent… */
  statusColumn?: number;
  /** The file name before the date and the extension, e.g. "training-sessions". */
  fileName: string;
}
