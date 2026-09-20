import Link from "next/link";
import LookupForm from "@/components/training/LookupForm";
import PageHeader from "@/components/training/PageHeader";
import SessionForm from "@/components/training/SessionForm";
import { getSession } from "@/lib/api/sessions";
import { formatDate } from "@/lib/format";
import { firstParam } from "@/lib/params";

export default async function SessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string | string[] }>;
}) {
  const sessionId = firstParam((await searchParams).session);
  const session = sessionId ? await getSession(sessionId) : null;

  return (
    <div className="content">
      <PageHeader
        title="Training sessions"
        subtitle="Create a session and assign its facilitator and topic."
      />

      <div className="card page-card">
        <div className="card-head">
          <h2>Create a session</h2>
        </div>
        <SessionForm />
      </div>

      <div className="card page-card">
        <div className="card-head">
          <h2>Find a session</h2>
        </div>
        <LookupForm
          fields={[{ name: "session", label: "Session ID", placeholder: "SES-001", defaultValue: sessionId }]}
          submitLabel="Find session"
        />

        {sessionId && !session && (
          <p className="not-found" role="status">
            There is no session <strong>{sessionId}</strong>.
          </p>
        )}

        {session && (
          <div className="detail">
            <div className="card-head">
              <h2>{session.session_id}</h2>
              <Link
                className="btn btn-ghost"
                href={`/training/attendance?session=${encodeURIComponent(session.session_id)}`}
              >
                Attendance →
              </Link>
            </div>
            <dl className="facts">
              <div><dt>Workshop</dt><dd>{session.workshop_id}</dd></div>
              <div><dt>Day</dt><dd>Day {session.day}</dd></div>
              <div><dt>Date</dt><dd>{formatDate(session.date)}</dd></div>
              <div><dt>Time</dt><dd>{session.time_slot}</dd></div>
              <div><dt>Facilitator</dt><dd>{session.facilitator_id}</dd></div>
              <div><dt>Topic</dt><dd>{session.topic_id}</dd></div>
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}
