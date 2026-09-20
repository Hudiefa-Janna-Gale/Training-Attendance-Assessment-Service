"use client";

import { useActionState } from "react";
import { submitScoreAction } from "@/app/training/assessments/actions";
import type { ActionState } from "@/lib/action-state";
import { Field, FormAlert, SubmitButton } from "./FormControls";

const ID_PATTERN = "[A-Za-z0-9_\\-]{1,64}";
const initial: ActionState = { status: "idle" };

/** Submits one participant's score for the assessment; the service computes PASS/FAIL. */
export default function ScoreForm({
  assessmentId,
  totalMarks,
}: {
  assessmentId: string;
  totalMarks: number;
}) {
  const [state, action] = useActionState(submitScoreAction.bind(null, assessmentId), initial);
  const typed = state.status === "error" ? state.values : undefined;

  return (
    <form action={action} className="form">
      <div className="form-grid narrow">
        <Field label="Participant ID" hint="From the Participant service">
          <input
            className="input"
            name="participant_id"
            required
            pattern={ID_PATTERN}
            defaultValue={typed?.participant_id}
            placeholder="P-001"
          />
        </Field>

        <Field label={`Score (out of ${totalMarks})`} hint="A saved score can’t be changed">
          <input
            className="input"
            type="number"
            name="score"
            required
            min={0}
            max={totalMarks}
            step={1}
            inputMode="numeric"
            defaultValue={typed?.score}
          />
        </Field>
      </div>

      <FormAlert state={state} />
      <div className="actions">
        <SubmitButton pendingLabel="Saving…">Submit score</SubmitButton>
      </div>
    </form>
  );
}
