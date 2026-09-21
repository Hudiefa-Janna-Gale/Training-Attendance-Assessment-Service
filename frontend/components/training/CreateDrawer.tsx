"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CloseIcon, PlusIcon } from "./Icons";

/**
 * A button that opens its form in a drawer beside the page, so the list stays in view and
 * nobody has to scroll past a tall form to reach it. The form is mounted only while the
 * drawer is open, so it always opens fresh. Escape and a click on the dimmed page close it.
 */
export default function CreateDrawer({
  label,
  title,
  description,
  children,
}: {
  label: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // The form was mounted inside a closed dialog, where autoFocus cannot work, and showModal()
      // would otherwise land on the close button: start on the first field instead.
      dialog.querySelector<HTMLElement>(".drawer-body input, .drawer-body select")?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <>
      <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
        <PlusIcon />
        {label}
      </button>

      <dialog
        ref={dialogRef}
        className="drawer"
        aria-labelledby={titleId}
        onClose={() => setOpen(false)}
        onClick={(event) => {
          // A click on the dimmed page (the dialog's backdrop) targets the dialog itself.
          if (event.target === event.currentTarget) setOpen(false);
        }}
      >
        <div className="drawer-head">
          <div>
            <h2 className="drawer-title" id={titleId}>
              {title}
            </h2>
            <p className="drawer-sub">{description}</p>
          </div>
          <button type="button" className="icon-btn" aria-label="Close" onClick={() => setOpen(false)}>
            <CloseIcon />
          </button>
        </div>
        <div className="drawer-body">{open && children}</div>
      </dialog>
    </>
  );
}
