"use client";

import { useActionState } from "react";
import { submitScoreAction } from "@/app/training/assessments/actions";
import type { ActionState } from "@/lib/action-state";
import type { Option } from "@/lib/catalog";
import { ID_RULE } from "@/lib/roster";
import Combobox from "./Combobox";
import { Field, FormAlert, SubmitButton } from "./FormControls";

const ID_PATTERN = "[A-Za-z0-9_\\-]{1,64}";
const initial: ActionState = { status: "idle" };

/** Submits one participant's score; the service computes PASS/FAIL. Ready for the next one right after. */
export default function ScoreForm({
  assessmentId,
  totalMarks,
  participants,
}: {
  assessmentId: string;
  totalMarks: number;
  /** Participants of the workshop who do not have a score yet. */
  participants: Option[];
}) {
  const [state, action] = useActionState(submitScoreAction.bind(null, assessmentId), initial);
  const typed = state.status === "error" ? state.values : undefined;

  return (
    <div className="entry">
      <form action={action} className="inline-form">
        <Combobox
          name="participant_id"
          label="Participant"
          options={participants}
          emptyHint="Everyone we know in this workshop has a score. Type the ID of someone new."
          noun="participant"
          required
          pattern={ID_PATTERN}
          patternHint={ID_RULE}
          focusOn={state.status === "success" ? state : null} // ready for the next participant
          defaultValue={typed?.participant_id}
          placeholder="Choose or type, like P-001"
        />

        <Field label={`Score out of ${totalMarks}`} className="narrow">
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

        <SubmitButton pendingLabel="Saving…">Save score</SubmitButton>
      </form>
      <p className="muted note" style={{ marginTop: 10 }}>
        A saved score can’t be changed.
      </p>
      <FormAlert state={state} />
    </div>
  );
}
