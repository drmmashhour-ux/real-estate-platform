import { randomUUID } from "node:crypto";

export function getOrCreateCorrelationId(headers: Record<string, string | string[] | undefined>): string {
  const incoming = headers["x-correlation-id"];
  if (Array.isArray(incoming)) return incoming[0] ?? randomUUID();
  return incoming?.trim() || randomUUID();
}
