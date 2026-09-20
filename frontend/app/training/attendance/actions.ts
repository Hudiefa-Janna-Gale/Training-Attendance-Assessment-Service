"use server";

import { revalidatePath } from "next/cache";
import { failure, success, type ActionState } from "@/lib/action-state";
import { recordAttendance } from "@/lib/api/attendance";
import { parseAttendanceForm } from "@/lib/forms";
import { plural } from "@/lib/format";

/** Saves the whole attendance sheet for one session (bound to the session id by the form). */
export async function saveAttendanceAction(
  sessionId: string,
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const records = parseAttendanceForm(formData);
  if (records.length === 0) {
    return { status: "error", message: "Add at least one participant before saving." };
  }

  try {
    await recordAttendance(sessionId, records);
    revalidatePath("/training", "layout");
    return success(`Attendance saved for ${plural(records.length, "participant")}.`);
  } catch (error) {
    return failure(error);
  }
}
