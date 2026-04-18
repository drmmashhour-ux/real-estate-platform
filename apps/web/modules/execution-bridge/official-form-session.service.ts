import { randomUUID } from "crypto";
import type { ExecutionReadinessStatus, OfficialFormSession } from "./execution-bridge.types";

/** In-process session registry — replace with durable store when connecting a real provider. */
const sessions = new Map<string, OfficialFormSession>();

export function createOfficialFormSession(input: {
  dealId: string;
  formKey: string;
  status?: ExecutionReadinessStatus;
}): OfficialFormSession {
  const session: OfficialFormSession = {
    sessionId: randomUUID(),
    dealId: input.dealId,
    formKey: input.formKey.toUpperCase(),
    createdAt: new Date().toISOString(),
    executionReadinessStatus: input.status ?? "draft_only",
  };
  sessions.set(session.sessionId, session);
  return session;
}

export function getOfficialFormSession(sessionId: string): OfficialFormSession | undefined {
  return sessions.get(sessionId);
}
