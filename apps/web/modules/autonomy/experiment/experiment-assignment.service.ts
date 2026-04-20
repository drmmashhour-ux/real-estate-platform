/**
 * Deterministic treatment assignment from entity id + traffic split (no RNG; reproducible).
 * Optional `salt` (e.g. experiment id) varies assignment across experiments with the same entity ids.
 */
export function assignToGroup(
  entityId: string,
  trafficSplit: number,
  salt = "",
): "control" | "treatment" {
  const clampedSplit = Math.min(1, Math.max(0, trafficSplit));
  const key = `${salt}:${entityId}`;
  const hash = Array.from(key).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const ratio = (hash % 100) / 100;
  return ratio < clampedSplit ? "treatment" : "control";
}
