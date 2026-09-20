"use server";

import { revalidatePath } from "next/cache";
import { failure, success, type ActionState } from "@/lib/action-state";
import { createAssessment, submitScore } from "@/lib/api/assessments";
import { optionalInt, optionalText, text } from "@/lib/forms";
import type { AssessmentType } from "@/types/training";

export async function createAssessmentAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const values = {
    assessment_id: text(formData, "assessment_id"),
    workshop_id: text(formData, "workshop_id"),
    title: text(formData, "title"),
    day: text(formData, "day"),
    type: text(formData, "type"),
    total_marks: text(formData, "total_marks"),
    pass_mark: text(formData, "pass_mark"),
  };

  const totalMarks = optionalInt(formData, "total_marks");
  const passMark = optionalInt(formData, "pass_mark");
  if (Number.isNaN(totalMarks) || Number.isNaN(passMark)) {
    return { status: "error", message: "Total marks and pass mark must be whole numbers.", values };
  }

  try {
    const assessment = await createAssessment({
      assessment_id: optionalText(formData, "assessment_id"),
      workshop_id: values.workshop_id,
      title: values.title,
      day: Number(values.day),
      type: optionalText(formData, "type") as AssessmentType | undefined,
      total_marks: totalMarks,
      pass_mark: passMark,
    });
    revalidatePath("/training", "layout");
    return success(
      `Assessment ${assessment.assessment_id} created (${assessment.type.toLowerCase()}).`,
      {
        href: `/training/assessments?assessment=${encodeURIComponent(assessment.assessment_id)}`,
        label: "Enter scores",
      },
    );
  } catch (error) {
    return failure(error, values);
  }
}

/** Submits one participant's score (bound to the assessment id by the form). */
export async function submitScoreAction(
  assessmentId: string,
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const values = {
    participant_id: text(formData, "participant_id"),
    score: text(formData, "score"),
  };

  if (!/^\d+$/.test(values.score)) {
    return { status: "error", message: "The score must be a whole number.", values };
  }

  try {
    const saved = await submitScore(assessmentId, values.participant_id, Number(values.score));
    revalidatePath("/training", "layout");
    return success(`Saved ${saved.participant_id}: ${saved.score} — ${saved.result}.`);
  } catch (error) {
    return failure(error, values);
  }
}
