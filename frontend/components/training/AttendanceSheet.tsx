"use client";

import { useActionState, useRef, useState } from "react";
import { saveAttendanceAction } from "@/app/training/attendance/actions";
import ExportButtons from "@/components/export/ExportButtons";
import FilterBar from "@/components/filters/FilterBar";
import type { ActionState } from "@/lib/action-state";
import { rosterSpec } from "@/lib/export/specs";
import { countActive, describeFilters, filterRoster, NO_ROSTER_FILTERS, type FilterField } from "@/lib/filters";
import type { AttendanceRow } from "@/lib/roster";
import { useUrlFilters } from "@/lib/use-url-filters";
import type { AttendanceStatus, Session } from "@/types/training";
import AddParticipant from "./AddParticipant";
import { FormAlert, SubmitButton } from "./FormControls";

const STATUSES: { value: AttendanceStatus; label: string }[] = [
  { value: "present", label: "Present" },
  { value: "absent", label: "Absent" },
  { value: "excused", label: "Excused" },
];
const initial: ActionState = { status: "idle" };

const FIELDS: FilterField[] = [
  { key: "rq", label: "Search", kind: "search", placeholder: "Participant" },
  {
    key: "status",
    label: "Saved as",
    kind: "select",
    any: "Any status",
    options: [
      { value: "present", label: "Present" },
      { value: "absent", label: "Absent" },
      { value: "excused", label: "Excused" },
      { value: "unsaved", label: "Not saved yet" },
    ],
  },
];

/**
 * Roll call for one session: one row per participant, one status each, saved in one go. Filters
 * over the list only hide rows (every row is still saved), and the download buttons take the list
 * as it is saved.
 */
export default function AttendanceSheet({
  session,
  roster,
}: {
  session: Session;
  /** Participants already recorded for the session. */
  roster: AttendanceRow[];
}) {
  const sessionId = session.session_id;
  const [state, action] = useActionState(saveAttendanceAction.bind(null, sessionId), initial);
  const [added, setAdded] = useState<string[]>([]);
  const { values, change, clear } = useUrlFilters(NO_ROSTER_FILTERS);
  const formRef = useRef<HTMLFormElement>(null);

  const known = new Set(roster.map((r) => r.participantId));
  const rows: AttendanceRow[] = [
    ...roster,
    ...added.filter((id) => !known.has(id)).map((participantId) => ({ participantId, status: null })),
  ];

  const visible = filterRoster(rows, values);
  const shownIds = new Set(visible.map((r) => r.participantId));
  const filtering = countActive(values) > 0;

  function markShownPresent() {
    formRef.current
      ?.querySelectorAll<HTMLInputElement>('.roll-row:not([hidden]) input[type="radio"][value="present"]')
      .forEach((radio) => (radio.checked = true));
  }

  return (
    <>
      {rows.length > 0 && (
        <FilterBar
          fields={FIELDS}
          values={values}
          onChange={(key, value) => change({ [key]: value })}
          onClear={clear}
          noun="participant"
          shown={visible.length}
          total={rows.length}
          actions={<ExportButtons spec={rosterSpec(session, visible, describeFilters(FIELDS, values))} />}
        />
      )}

      <form ref={formRef} action={action}>
        {rows.length === 0 ? (
          <p className="empty">
            <strong>No participants yet</strong>
            Add them below to start the roll call.
          </p>
        ) : (
          <>
            {visible.length === 0 && (
              <p className="empty">
                <strong>No participants match these filters</strong>
                Clear the filters to see everyone.
              </p>
            )}
            <ul className="roll">
              {rows.map((row) => (
                <li className="roll-row" key={row.participantId} hidden={!shownIds.has(row.participantId)}>
                  <span className="roll-name">
                    {row.participantId}
                    {row.status === null && <small>not saved yet</small>}
                  </span>
                  <fieldset className="segmented">
                    <legend className="sr-only">Attendance for {row.participantId}</legend>
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
                </li>
              ))}
            </ul>
          </>
        )}

        <AddParticipant
          exists={(id) => rows.some((r) => r.participantId === id)}
          onAdd={(ids) => setAdded((list) => [...list, ...ids])}
        />

        <div className="sticky-actions">
          <button type="button" className="btn btn-quiet" onClick={markShownPresent} disabled={visible.length === 0}>
            {filtering ? "Mark shown as present" : "Mark all present"}
          </button>
          <SubmitButton pendingLabel="Saving…">Save attendance</SubmitButton>
          <FormAlert state={state} />
        </div>
      </form>
    </>
  );
}
