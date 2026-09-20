"use client";

export default function TrainingError({ retry }: { error: Error; retry: () => void }) {
  return (
    <div className="content">
      <div className="card empty">
        <h1 className="page-title">Something went wrong</h1>
        <p className="sub">The page could not load its data from the Training service.</p>
        <button type="button" className="btn btn-primary" onClick={() => retry()}>
          Try again
        </button>
      </div>
    </div>
  );
}
