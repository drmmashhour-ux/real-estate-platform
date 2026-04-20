/**
 * Deterministic treatment assignment from entity id + traffic split (no RNG; reproducible).
 * Same inputs always yield the same group — audit-friendly.
 */
export function assignToGroup(entityId: string, trafficSplit: number): "control" | "treatment" {
  const clampedSplit = Math.min(1, Math.max(0, trafficSplit));
  const hash = Array.from(entityId).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const ratio = (hash % 100) / 100;
  return ratio < clampedSplit ? "treatment" : "control";
}
