import AssessmentForm from "@/components/training/AssessmentForm";
import LookupForm from "@/components/training/LookupForm";
import PageHeader from "@/components/training/PageHeader";
import ScoreForm from "@/components/training/ScoreForm";
import StatusBadge from "@/components/training/StatusBadge";
import { getScores } from "@/lib/api/assessments";
import { firstParam } from "@/lib/params";

export default async function AssessmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ assessment?: string | string[] }>;
}) {
  const assessmentId = firstParam((await searchParams).assessment);
  const assessment = assessmentId ? await getScores(assessmentId) : null;

  return (
    <div className="content">
      <PageHeader
        title="Assessments"
        subtitle="Create assessments, manage participant scores, and track results."
      />

      <div className="card page-card">
        <div className="card-head">
          <h2>Create an assessment</h2>
        </div>
        <AssessmentForm />
      </div>

      <div className="card page-card">
        <div className="card-head">
          <h2>Scores</h2>
        </div>
        <LookupForm
          fields={[
            { name: "assessment", label: "Assessment ID", placeholder: "ASS-001", defaultValue: assessmentId },
          ]}
          submitLabel="Open assessment"
        />

        {!assessmentId && (
          <p className="sub spaced-top">Enter an assessment ID to see and submit its scores.</p>
        )}

        {assessmentId && !assessment && (
          <p className="not-found" role="status">
            There is no assessment <strong>{assessmentId}</strong>.
          </p>
        )}

        {assessment && (
          <div className="detail">
            <div className="card-head">
              <h2>{assessment.title}</h2>
              <StatusBadge status={assessment.type} label={assessment.type === "FINAL" ? "Final" : "Quiz"} />
            </div>
            <p className="sub spaced">
              {assessment.assessment_id} · {assessment.workshop_id} · Day {assessment.day} · Pass mark:{" "}
              {assessment.pass_mark} / {assessment.total_marks}
            </p>

            {assessment.scores.length === 0 ? (
              <p className="sub">No scores yet.</p>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th scope="col">Participant ID</th>
                      <th scope="col">Score</th>
                      <th scope="col">Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assessment.scores.map((s) => (
                      <tr key={s.participant_id}>
                        <td>
                          <strong>{s.participant_id}</strong>
                        </td>
                        <td>
                          {s.score} / {assessment.total_marks}
                        </td>
                        <td>
                          <StatusBadge status={s.result} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <h3 className="subhead">Submit a score</h3>
            <ScoreForm
              key={assessment.assessment_id}
              assessmentId={assessment.assessment_id}
              totalMarks={assessment.total_marks}
            />
          </div>
        )}
      </div>
    </div>
  );
}
