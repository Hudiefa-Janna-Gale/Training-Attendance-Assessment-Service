import Link from "next/link";
import { Suspense } from "react";
import AttendanceSheet from "@/components/training/AttendanceSheet";
import NavSelect from "@/components/training/NavSelect";
import Page from "@/components/training/Page";
import { SheetSkeleton } from "@/components/training/Skeletons";
import { listAssessments } from "@/lib/api/assessments";
import { getAttendance } from "@/lib/api/attendance";
import { getSession, listSessions } from "@/lib/api/sessions";
import { sessionGroups } from "@/lib/catalog";
import { loadWorkshopParticipants } from "@/lib/directory";
import { formatDate } from "@/lib/format";
import { firstParam } from "@/lib/params";
import { buildAttendanceRows } from "@/lib/roster";

/** The title bar is static; the session picker and the roll call are fetched per request. */
export default function AttendancePage({ searchParams }: { searchParams: Promise<{ session?: string | string[] }> }) {
  return (
    <Page title="Attendance" subtitle="Mark who came to each session.">
      <Suspense fallback={<SheetSkeleton />}>
        <AttendanceData searchParams={searchParams} />
      </Suspense>
    </Page>
  );
}

async function AttendanceData({ searchParams }: { searchParams: Promise<{ session?: string | string[] }> }) {
  const sessionId = firstParam((await searchParams).session);
  const [sessions, assessments] = await Promise.all([listSessions(), listAssessments()]);
  const [session, attendance] = sessionId
    ? await Promise.all([getSession(sessionId), getAttendance(sessionId)])
    : [null, null];

  // Everyone the workshop has seen on its other days starts on the sheet, so nobody retypes ids.
  const known = session ? await loadWorkshopParticipants(session.workshop_id, sessions, assessments) : [];

  return (
    <section className="sheet">
      <div className="sheet-body">
        {sessions.length === 0 ? (
          <p className="muted">
            There are no sessions yet. Create one on the{" "}
            <Link className="text-link" href="/training/sessions">
              Sessions page
            </Link>
            , then take its attendance here.
          </p>
        ) : (
          <NavSelect
            param="session"
            label="Session"
            value={sessionId}
            placeholder="Choose a session"
            clear={["rq", "status"]}
            groups={sessionGroups(sessions).map((g) => ({
              label: `Workshop ${g.workshop}`,
              options: g.sessions,
            }))}
          />
        )}
      </div>

      {sessionId && (!session || !attendance) && (
        <p className="notice" role="status">
          There is no session <strong>{sessionId}</strong>.
        </p>
      )}

      {session && attendance && (
        <>
          <div className="sheet-body divided">
            <dl className="facts">
              <div>
                <dt>Workshop</dt>
                <dd>{session.workshop_id}</dd>
              </div>
              <div>
                <dt>Day</dt>
                <dd>Day {session.day}</dd>
              </div>
              <div>
                <dt>Date</dt>
                <dd>{formatDate(session.date)}</dd>
              </div>
              <div>
                <dt>Time</dt>
                <dd>{session.time_slot}</dd>
              </div>
              <div>
                <dt>Facilitator</dt>
                <dd>{session.facilitator_id}</dd>
              </div>
              <div>
                <dt>Topic</dt>
                <dd>{session.topic_id}</dd>
              </div>
            </dl>
          </div>
          <div className="divided">
            <AttendanceSheet
              key={session.session_id}
              session={session}
              roster={buildAttendanceRows(attendance.records, known)}
            />
          </div>
        </>
      )}
    </section>
  );
}
