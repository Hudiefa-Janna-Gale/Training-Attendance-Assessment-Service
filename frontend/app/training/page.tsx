import { redirect } from "next/navigation";

// The service has no overview or dashboard: it does sessions, attendance, assessments and results.
export default function TrainingIndex() {
  redirect("/training/sessions");
}
