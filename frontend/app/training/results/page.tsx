import { Suspense } from "react";
import ExportButtons from "@/components/export/ExportButtons";
import NavSelect from "@/components/training/NavSelect";
import Page from "@/components/training/Page";
import { SheetSkeleton } from "@/components/training/Skeletons";
import { listAssessments } from "@/lib/api/assessments";
import { getParticipantResult } from "@/lib/api/results";
import { listSessions } from "@/lib/api/sessions";
import { workshopDays, workshopOptions } from "@/lib/catalog";
import { loadWorkshopParticipants } from "@/lib/directory";
import { resultSpec } from "@/lib/export/specs";
import { firstParam } from "@/lib/params";
import { attendanceRule, daysNeeded } from "@/lib/results";

/** One bar per day up to here; a longer workshop shows the count only. */
const MAX_BARS = 10;

type Search = Promise<{ participant?: string | string[]; workshop?: string | string[] }>;

/** The title bar is static; the pick-lists and the result are fetched per request. */
export default function ResultsPage({ searchParams }: { searchParams: Search }) {
  return (
    <Page title="Final results" subtitle="The PASS or FAIL of one participant in one workshop.">
      <Suspense fallback={<SheetSkeleton />}>
        <ResultsData searchParams={searchParams} />
      </Suspense>
    </Page>
  );
}

async function ResultsData({ searchParams }: { searchParams: Search }) {
  const params = await searchParams;
  const participantId = firstParam(params.participant);
  const workshopId = firstParam(params.workshop);

  const [sessions, assessments] = await Promise.all([listSessions(), listAssessments()]);
  const workshops = workshopOptions(sessions, assessments);
  const known = workshopId ? await loadWorkshopParticipants(workshopId, sessions, assessments) : [];
  const participants = participantId && !known.includes(participantId) ? [...known, participantId] : known;

  const asked = participantId !== "" && workshopId !== "";
  const result = asked ? await getParticipantResult(participantId, workshopId) : null;
  // How many days this workshop really has (the days it has a session on), and how many must be attended.
  const totalDays = workshopDays(sessions, workshopId);
  const needed = daysNeeded(totalDays);
  const attendedEnough = result ? result.days_attended >= needed : false;

  return (
    <section className="sheet">
      <div className="sheet-body">
        <div className="inline-form">
          <NavSelect
            param="workshop"
            label="Workshop"
            value={workshopId}
            placeholder={workshops.length === 0 ? "No workshops yet" : "Choose a workshop"}
            disabled={workshops.length === 0}
            clear={["participant"]}
            options={workshops.map((w) => ({
              value: w.value,
              label: w.description ? `${w.value} (${w.description})` : w.value,
            }))}
          />
          <NavSelect
            param="participant"
            label="Participant"
            value={participantId}
            placeholder={
              workshopId === ""
                ? "Choose a workshop first"
                : participants.length === 0
                  ? "Nobody recorded in this workshop yet"
                  : "Choose a participant"
            }
            disabled={workshopId === "" || participants.length === 0}
            options={participants.map((p) => ({ value: p, label: p }))}
          />
        </div>
      </div>

      {!asked && (
        <p className="empty">
          <strong>Pick a workshop and a participant</strong>
          Their final result appears here.
        </p>
      )}

      {asked && !result && (
        <p className="notice" role="status">
          This service has no sessions or assessments for workshop <strong>{workshopId}</strong>.
        </p>
      )}

      {result && (
        <>
          <div className="sheet-head divided">
            <h2 className="sheet-title">Final result</h2>
            <ExportButtons spec={resultSpec(result, totalDays, needed)} />
          </div>

          <div className="verdict">
            <div className="verdict-main">
              <p className="verdict-who">
                {result.participant_id} <span>in workshop</span> {result.workshop_id}
              </p>

              <dl className="ledger">
                <div>
                  <dt>Days attended</dt>
                  <dd>
                    {totalDays === 0 ? (
                      <span className="muted">This workshop has no sessions yet</span>
                    ) : (
                      <>
                        {totalDays <= MAX_BARS && (
                          <span
                            className={`days${attendedEnough ? "" : " short-of"}`}
                            role="img"
                            aria-label={`${result.days_attended} of ${totalDays} days`}
                          >
                            {Array.from({ length: totalDays }, (_, i) => (
                              <i key={i} className={i < result.days_attended ? "on" : undefined} />
                            ))}
                          </span>
                        )}
                        <span className={attendedEnough ? "ok" : "short"}>
                          {result.days_attended} of {totalDays}
                        </span>
                        <small className="muted">{needed} needed</small>
                      </>
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Final assessment</dt>
                  <dd>
                    {result.final_score === null ? (
                      <span className="muted">No score yet</span>
                    ) : (
                      <span>{result.final_score} points</span>
                    )}
                  </dd>
                </div>
              </dl>

              <p className="rule-note">
                To pass, a participant {attendanceRule(needed, totalDays)} and scores at or above the final
                assessment’s pass mark (60 out of 100 by default). Anything else is a fail, including no final
                score.
              </p>
            </div>

            <div
              className={`stamp ${result.result === "PASS" ? "pass" : "fail"}`}
              role="img"
              aria-label={`Result: ${result.result}`}
            >
              {result.result}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
