"use client";

import Link from "next/link";
import { useMemo } from "react";
import ExportButtons from "@/components/export/ExportButtons";
import FilterBar from "@/components/filters/FilterBar";
import { sessionsSpec } from "@/lib/export/specs";
import {
  choices,
  dayChoices,
  describeFilters,
  filterSessions,
  NO_SESSION_FILTERS,
  type FilterField,
} from "@/lib/filters";
import { formatDate } from "@/lib/format";
import { useUrlFilters } from "@/lib/use-url-filters";
import type { Session } from "@/types/training";

/**
 * Every session (newest first), so what you just created is right there at the top, with filters
 * over it and Excel / PDF downloads of what is shown.
 */
export default function SessionsTable({ sessions }: { sessions: Session[] }) {
  const { values, change, clear } = useUrlFilters(NO_SESSION_FILTERS);

  const fields = useMemo<FilterField[]>(
    () => [
      { key: "q", label: "Search", kind: "search", placeholder: "Session, workshop, facilitator, topic, date…" },
      { key: "workshop", label: "Workshop", kind: "select", any: "Any workshop", options: choices(sessions.map((s) => s.workshop_id)) },
      { key: "day", label: "Day", kind: "select", any: "Any day", options: dayChoices(sessions.map((s) => s.day)) },
      { key: "from", label: "From date", kind: "date", advanced: true },
      { key: "to", label: "To date", kind: "date", advanced: true },
      { key: "facilitator", label: "Facilitator", kind: "select", any: "Any facilitator", options: choices(sessions.map((s) => s.facilitator_id)), advanced: true },
      { key: "topic", label: "Topic", kind: "select", any: "Any topic", options: choices(sessions.map((s) => s.topic_id)), advanced: true },
    ],
    [sessions],
  );

  const shown = filterSessions(sessions, values);
  const spec = sessionsSpec(shown, describeFilters(fields, values));

  return (
    <section className="sheet">
      <div className="sheet-head">
        <div className="sheet-heading">
          <h2 className="sheet-title">All sessions</h2>
          <span className="count">{sessions.length}</span>
        </div>
        {sessions.length > 0 && <ExportButtons spec={spec} />}
      </div>

      {sessions.length === 0 ? (
        <p className="empty">
          <strong>No sessions yet</strong>
          Use “New session” to add the first one.
        </p>
      ) : (
        <>
          <FilterBar
            fields={fields}
            values={values}
            onChange={(key, value) => change({ [key]: value })}
            onClear={clear}
            noun="session"
            shown={shown.length}
            total={sessions.length}
          />

          {shown.length === 0 ? (
            <p className="empty">
              <strong>No sessions match these filters</strong>
              Try other words, or clear the filters to see every session.
            </p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">Session</th>
                    <th scope="col">Workshop</th>
                    <th scope="col">Day</th>
                    <th scope="col">Date</th>
                    <th scope="col">Time</th>
                    <th scope="col">Facilitator</th>
                    <th scope="col">Topic</th>
                    <th scope="col">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((s) => (
                    <tr key={s.session_id}>
                      <td data-label="Session">
                        <span className="id">{s.session_id}</span>
                      </td>
                      <td data-label="Workshop">{s.workshop_id}</td>
                      <td data-label="Day">Day {s.day}</td>
                      <td data-label="Date">{formatDate(s.date)}</td>
                      <td data-label="Time">{s.time_slot}</td>
                      <td data-label="Facilitator">{s.facilitator_id}</td>
                      <td data-label="Topic">{s.topic_id}</td>
                      <td className="cell-actions">
                        <Link
                          className="btn btn-quiet btn-sm"
                          href={`/training/attendance?session=${encodeURIComponent(s.session_id)}`}
                        >
                          Take attendance
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  );
}
