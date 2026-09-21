"use client";

import { useState } from "react";
import { parseParticipantIds } from "@/lib/roster";

/**
 * Participants come from another service, so they are added by typing their id
 * (one, or several separated by commas, spaces or new lines). Calls `onAdd` with
 * the valid ids that are not already on the sheet.
 */
export default function AddParticipant({
  onAdd,
  exists,
}: {
  onAdd: (participantIds: string[]) => void;
  exists: (participantId: string) => boolean;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function add() {
    const { ids, invalid } = parseParticipantIds(value);
    if (ids.length === 0 && invalid.length === 0) return;
    if (invalid.length > 0) {
      return setError(
        `${invalid.join(", ")}: use letters, digits, “-” or “_” (max 64), like P-007.`,
      );
    }
    const fresh = ids.filter((id) => !exists(id));
    if (fresh.length === 0) return setError(`${ids.join(", ")} already on the list.`);
    setError(null);
    setValue("");
    onAdd(fresh);
  }

  return (
    <div>
      <div className="add-row">
        <input
          className="input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            // Enter adds the participant(s) instead of submitting the whole sheet.
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Add participants: P-007 or P-007, P-008"
          aria-label="Participant ID or IDs to add"
          aria-invalid={error !== null}
        />
        <button type="button" className="btn btn-quiet" onClick={add}>
          Add to list
        </button>
      </div>
      {error && (
        <p className="add-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
