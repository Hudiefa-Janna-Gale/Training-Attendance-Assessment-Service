import type { CreateSessionInput, Session } from "@/types/training";
import { apiFetch, apiFetchOrNull } from "./client";

/** POST /sessions — creates a session and assigns its facilitator and topic. */
export function createSession(input: CreateSessionInput): Promise<Session> {
  return apiFetch<Session>("/sessions", { method: "POST", body: input });
}

/** GET /sessions/:id — null when there is no such session. */
export function getSession(sessionId: string): Promise<Session | null> {
  return apiFetchOrNull<Session>(`/sessions/${encodeURIComponent(sessionId)}`);
}
