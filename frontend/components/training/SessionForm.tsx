"use client";

import { useActionState } from "react";
import { createSessionAction } from "@/app/training/sessions/actions";
import type { ActionState } from "@/lib/action-state";
import { DAY_PATTERN, DAY_RULE, suggestDay, type Option } from "@/lib/catalog";
import { ID_RULE } from "@/lib/roster";
import Combobox from "./Combobox";
import { Field, FormAlert, SubmitButton } from "./FormControls";

const ID_PATTERN = "[A-Za-z0-9_\\-]{1,64}";
const initial: ActionState = { status: "idle" };

/** Creates a training session and assigns its facilitator and topic. */
export default function SessionForm({
  workshops,
  facilitators,
  topics,
  days,
}: {
  workshops: Option[];
  facilitators: Option[];
  topics: Option[];
  days: Option[];
}) {
  const [state, action] = useActionState(createSessionAction, initial);
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
          defaultValue={typed?.day ?? "1"}
          placeholder="Choose or type, like 4"
        />
        <Field label="Date">
          <input className="input" type="date" name="date" required defaultValue={typed?.date} />
        </Field>
      </div>

      <div className="pair">
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
      </div>

      <div className="pair">
        <Combobox
          name="facilitator_id"
          label="Facilitator"
          options={facilitators}
          emptyHint="No facilitators yet. Type the ID of the first one."
          noun="facilitator"
          required
          pattern={ID_PATTERN}
          patternHint={ID_RULE}
          defaultValue={typed?.facilitator_id}
          placeholder="FAC-001"
        />
        <Combobox
          name="topic_id"
          label="Topic"
          options={topics}
          emptyHint="No topics yet. Type the ID of the first one."
          noun="topic"
          required
          pattern={ID_PATTERN}
          patternHint={ID_RULE}
          defaultValue={typed?.topic_id}
          placeholder="TOP-001"
        />
      </div>
      <p className="muted note">Facilitators and topics come from their own services: pick one you have used, or type a new ID.</p>

      <Field label="Session ID (optional)" hint="Leave it empty and one is generated, like SES-014.">
        <input
          className="input"
          name="session_id"
          pattern={ID_PATTERN}
          defaultValue={typed?.session_id}
          placeholder="Generated for you"
        />
      </Field>

      <FormAlert state={state} />
      <div className="form-actions">
        <SubmitButton pendingLabel="Creating…">Create session</SubmitButton>
      </div>
    </form>
  );
}
