"use client";

import { useMemo } from "react";
import ExportButtons from "@/components/export/ExportButtons";
import FilterBar from "@/components/filters/FilterBar";
import { scoresSpec } from "@/lib/export/specs";
import { describeFilters, filterScores, NO_SCORE_FILTERS, type FilterField } from "@/lib/filters";
import { useUrlFilters } from "@/lib/use-url-filters";
import type { AssessmentScores } from "@/types/training";
import StatusBadge from "./StatusBadge";

/** The scores saved for one assessment, with filters over them and Excel / PDF downloads of what is shown. */
export default function ScoresTable({ assessment }: { assessment: AssessmentScores }) {
  const { values, change, clear } = useUrlFilters(NO_SCORE_FILTERS);
  const { scores } = assessment;

  const fields = useMemo<FilterField[]>(
    () => [
      { key: "sq", label: "Search", kind: "search", placeholder: "Participant" },
      {
        key: "result",
        label: "Result",
        kind: "select",
        any: "Pass or fail",
        options: [
          { value: "PASS", label: "Pass" },
          { value: "FAIL", label: "Fail" },
        ],
      },
      { key: "min", label: "Lowest score", kind: "number", placeholder: "0", advanced: true },
      { key: "max", label: "Highest score", kind: "number", placeholder: String(assessment.total_marks), advanced: true },
    ],
    [assessment.total_marks],
  );

  const shown = filterScores(scores, values);
  const spec = scoresSpec(assessment, shown, describeFilters(fields, values));

  if (scores.length === 0) {
    return (
      <p className="empty">
        <strong>No scores yet</strong>
        Scores you save appear here.
      </p>
    );
  }

  return (
    <>
      <div className="sheet-head">
        <div className="sheet-heading">
          <h3 className="sheet-subtitle">Scores</h3>
          <span className="count">{scores.length}</span>
        </div>
        <ExportButtons spec={spec} />
      </div>

      <FilterBar
        fields={fields}
        values={values}
        onChange={(key, value) => change({ [key]: value })}
        onClear={clear}
        noun="score"
        shown={shown.length}
        total={scores.length}
      />

      {shown.length === 0 ? (
        <p className="empty">
          <strong>No scores match these filters</strong>
          Try other words, or clear the filters to see every score.
        </p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Participant</th>
                <th scope="col">Score</th>
                <th scope="col">Result</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((s) => (
                <tr key={s.participant_id}>
                  <td data-label="Participant">
                    <span className="id">{s.participant_id}</span>
                  </td>
                  <td data-label="Score">
                    {s.score} of {assessment.total_marks}
                  </td>
                  <td data-label="Result">
                    <StatusBadge status={s.result} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
