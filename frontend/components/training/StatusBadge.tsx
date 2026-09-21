type Tone = "green" | "red" | "amber" | "blue" | "gray";

const LOOK: Record<string, { tone: Tone; label: string }> = {
  // attendance status
  present: { tone: "green", label: "Present" },
  absent: { tone: "red", label: "Absent" },
  excused: { tone: "amber", label: "Excused" },
  // PASS / FAIL
  PASS: { tone: "green", label: "PASS" },
  FAIL: { tone: "red", label: "FAIL" },
  // assessment kind
  FINAL: { tone: "blue", label: "Final" },
  QUIZ: { tone: "gray", label: "Quiz" },
};

/** Small coloured pill for a status the service reports. */
export default function StatusBadge({ status, label }: { status: string; label?: string }) {
  const look = LOOK[status] ?? { tone: "gray" as const, label: status };
  return <span className={`pill ${look.tone}`}>{label ?? look.label}</span>;
}
