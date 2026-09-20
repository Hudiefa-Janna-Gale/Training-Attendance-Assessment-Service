"use client";

import { useActionState, useRef, useState } from "react";
import { saveAttendanceAction } from "@/app/training/attendance/actions";
import type { ActionState } from "@/lib/action-state";
import type { AttendanceRow } from "@/lib/roster";
import type { AttendanceStatus } from "@/types/training";
import AddParticipant from "./AddParticipant";
import { FormAlert, SubmitButton } from "./FormControls";

const STATUSES: { value: AttendanceStatus; label: string }[] = [
  { value: "present", label: "Present" },
  { value: "absent", label: "Absent" },
  { value: "excused", label: "Excused" },
];
const initial: ActionState = { status: "idle" };

/** Roll call for one session: one row per participant, one status each, saved in one go. */
export default function AttendanceSheet({
  sessionId,
  roster,
}: {
  sessionId: string;
  /** Participants already recorded for the session. */
  roster: AttendanceRow[];
}) {
  const [state, action] = useActionState(saveAttendanceAction.bind(null, sessionId), initial);
  const [added, setAdded] = useState<string[]>([]);
  const formRef = useRef<HTMLFormElement>(null);

  const known = new Set(roster.map((r) => r.participantId));
  const rows: AttendanceRow[] = [
    ...roster,
    ...added.filter((id) => !known.has(id)).map((participantId) => ({ participantId, status: null })),
  ];

  function markAllPresent() {
    formRef.current
      ?.querySelectorAll<HTMLInputElement>('input[type="radio"][value="present"]')
      .forEach((radio) => (radio.checked = true));
  }

  return (
    <form ref={formRef} action={action} className="form">
      {rows.length === 0 ? (
        <p className="sub">No attendance recorded yet. Add the participants below.</p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Participant ID</th>
                <th scope="col">Attendance status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.participantId}>
                  <td>
                    <strong>{row.participantId}</strong>
                    {row.status === null && <span className="muted note"> · not saved yet</span>}
                  </td>
                  <td>
                    <fieldset className="segmented" aria-label={`Attendance for ${row.participantId}`}>
                      {STATUSES.map((s) => (
                        <label key={s.value} className={`seg seg-${s.value}`}>
                          <input
                            type="radio"
                            name={`status:${row.participantId}`}
                            value={s.value}
                            // Newly added participants start as absent, the service's default.
                            defaultChecked={(row.status ?? "absent") === s.value}
                          />
                          <span>{s.label}</span>
                        </label>
                      ))}
                    </fieldset>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AddParticipant
        exists={(id) => rows.some((r) => r.participantId === id)}
        onAdd={(ids) => setAdded((list) => [...list, ...ids])}
      />

      <FormAlert state={state} />
      <div className="actions">
        <button type="button" className="btn btn-ghost" onClick={markAllPresent} disabled={rows.length === 0}>
          Mark all present
        </button>
        <SubmitButton pendingLabel="Saving…">Save attendance</SubmitButton>
      </div>
    </form>
  );
}
