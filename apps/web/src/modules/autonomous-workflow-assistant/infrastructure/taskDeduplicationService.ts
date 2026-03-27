export const DEFAULT_TASK_COOLDOWN_MS = 120_000;

/** Stable key for duplicate detection + cooldown (same document). */
export function computeTaskFingerprint(taskType: string, blockedBy?: string[]): string {
  const b = (blockedBy ?? [])
    .slice()
    .map((s) => String(s).trim())
    .filter(Boolean)
    .sort()
    .join("||");
  return `${taskType}::${b}`;
}

export function pendingTaskHasFingerprint(
  pendingTasks: Array<{ payload?: unknown }>,
  fingerprint: string,
): boolean {
  return pendingTasks.some((t) => (t.payload as { fingerprint?: string } | undefined)?.fingerprint === fingerprint);
}

/**
 * Skip creating a new row if an identical fingerprint is already pending, or the same fingerprint
 * was created recently (cooldown) — reduces noise on rapid re-validation.
 */
export function shouldSkipDuplicateTaskCreation(args: {
  fingerprint: string;
  pendingFingerprints: Set<string>;
  /** Most recent task (any status) with this fingerprint, if any */
  lastCreatedAtForFingerprint: Date | null;
  nowMs: number;
  cooldownMs?: number;
}): boolean {
  if (args.pendingFingerprints.has(args.fingerprint)) return true;
  const cooldown = args.cooldownMs ?? DEFAULT_TASK_COOLDOWN_MS;
  if (args.lastCreatedAtForFingerprint) {
    if (args.nowMs - args.lastCreatedAtForFingerprint.getTime() < cooldown) return true;
  }
  return false;
}
