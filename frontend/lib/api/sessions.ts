import type { CreateSessionInput, Session } from "@/types/training";
import { call, callOrNull } from "./client";
import { PATTERNS } from "./patterns";

/** Creates a session and assigns its facilitator and topic. */
export function createSession(input: CreateSessionInput): Promise<Session> {
  return call<Session>(PATTERNS.createSession, input);
}

/** Every session, newest first. */
export function listSessions(): Promise<Session[]> {
  return call<Session[]>(PATTERNS.listSessions);
}

/** One session; null when there is no such session. */
export function getSession(sessionId: string): Promise<Session | null> {
  return callOrNull<Session>(PATTERNS.getSession, { session_id: sessionId });
}
