/**
 * Feedback persistence adapter — in-process buffer for v1 until a DB model exists.
 */
import type { GovernanceFeedbackInput, GovernanceFeedbackResult } from "./governance-feedback.types";

export interface PersistGovernanceFeedbackRecordParams {
  input: GovernanceFeedbackInput;
  result: GovernanceFeedbackResult;
  trainingRow?: Record<string, unknown>;
}

/** In-memory store (same Node process); no DB in v1. Bounded to limit memory growth. */
const MEMORY: PersistGovernanceFeedbackRecordParams[] = [];
const MAX_RECORDS = 5000;

export async function persistGovernanceFeedbackRecord(
  params: PersistGovernanceFeedbackRecordParams,
): Promise<{ ok: true }> {
  try {
    MEMORY.push(params);
    while (MEMORY.length > MAX_RECORDS) {
      MEMORY.shift();
    }
    return { ok: true };
  } catch {
    return { ok: true };
  }
}

export function listGovernanceFeedbackRecords(): readonly PersistGovernanceFeedbackRecordParams[] {
  try {
    return [...MEMORY];
  } catch {
    return [];
  }
}

/** Most recent entries only — MEMORY appends in order; returns the last `limit` records (copy). */
export function listGovernanceFeedbackRecordsLastN(limit: number): readonly PersistGovernanceFeedbackRecordParams[] {
  try {
    const cap =
      Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), MAX_RECORDS) : 500;
    if (MEMORY.length === 0) return [];
    const start = Math.max(0, MEMORY.length - cap);
    return MEMORY.slice(start);
  } catch {
    return [];
  }
}

export function clearGovernanceFeedbackMemoryForTests(): void {
  MEMORY.length = 0;
}
