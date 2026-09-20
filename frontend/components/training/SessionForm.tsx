"use client";

import { useActionState } from "react";
import { createSessionAction } from "@/app/training/sessions/actions";
import type { ActionState } from "@/lib/action-state";
import { Field, FormAlert, SubmitButton } from "./FormControls";

const ID_PATTERN = "[A-Za-z0-9_\\-]{1,64}";
const initial: ActionState = { status: "idle" };

/** Creates a training session and assigns its facilitator and topic. */
export default function SessionForm() {
  const [state, action] = useActionState(createSessionAction, initial);
  const typed = state.status === "error" ? state.values : undefined;

  return (
    <form action={action} className="form">
      <div className="form-grid">
        <Field label="Workshop ID" hint="From the Workshop service, e.g. WS-2025-001">
          <input
            className="input"
            name="workshop_id"
            required
            pattern={ID_PATTERN}
            defaultValue={typed?.workshop_id}
            placeholder="WS-2025-001"
          />
        </Field>

        <Field label="Day" hint="Workshops run for 3 days">
          <select className="input" name="day" required defaultValue={typed?.day ?? "1"}>
            <option value="1">Day 1</option>
            <option value="2">Day 2</option>
            <option value="3">Day 3</option>
          </select>
        </Field>

        <Field label="Date">
          <input className="input" type="date" name="date" required defaultValue={typed?.date} />
        </Field>

        <Field label="Starts">
          <input
            className="input"
            type="time"
            name="start_time"
            required
            defaultValue={typed?.start_time ?? "08:00"}
          />
        </Field>

        <Field label="Ends">
          <input
            className="input"
            type="time"
            name="end_time"
            required
            defaultValue={typed?.end_time ?? "09:30"}
          />
        </Field>

        <Field label="Facilitator ID" hint="From the Facilitator service">
          <input
            className="input"
            name="facilitator_id"
            required
            pattern={ID_PATTERN}
            defaultValue={typed?.facilitator_id}
            placeholder="FAC-001"
          />
        </Field>

        <Field label="Topic ID" hint="From the Topic service">
          <input
            className="input"
            name="topic_id"
            required
            pattern={ID_PATTERN}
            defaultValue={typed?.topic_id}
            placeholder="TOP-001"
          />
        </Field>

        <Field label="Session ID (optional)" hint="Leave blank to generate SES-001, SES-002, …">
          <input
            className="input"
            name="session_id"
            pattern={ID_PATTERN}
            defaultValue={typed?.session_id}
            placeholder="auto"
          />
        </Field>
      </div>

      <FormAlert state={state} />
      <div className="actions">
        <SubmitButton pendingLabel="Creating…">Create session</SubmitButton>
      </div>
    </form>
  );
}
