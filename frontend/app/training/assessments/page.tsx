import { Suspense } from "react";
import AssessmentForm from "@/components/training/AssessmentForm";
import AssessmentsTable from "@/components/training/AssessmentsTable";
import CreateDrawer from "@/components/training/CreateDrawer";
import Page from "@/components/training/Page";
import ScoreForm from "@/components/training/ScoreForm";
import ScoresTable from "@/components/training/ScoresTable";
import { FormSkeleton, SheetSkeleton } from "@/components/training/Skeletons";
import StatusBadge from "@/components/training/StatusBadge";
import { getScores, listAssessments } from "@/lib/api/assessments";
import { listSessions } from "@/lib/api/sessions";
import { dayOptions, workshopOptions } from "@/lib/catalog";
import { loadWorkshopParticipants } from "@/lib/directory";
import { firstParam } from "@/lib/params";

/**
 * The title bar and the "New assessment" button are static (prerendered once). Only what comes from
 * the Training service is fetched per request: the form's pick-lists, the chosen assessment and the list.
 */
export default function AssessmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ assessment?: string | string[] }>;
}) {
  return (
    <Page
      title="Assessments"
      subtitle="Create assessments and record each participant’s score."
      actions={
        <CreateDrawer
          label="New assessment"
          title="New assessment"
          description="The final assessment on day 3, or a quiz on any day."
        >
          <Suspense fallback={<FormSkeleton />}>
            <NewAssessmentForm />
          </Suspense>
        </CreateDrawer>
      }
    >
      <Suspense fallback={<SheetSkeleton />}>
        <AssessmentsData searchParams={searchParams} />
      </Suspense>
    </Page>
  );
}

async function NewAssessmentForm() {
  const [sessions, assessments] = await Promise.all([listSessions(), listAssessments()]);
  return <AssessmentForm workshops={workshopOptions(sessions, assessments)} days={dayOptions(sessions, assessments)} />;
}

async function AssessmentsData({ searchParams }: { searchParams: Promise<{ assessment?: string | string[] }> }) {
  const assessmentId = firstParam((await searchParams).assessment);
  const [assessments, sessions, assessment] = await Promise.all([
    listAssessments(),
    listSessions(),
    assessmentId ? getScores(assessmentId) : null,
  ]);

  // Offer the workshop's participants who still have no score, so nobody retypes ids.
  const scored = new Set(assessment?.scores.map((s) => s.participant_id));
  const unscored = assessment
    ? (await loadWorkshopParticipants(assessment.workshop_id, sessions, assessments)).filter((p) => !scored.has(p))
    : [];

  return (
    <>
      {assessmentId && !assessment && (
        <section className="sheet">
          <p className="notice" role="status">
            There is no assessment <strong>{assessmentId}</strong>.
          </p>
        </section>
      )}

      {/* The one being worked on comes first, so opening it never means scrolling past the list. */}
      {assessment && (
        <section className="sheet">
          <div className="sheet-head">
            <h2 className="sheet-title">{assessment.title}</h2>
            <StatusBadge status={assessment.type} />
          </div>
          <div className="sheet-body">
            <dl className="facts">
              <div>
                <dt>Assessment</dt>
                <dd>{assessment.assessment_id}</dd>
              </div>
              <div>
                <dt>Workshop</dt>
                <dd>{assessment.workshop_id}</dd>
              </div>
              <div>
                <dt>Day</dt>
                <dd>Day {assessment.day}</dd>
              </div>
              <div>
                <dt>Pass mark</dt>
                <dd>
                  {assessment.pass_mark} of {assessment.total_marks}
                </dd>
              </div>
            </dl>
          </div>

          <ScoreForm
            key={assessment.assessment_id}
            assessmentId={assessment.assessment_id}
            totalMarks={assessment.total_marks}
            participants={unscored.map((value) => ({ value, description: "No score yet" }))}
          />

          <ScoresTable key={assessment.assessment_id} assessment={assessment} />
        </section>
      )}

      <AssessmentsTable assessments={assessments} selectedId={assessmentId} />
    </>
  );
}
