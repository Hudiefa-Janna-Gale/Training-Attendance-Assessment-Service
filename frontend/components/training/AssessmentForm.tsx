"use client";

import { useActionState } from "react";
import { createAssessmentAction } from "@/app/training/assessments/actions";
import type { ActionState } from "@/lib/action-state";
import { Field, FormAlert, SubmitButton } from "./FormControls";

const ID_PATTERN = "[A-Za-z0-9_\\-]{1,64}";
const initial: ActionState = { status: "idle" };

/** Creates the workshop's final assessment (day 3) or an optional daily quiz. */
export default function AssessmentForm() {
  const [state, action] = useActionState(createAssessmentAction, initial);
  const typed = state.status === "error" ? state.values : undefined;

  return (
    <form action={action} className="form">
      <div className="form-grid">
        <Field label="Workshop ID" hint="From the Workshop service">
          <input
            className="input"
            name="workshop_id"
            required
            pattern={ID_PATTERN}
            defaultValue={typed?.workshop_id}
            placeholder="WS-2025-001"
          />
        </Field>

        <Field label="Title" className="span-2">
          <input
            className="input"
            name="title"
            required
            maxLength={200}
            defaultValue={typed?.title}
            placeholder="Day 3 Final Assessment"
          />
        </Field>

        <Field label="Day">
          <select className="input" name="day" required defaultValue={typed?.day ?? "3"}>
            <option value="1">Day 1</option>
            <option value="2">Day 2</option>
            <option value="3">Day 3</option>
          </select>
        </Field>

        <Field label="Kind" hint="A workshop has one final, on day 3">
          <select className="input" name="type" defaultValue={typed?.type ?? ""}>
            <option value="">Automatic (final on day 3, otherwise quiz)</option>
            <option value="FINAL">Final assessment</option>
            <option value="QUIZ">Daily quiz</option>
          </select>
        </Field>

        <Field label="Total marks" hint="Default 100">
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

        <Field label="Pass mark" hint="Default 60">
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

        <Field label="Assessment ID (optional)" hint="Leave blank to generate ASS-001, …">
          <input
            className="input"
            name="assessment_id"
            pattern={ID_PATTERN}
            defaultValue={typed?.assessment_id}
            placeholder="auto"
          />
        </Field>
      </div>

      <FormAlert state={state} />
      <div className="actions">
        <SubmitButton pendingLabel="Creating…">Create assessment</SubmitButton>
      </div>
    </form>
  );
}
