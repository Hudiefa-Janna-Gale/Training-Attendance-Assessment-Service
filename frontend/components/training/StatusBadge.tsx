type Tone = "green" | "red" | "amber" | "blue" | "gray";

const TONES: Record<string, Tone> = {
  // attendance status
  present: "green",
  absent: "red",
  excused: "amber",
  // PASS / FAIL
  PASS: "green",
  FAIL: "red",
  // assessment kind
  FINAL: "blue",
  QUIZ: "gray",
};

/** Small coloured pill for a status the service reports. */
export default function StatusBadge({ status, label }: { status: string; label?: string }) {
  const tone = TONES[status] ?? "gray";
  return <span className={`pill ${tone}`}>{label ?? status}</span>;
}
