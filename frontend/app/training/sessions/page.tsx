import { Suspense } from "react";
import CreateDrawer from "@/components/training/CreateDrawer";
import Page from "@/components/training/Page";
import SessionForm from "@/components/training/SessionForm";
import SessionsTable from "@/components/training/SessionsTable";
import { FormSkeleton, SheetSkeleton } from "@/components/training/Skeletons";
import { listAssessments } from "@/lib/api/assessments";
import { listSessions } from "@/lib/api/sessions";
import { dayOptions, facilitatorOptions, topicOptions, workshopOptions } from "@/lib/catalog";

/**
 * The title bar and the "New session" button are static (prerendered once). Only what comes from
 * the Training service is fetched per request: the form's pick-lists and the table of sessions.
 */
export default function SessionsPage() {
  return (
    <Page
      title="Training sessions"
      subtitle="Give each session a facilitator and a topic."
      actions={
        <CreateDrawer
          label="New session"
          title="New session"
          description="Assign a facilitator and a topic to one day of a workshop."
        >
          <Suspense fallback={<FormSkeleton />}>
            <NewSessionForm />
          </Suspense>
        </CreateDrawer>
      }
    >
      <Suspense fallback={<SheetSkeleton />}>
        <SessionList />
      </Suspense>
    </Page>
  );
}

async function NewSessionForm() {
  const [sessions, assessments] = await Promise.all([listSessions(), listAssessments()]);
  return (
    <SessionForm
      workshops={workshopOptions(sessions, assessments)}
      facilitators={facilitatorOptions(sessions)}
      topics={topicOptions(sessions)}
      days={dayOptions(sessions, assessments)}
    />
  );
}

async function SessionList() {
  return <SessionsTable sessions={await listSessions()} />;
}
