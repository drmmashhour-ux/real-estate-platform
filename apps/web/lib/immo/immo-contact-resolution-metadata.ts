/**
 * Stored under `ImmoContactLog.metadata.immoResolution` — admin workflow without a migration.
 * Helps ops see what needs a response before disputes escalate.
 */

export type ImmoContactResolutionMeta = {
  /** Platform expects follow-up (e.g. broker should call back). */
  actionRequired: boolean;
  /** Recorded when staff confirms the loop is closed. */
  actionCompleted: boolean;
  /** ISO UTC when marked complete. */
  actionCompletedAt?: string;
  /** Optional link to platform dispute / BNHUB case. */
  disputeId?: string | null;
  /** Guest/host used AI compose before sending. */
  aiAssistUsed?: boolean;
  /** Short internal label for triage. */
  triageNote?: string;
};

const DEFAULT_NEW_LEAD: ImmoContactResolutionMeta = {
  actionRequired: true,
  actionCompleted: false,
};

export function defaultImmoResolutionForNewLead(): ImmoContactResolutionMeta {
  return { ...DEFAULT_NEW_LEAD };
}

export function getImmoResolutionFromMetadata(metadata: unknown): ImmoContactResolutionMeta | null {
  if (!metadata || typeof metadata !== "object") return null;
  const m = metadata as Record<string, unknown>;
  const r = m.immoResolution;
  if (!r || typeof r !== "object") return null;
  const o = r as Record<string, unknown>;
  return {
    actionRequired: o.actionRequired === true,
    actionCompleted: o.actionCompleted === true,
    actionCompletedAt: typeof o.actionCompletedAt === "string" ? o.actionCompletedAt : undefined,
    disputeId: typeof o.disputeId === "string" ? o.disputeId : o.disputeId === null ? null : undefined,
    aiAssistUsed: o.aiAssistUsed === true ? true : undefined,
    triageNote: typeof o.triageNote === "string" ? o.triageNote : undefined,
  };
}

export function mergeImmoResolution(
  metadata: Record<string, unknown> | null | undefined,
  patch: Partial<ImmoContactResolutionMeta> & { markCompleted?: boolean }
): Record<string, unknown> {
  const base = metadata && typeof metadata === "object" ? { ...(metadata as object) } : {};
  const prev = getImmoResolutionFromMetadata(base) ?? { ...DEFAULT_NEW_LEAD };
  const { markCompleted, ...rest } = patch;
  const next: ImmoContactResolutionMeta = {
    ...prev,
    ...rest,
  };
  if (markCompleted === true || (rest.actionCompleted === true && !prev.actionCompleted)) {
    next.actionCompleted = true;
    next.actionCompletedAt = new Date().toISOString();
  }
  if (rest.actionCompleted === false) {
    next.actionCompleted = false;
    next.actionCompletedAt = undefined;
  }
  if (rest.disputeId === null) {
    next.disputeId = null;
  }
  return { ...base, immoResolution: next };
}
