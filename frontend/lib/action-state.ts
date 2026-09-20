import { ApiError } from "./api/client";

/** What a Server Action hands back to the form that called it (via useActionState). */
export type ActionState =
  | { status: "idle" }
  | {
      status: "success";
      message: string;
      /** Where to go next, e.g. from a created session to its attendance sheet. */
      link?: { href: string; label: string };
    }
  | {
      status: "error";
      message: string;
      /** Further problems the service reported. */
      details?: string[];
      /** What the user typed, so a failed submit does not wipe the form. */
      values?: Record<string, string>;
    };

export const idle: ActionState = { status: "idle" };

export function success(message: string, link?: { href: string; label: string }): ActionState {
  return { status: "success", message, link };
}

export function failure(
  error: unknown,
  values?: Record<string, string>,
): Extract<ActionState, { status: "error" }> {
  if (error instanceof ApiError) {
    const [message, ...details] = error.messages;
    return { status: "error", message: message ?? error.message, details, values };
  }
  return { status: "error", message: "Something went wrong. Please try again.", values };
}
