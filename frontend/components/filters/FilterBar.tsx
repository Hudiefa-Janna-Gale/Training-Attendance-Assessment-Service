"use client";

import { useState } from "react";
import { ChevronIcon, FilterIcon, SearchIcon } from "@/components/training/Icons";
import type { FilterField } from "@/lib/filters";
import { plural } from "@/lib/format";

function Control({ field, value, onChange }: { field: FilterField; value: string; onChange: (value: string) => void }) {
  if (field.kind === "search") {
    return (
      <label className="field filter-search">
        <span>{field.label}</span>
        <span className="search">
          <SearchIcon />
          <input
            className="input"
            type="search"
            value={value}
            placeholder={field.placeholder}
            autoComplete="off"
            spellCheck={false}
            onChange={(event) => onChange(event.target.value)}
          />
        </span>
      </label>
    );
  }

  if (field.kind === "select") {
    return (
      <label className="field">
        <span>{field.label}</span>
        <select className="input" value={value} onChange={(event) => onChange(event.target.value)}>
          <option value="">{field.any ?? "Any"}</option>
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <label className="field">
      <span>{field.label}</span>
      <input
        className="input"
        type={field.kind === "date" ? "date" : "number"}
        inputMode={field.kind === "number" ? "numeric" : undefined}
        value={value}
        placeholder={field.placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

/**
 * The filters of one table, in plain words: the common ones in view, the rest under "More filters"
 * (which opens by itself when one of them is in use). Underneath: how many of the rows are shown,
 * a button to clear everything, and whatever `actions` the table adds (its download buttons).
 */
export default function FilterBar({
  fields,
  values,
  onChange,
  onClear,
  noun,
  shown,
  total,
  actions,
}: {
  fields: FilterField[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onClear: () => void;
  /** What the rows are, singular: "session". */
  noun: string;
  shown: number;
  total: number;
  actions?: React.ReactNode;
}) {
  const basic = fields.filter((field) => !field.advanced);
  const more = fields.filter((field) => field.advanced);
  const moreActive = more.filter((field) => values[field.key]).length;
  const active = fields.filter((field) => values[field.key]).length;
  const [open, setOpen] = useState(moreActive > 0);

  return (
    <div className="filters" role="search" aria-label={`Filter the ${noun} list`}>
      <div className="filters-grid">
        {basic.map((field) => (
          <Control key={field.key} field={field} value={values[field.key] ?? ""} onChange={(value) => onChange(field.key, value)} />
        ))}
      </div>

      {more.length > 0 && (
        <details className="filters-more" open={open} onToggle={(event) => setOpen(event.currentTarget.open)}>
          <summary>
            <FilterIcon />
            More filters
            {moreActive > 0 && <span className="badge">{moreActive}</span>}
            <ChevronIcon />
          </summary>
          <div className="filters-grid">
            {more.map((field) => (
              <Control key={field.key} field={field} value={values[field.key] ?? ""} onChange={(value) => onChange(field.key, value)} />
            ))}
          </div>
        </details>
      )}

      <div className="filters-foot">
        <p className="filters-summary" role="status" aria-live="polite">
          Showing <strong>{shown}</strong> of {plural(total, noun)}
        </p>
        <div className="filters-actions">
          {active > 0 && (
            <button type="button" className="btn btn-quiet btn-sm" onClick={onClear}>
              Clear filters
            </button>
          )}
          {actions}
        </div>
      </div>
    </div>
  );
}
