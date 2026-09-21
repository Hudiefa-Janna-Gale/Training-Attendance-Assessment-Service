"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import type { ActionState } from "@/lib/action-state";

/** Submit button that disables itself and shows a spinner while the action runs. */
export function SubmitButton({
  children,
  pendingLabel = "Saving…",
  className = "btn btn-primary",
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={className}
      disabled={pending}
      aria-disabled={pending}
      data-pending={pending}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}

/** A labelled form field; the label wraps the control so clicking it focuses the input. */
export function Field({
  label,
  hint,
  className = "",
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`field ${className}`.trim()}>
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}

/**
 * Result of the last submit: green when it worked, red (with details) when it did not.
 * It scrolls itself into view, so feedback is never left below the fold.
 */
export function FormAlert({ state }: { state: ActionState }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.status === "idle") return;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    ref.current?.scrollIntoView({ block: "nearest", behavior: calm ? "auto" : "smooth" });
  }, [state]);

  if (state.status === "idle") return null;

  if (state.status === "success") {
    return (
      <div ref={ref} className="alert alert-success" role="status">
        {state.message}
        {state.link && (
          <>
            {" "}
            <Link className="text-link" href={state.link.href}>
              {state.link.label}
            </Link>
          </>
        )}
      </div>
    );
  }

  return (
    <div ref={ref} className="alert alert-error" role="alert">
      {state.message}
      {state.details && state.details.length > 0 && (
        <ul>
          {state.details.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
