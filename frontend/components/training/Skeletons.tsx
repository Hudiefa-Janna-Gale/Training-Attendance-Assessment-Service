/**
 * What the static page shows in the places where data is still on its way: the same frame as the
 * real thing, so nothing jumps when the data arrives.
 */
export function SheetSkeleton() {
  return (
    <section className="sheet" aria-busy="true" aria-label="Loading">
      <span className="skeleton short" />
      <span className="skeleton" />
      <span className="skeleton" />
      <span className="skeleton" />
      <span className="skeleton" />
    </section>
  );
}

export function FormSkeleton() {
  return (
    <div className="form-skeleton" aria-busy="true" aria-label="Loading">
      <span className="skeleton" />
      <span className="skeleton" />
      <span className="skeleton" />
      <span className="skeleton" />
      <span className="skeleton" />
    </div>
  );
}
