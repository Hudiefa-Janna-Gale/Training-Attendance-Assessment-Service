"use client";

export default function TrainingError({ retry }: { error: Error; retry: () => void }) {
  return (
    <>
      <header className="page-bar">
        <h1 className="page-title">Something went wrong</h1>
      </header>
      <div className="page-body">
        <section className="sheet error-box">
          <p>
            The page could not get its data from the Training service. Check that the service and RabbitMQ are
            running, then try again.
          </p>
          <button type="button" className="btn btn-primary" onClick={() => retry()}>
            Try again
          </button>
        </section>
      </div>
    </>
  );
}
