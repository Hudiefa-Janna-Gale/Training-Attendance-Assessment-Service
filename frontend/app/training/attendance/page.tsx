import AttendanceSheet from "@/components/training/AttendanceSheet";
import LookupForm from "@/components/training/LookupForm";
import PageHeader from "@/components/training/PageHeader";
import { getAttendance } from "@/lib/api/attendance";
import { getSession } from "@/lib/api/sessions";
import { formatDate } from "@/lib/format";
import { firstParam } from "@/lib/params";
import { buildAttendanceRows } from "@/lib/roster";

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string | string[] }>;
}) {
  const sessionId = firstParam((await searchParams).session);
  const [session, attendance] = sessionId
    ? await Promise.all([getSession(sessionId), getAttendance(sessionId)])
    : [null, null];

  return (
    <div className="content">
      <PageHeader
        title="Attendance"
        subtitle="Record and review participant attendance for a session."
      />

      <div className="card page-card">
        <LookupForm
          fields={[{ name: "session", label: "Session ID", placeholder: "SES-001", defaultValue: sessionId }]}
          submitLabel="Open session"
        />

        {!sessionId && (
          <p className="sub spaced-top">
            Enter a session ID to record or review its attendance. Sessions are created on the Sessions page.
          </p>
        )}

        {sessionId && (!session || !attendance) && (
          <p className="not-found" role="status">
            There is no session <strong>{sessionId}</strong>.
          </p>
        )}

        {session && attendance && (
          <div className="detail">
            <div className="card-head">
              <h2>
                {session.session_id} · {session.workshop_id} · Day {session.day}
              </h2>
            </div>
            <p className="sub spaced">
              {formatDate(session.date)} · {session.time_slot} · Facilitator {session.facilitator_id} · Topic{" "}
              {session.topic_id}
            </p>
            <AttendanceSheet
              key={session.session_id}
              sessionId={session.session_id}
              roster={buildAttendanceRows(attendance.records)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
