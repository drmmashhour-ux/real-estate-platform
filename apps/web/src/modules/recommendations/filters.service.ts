/** When trust is unknown (null), we still allow — moderation + status gate risk. */
const MIN_TRUST_WHEN_SET = 22;

export function passesFsboTrustFloor(row: { trustScore: number | null; moderationStatus: string; status: string }): boolean {
  if (row.status !== "ACTIVE") return false;
  if (row.moderationStatus !== "APPROVED") return false;
  const t = row.trustScore;
  if (t != null && Number.isFinite(t) && t < MIN_TRUST_WHEN_SET) return false;
  return true;
}

export function dedupeIds(seen: Set<string>, id: string): boolean {
  if (seen.has(id)) return false;
  seen.add(id);
  return true;
}
