import LookupForm from "@/components/training/LookupForm";
import PageHeader from "@/components/training/PageHeader";
import StatusBadge from "@/components/training/StatusBadge";
import { getParticipantResult } from "@/lib/api/results";
import { firstParam } from "@/lib/params";

/** The brief's rule: attend at least this many of the workshop's 3 days. */
const REQUIRED_DAYS = 2;

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ participant?: string | string[]; workshop?: string | string[] }>;
}) {
  const params = await searchParams;
  const participantId = firstParam(params.participant);
  const workshopId = firstParam(params.workshop);
  const result = participantId && workshopId ? await getParticipantResult(participantId, workshopId) : null;

  return (
    <div className="content">
      <PageHeader
        title="Final results"
        subtitle="The final PASS / FAIL result of a participant in a workshop."
      />

      <div className="card page-card">
        <LookupForm
          fields={[
            { name: "participant", label: "Participant ID", placeholder: "P-001", defaultValue: participantId },
            { name: "workshop", label: "Workshop ID", placeholder: "WS-2025-001", defaultValue: workshopId },
          ]}
          submitLabel="Get result"
        />

        {!(participantId && workshopId) && (
          <p className="sub spaced-top">Enter a participant and a workshop to see the final result.</p>
        )}

        {participantId && workshopId && !result && (
          <p className="not-found" role="status">
            This service has no sessions or assessments for workshop <strong>{workshopId}</strong>.
          </p>
        )}

        {result && (
          <div className="detail">
            <div className="card-head">
              <h2>
                {result.participant_id} · {result.workshop_id}
              </h2>
              <span className={`verdict ${result.result === "PASS" ? "pass" : "fail"}`}>
                <StatusBadge status={result.result} />
              </span>
            </div>
            <dl className="facts">
              <div>
                <dt>Days attended</dt>
                <dd className={result.days_attended >= REQUIRED_DAYS ? "ok" : "short"}>
                  {result.days_attended} of 3
                </dd>
              </div>
              <div>
                <dt>Final assessment score</dt>
                <dd>{result.final_score === null ? "Not scored" : result.final_score}</dd>
              </div>
            </dl>
            <p className="footer-note">
              A participant passes with attendance on at least {REQUIRED_DAYS} of the 3 days and a final
              assessment score at or above the pass mark (60 out of 100 by default). Otherwise the result is
              FAIL.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
