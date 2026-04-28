import { appWarn } from "@/lib/logging/app-log";

/** Standard API contract for optimistic-lock conflicts (UI + offline sync). */
export const LECIPM_CONFLICT_ERROR = "CONFLICT" as const;

export const LECIPM_CONFLICT_MESSAGE = "Data changed. Refresh required.";

/** HTTP status for stale version / conflict (recommended for API routes). */
export const LECIPM_CONFLICT_HTTP_STATUS = 409;

export type ConflictGuardInput = {
  /** When omitted, check is skipped (backwards-compatible requests). */
  clientVersion?: number | null;
  /** Current persisted version; defaults to `1` when null/undefined (legacy rows). */
  serverVersion?: number | null;
};

export class ConflictError extends Error {
  readonly code = LECIPM_CONFLICT_ERROR;
  constructor(message: string = LECIPM_CONFLICT_MESSAGE) {
    super(message);
    this.name = "ConflictError";
  }
}

/**
 * Throws {@link ConflictError} when the client-sent version does not match the server row.
 */
export function assertNoConflict(input: ConflictGuardInput): void {
  const { clientVersion, serverVersion } = input;
  if (clientVersion == null) return;
  const server = serverVersion ?? 1;
  if (clientVersion !== server) {
    throw new ConflictError();
  }
}

export function isConflictError(e: unknown): e is ConflictError {
  return e instanceof ConflictError;
}

/** Structured server log line for audit / monitoring (no PII). */
export function logLecipmConflict(meta: Record<string, string | number | boolean | undefined>): void {
  appWarn("LECIPM_CONFLICT", meta);
}
