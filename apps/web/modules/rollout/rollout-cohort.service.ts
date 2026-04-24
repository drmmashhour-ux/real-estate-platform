import crypto from "crypto";

/**
 * Deterministic cohort bucket in [0, 99] from entity id + execution cohort salt.
 */
export function cohortBucket0To99(entityId: string, cohortKey: string): number {
  const h = crypto.createHash("sha256").update(`${cohortKey}:${entityId}`, "utf8").digest();
  return h.readUInt32BE(0) % 100;
}

/**
 * Stable treatment assignment: entity is in rollout iff bucket < rolloutPercent.
 * At 100% all entities are in rollout; at 0% none.
 */
export function isEntityInRollout(entityId: string, rolloutPercent: number, cohortKey: string): boolean {
  if (!entityId || rolloutPercent <= 0) return false;
  if (rolloutPercent >= 100) return true;
  return cohortBucket0To99(entityId, cohortKey) < rolloutPercent;
}
