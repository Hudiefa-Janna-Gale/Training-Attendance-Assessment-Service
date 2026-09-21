"use client";

import { useActionState } from "react";
import { createAssessmentAction } from "@/app/training/assessments/actions";
import type { ActionState } from "@/lib/action-state";
import { DAY_PATTERN, DAY_RULE, suggestDay, type Option } from "@/lib/catalog";
import { ID_RULE } from "@/lib/roster";
import Combobox from "./Combobox";
import { Field, FormAlert, SubmitButton } from "./FormControls";

const ID_PATTERN = "[A-Za-z0-9_\\-]{1,64}";
const initial: ActionState = { status: "idle" };

/** Creates the workshop's final assessment (day 3) or an optional daily quiz. */
export default function AssessmentForm({ workshops, days }: { workshops: Option[]; days: Option[] }) {
  const [state, action] = useActionState(createAssessmentAction, initial);
  const typed = state.status === "error" ? state.values : undefined;

  return (
    <form action={action} className="form-stack">
      <Combobox
        name="workshop_id"
        label="Workshop"
        hint="Pick a workshop, or type a new one."
        options={workshops}
        emptyHint="No workshops yet. Type the ID of the first one."
        noun="workshop"
        required
        pattern={ID_PATTERN}
        patternHint={ID_RULE}
        defaultValue={typed?.workshop_id}
        placeholder="Choose or type, like WS-2025-001"
      />

      <Field label="Title">
        <input
          className="input"
          name="title"
          required
          maxLength={200}
          defaultValue={typed?.title}
          placeholder="Day 3 Final Assessment"
        />
      </Field>

      <div className="pair">
        <Combobox
          name="day"
          label="Day"
          options={days}
          noun="day"
          required
          pattern={DAY_PATTERN}
          patternHint={DAY_RULE}
          suggest={suggestDay}
          defaultValue={typed?.day ?? "3"}
          placeholder="Choose or type, like 4"
        />
        <Field label="Kind">
          <select className="input" name="type" defaultValue={typed?.type ?? ""}>
            <option value="">Automatic</option>
            <option value="FINAL">Final assessment</option>
            <option value="QUIZ">Daily quiz</option>
          </select>
        </Field>
      </div>
      <p className="muted note">
        Automatic makes it the final on day 3 and a quiz on any other day. A workshop has one final, and it is on day 3.
      </p>

      <div className="pair">
        <Field label="Total marks" hint="100 if left empty.">
          <input
            className="input"
            type="number"
            name="total_marks"
            min={1}
            step={1}
            defaultValue={typed?.total_marks}
            placeholder="100"
          />
        </Field>
        <Field label="Pass mark" hint="60 if left empty.">
          <input
            className="input"
            type="number"
            name="pass_mark"
            min={0}
            step={1}
            defaultValue={typed?.pass_mark}
            placeholder="60"
          />
        </Field>
      </div>

      <Field label="Assessment ID (optional)" hint="Leave it empty and one is generated, like ASS-011.">
        <input
          className="input"
          name="assessment_id"
          pattern={ID_PATTERN}
          defaultValue={typed?.assessment_id}
          placeholder="Generated for you"
        />
      </Field>

      <FormAlert state={state} />
      <div className="form-actions">
        <SubmitButton pendingLabel="Creating…">Create assessment</SubmitButton>
      </div>
    </form>
  );
}
