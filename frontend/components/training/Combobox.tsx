"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { Option } from "@/lib/catalog";
import { comboView, type ComboRow } from "@/lib/combo";
import { PlusIcon } from "./Icons";

/**
 * A dropdown of values this service already knows, each with a short description, that also lets you
 * make up a new one: type it and "Create …" appears in the list. Click the field or press the down
 * arrow to see the list; type to narrow it; Enter or a click picks one. Leave out `noun` for a field
 * that only takes the values listed: it narrows the list but never offers to create.
 */
export default function Combobox({
  name,
  label,
  hint,
  options,
  emptyHint = "Nothing to pick from yet.",
  defaultValue,
  placeholder,
  pattern,
  patternHint,
  noun,
  suggest,
  required,
  focusOn,
}: {
  name: string;
  label: string;
  hint?: string;
  options: Option[];
  /** Shown when there is nothing to pick from yet. */
  emptyHint?: string;
  defaultValue?: string;
  placeholder?: string;
  pattern?: string;
  /** The pattern in words: shown in the list, and instead of the browser's generic message. */
  patternHint?: string;
  /** What a new value is called, e.g. "workshop". Makes the field offer to create what you type. */
  noun?: string;
  /** Makes a valid value out of what was typed ("day 5" → "5"). Defaults to tidying up an id. */
  suggest?: (typed: string) => string;
  required?: boolean;
  /** Put the cursor back in the field whenever this changes to something truthy (e.g. after a save). */
  focusOn?: unknown;
}) {
  const id = useId();
  const listId = `${id}-list`;
  const ownRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [openUp, setOpenUp] = useState(false);
  const [query, setQuery] = useState<string | null>(null); // null = show every option
  const [active, setActive] = useState(-1);

  const { rows, note } = comboView({ options, query, noun, pattern, patternHint, suggest });
  // When the only thing on offer is what is being typed, Enter takes it instead of submitting the form.
  const current = active >= 0 ? active : rows.length === 1 && rows[0].isNew ? 0 : -1;

  useEffect(() => {
    if (focusOn) ownRef.current?.focus();
  }, [focusOn]);

  function show(everything: boolean) {
    const el = ownRef.current;
    if (el) setOpenUp(window.innerHeight - el.getBoundingClientRect().bottom < 290);
    if (everything) setQuery(null);
    setActive(-1);
    setOpen(true);
  }

  function choose(row: ComboRow) {
    const el = ownRef.current;
    if (el) {
      el.value = row.value;
      el.setCustomValidity("");
      el.focus();
    }
    setQuery(null);
    setOpen(false);
  }

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="combo">
        <input
          ref={ownRef}
          id={id}
          className="input combo-input"
          name={name}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && current >= 0 ? `${id}-opt-${current}` : undefined}
          autoComplete="off"
          spellCheck={false}
          required={required}
          pattern={pattern}
          defaultValue={defaultValue}
          placeholder={placeholder}
          onClick={() => (open ? undefined : show(true))}
          onInput={(event) => {
            event.currentTarget.setCustomValidity("");
            setQuery(event.currentTarget.value);
            show(false);
          }}
          onInvalid={(event) => {
            // Say what the rule is, instead of the browser's "Please match the requested format".
            const el = event.currentTarget;
            if (patternHint && el.validity.patternMismatch) el.setCustomValidity(patternHint);
          }}
          onBlur={() => setOpen(false)}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              if (!open) show(true);
              else setActive((i) => Math.min(i + 1, rows.length - 1));
            } else if (event.key === "ArrowUp" && open) {
              event.preventDefault();
              setActive((i) => Math.max(i - 1, 0));
            } else if (event.key === "Enter" && open && rows[current]) {
              event.preventDefault(); // pick the highlighted row instead of submitting the form
              choose(rows[current]);
            } else if (event.key === "Escape" && open) {
              event.preventDefault(); // close the list, not the drawer around it
              event.stopPropagation();
              setOpen(false);
            }
          }}
        />
        <button
          type="button"
          className="combo-toggle"
          tabIndex={-1}
          aria-label={open ? "Hide the list" : "Show the list"}
          onMouseDown={(event) => {
            event.preventDefault(); // keep the focus in the input
            if (open) setOpen(false);
            else {
              ownRef.current?.focus();
              show(true);
            }
          }}
        >
          <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
            <path d="M5 8l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {open && (
          <ul id={listId} role="listbox" aria-label={label} className={`combo-list${openUp ? " up" : ""}`}>
            {rows.map((row, index) => (
              <li
                key={row.isNew ? `new:${row.value}` : row.value}
                id={`${id}-opt-${index}`}
                role="option"
                aria-selected={index === current}
                className={`combo-option${row.isNew ? " combo-new" : ""}`}
                onMouseDown={(event) => {
                  event.preventDefault(); // pick before the input loses focus
                  choose(row);
                }}
                onMouseEnter={() => setActive(index)}
              >
                {row.isNew && <PlusIcon />}
                <span className="combo-text">
                  <strong>{row.isNew ? `Create “${row.value}”` : row.value}</strong>
                  {row.description && <small>{row.description}</small>}
                </span>
              </li>
            ))}
            {rows.length === 0 && !note && (
              <li className="combo-empty" role="presentation">
                {emptyHint}
              </li>
            )}
            {note && (
              <li className="combo-note" role="presentation">
                {note}
              </li>
            )}
          </ul>
        )}
      </div>
      {hint && <small>{hint}</small>}
    </div>
  );
}
