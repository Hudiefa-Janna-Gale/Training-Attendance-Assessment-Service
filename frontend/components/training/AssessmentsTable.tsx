"use client";

import Link from "next/link";
import { useMemo } from "react";
import ExportButtons from "@/components/export/ExportButtons";
import FilterBar from "@/components/filters/FilterBar";
import { assessmentsSpec } from "@/lib/export/specs";
import {
  choices,
  dayChoices,
  describeFilters,
  filterAssessments,
  NO_ASSESSMENT_FILTERS,
  type FilterField,
} from "@/lib/filters";
import { useUrlFilters } from "@/lib/use-url-filters";
import type { Assessment } from "@/types/training";
import StatusBadge from "./StatusBadge";

/**
 * Every assessment (newest first), so what you just created is right there at the top, with
 * filters over it and Excel / PDF downloads of what is shown.
 */
export default function AssessmentsTable({
  assessments,
  selectedId,
}: {
  assessments: Assessment[];
  selectedId: string;
}) {
  const { values, change, clear, href } = useUrlFilters(NO_ASSESSMENT_FILTERS);

  const fields = useMemo<FilterField[]>(
    () => [
      { key: "q", label: "Search", kind: "search", placeholder: "Assessment, title, workshop…" },
      { key: "workshop", label: "Workshop", kind: "select", any: "Any workshop", options: choices(assessments.map((a) => a.workshop_id)) },
      {
        key: "kind",
        label: "Kind",
        kind: "select",
        any: "Any kind",
        options: [
          { value: "FINAL", label: "Final assessment" },
          { value: "QUIZ", label: "Daily quiz" },
        ],
      },
      { key: "day", label: "Day", kind: "select", any: "Any day", options: dayChoices(assessments.map((a) => a.day)), advanced: true },
    ],
    [assessments],
  );

  const shown = filterAssessments(assessments, values);
  const spec = assessmentsSpec(shown, describeFilters(fields, values));

  return (
    <section className="sheet">
      <div className="sheet-head">
        <div className="sheet-heading">
          <h2 className="sheet-title">All assessments</h2>
          <span className="count">{assessments.length}</span>
        </div>
        {assessments.length > 0 && <ExportButtons spec={spec} />}
      </div>

      {assessments.length === 0 ? (
        <p className="empty">
          <strong>No assessments yet</strong>
          Use “New assessment” to add the workshop’s final, or a daily quiz.
        </p>
      ) : (
        <>
          <FilterBar
            fields={fields}
            values={values}
            onChange={(key, value) => change({ [key]: value })}
            onClear={clear}
            noun="assessment"
            shown={shown.length}
            total={assessments.length}
          />

          {shown.length === 0 ? (
            <p className="empty">
              <strong>No assessments match these filters</strong>
              Try other words, or clear the filters to see every assessment.
            </p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">Assessment</th>
                    <th scope="col">Title</th>
                    <th scope="col">Workshop</th>
                    <th scope="col">Day</th>
                    <th scope="col">Kind</th>
                    <th scope="col">Pass mark</th>
                    <th scope="col">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((a) => (
                    <tr key={a.assessment_id} className={a.assessment_id === selectedId ? "selected" : undefined}>
                      <td data-label="Assessment">
                        <span className="id">{a.assessment_id}</span>
                      </td>
                      <td data-label="Title" className="wrap">
                        {a.title}
                      </td>
                      <td data-label="Workshop">{a.workshop_id}</td>
                      <td data-label="Day">Day {a.day}</td>
                      <td data-label="Kind">
                        <StatusBadge status={a.type} />
                      </td>
                      <td data-label="Pass mark">
                        {a.pass_mark} of {a.total_marks}
                      </td>
                      <td className="cell-actions">
                        <Link
                          className={`btn btn-sm ${a.assessment_id === selectedId ? "btn-primary" : "btn-quiet"}`}
                          href={href({ assessment: a.assessment_id })}
                        >
                          {a.assessment_id === selectedId ? "Open" : "Enter scores"}
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
