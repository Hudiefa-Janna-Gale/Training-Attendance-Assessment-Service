/**
 * "Open by id": a plain GET form that puts the ids in the URL (?session=SES-001), so the
 * page (a Server Component) re-renders for them and the view can be bookmarked or shared.
 * The service has no list endpoints, so a record is found by its id.
 */
export default function LookupForm({
  fields,
  submitLabel,
}: {
  fields: { name: string; label: string; placeholder: string; defaultValue: string }[];
  submitLabel: string;
}) {
  return (
    <form method="get" className="lookup">
      {fields.map((f) => (
        <label className="field" key={f.name}>
          <span>{f.label}</span>
          <input
            className="input"
            name={f.name}
            required
            defaultValue={f.defaultValue}
            placeholder={f.placeholder}
            pattern="[A-Za-z0-9_\-]{1,64}"
          />
        </label>
      ))}
      <button type="submit" className="btn btn-primary">
        {submitLabel}
      </button>
    </form>
  );
}
