"use server";

import { revalidatePath } from "next/cache";
import { failure, success, type ActionState } from "@/lib/action-state";
import { createSession } from "@/lib/api/sessions";
import { composeTimeSlot, optionalText, text } from "@/lib/forms";

export async function createSessionAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const values = {
    session_id: text(formData, "session_id"),
    workshop_id: text(formData, "workshop_id"),
    facilitator_id: text(formData, "facilitator_id"),
    topic_id: text(formData, "topic_id"),
    day: text(formData, "day"),
    date: text(formData, "date"),
    start_time: text(formData, "start_time"),
    end_time: text(formData, "end_time"),
  };

  try {
    const session = await createSession({
      session_id: optionalText(formData, "session_id"),
      workshop_id: values.workshop_id,
      facilitator_id: values.facilitator_id,
      topic_id: values.topic_id,
      day: Number(values.day),
      date: values.date,
      time_slot: composeTimeSlot(values.start_time, values.end_time),
    });
    revalidatePath("/training", "layout");
    return success(
      `Session ${session.session_id} created for ${session.workshop_id}, day ${session.day}.`,
      {
        href: `/training/attendance?session=${encodeURIComponent(session.session_id)}`,
        label: "Take attendance",
      },
    );
  } catch (error) {
    return failure(error, values);
  }
}
