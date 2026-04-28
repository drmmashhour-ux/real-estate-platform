/**
 * SYBNB-25 — Keep boosted density fair on browse (featured / premium plans).
 * Applies on first-page stay browse only; settlement stays manual elsewhere.
 */

export function getSybnbFeaturedMaxPerPage(): number {
  const raw = process.env.SYBNB_FEATURED_MAX_PER_PAGE ?? process.env.NEXT_PUBLIC_SYBNB_FEATURED_MAX_PER_PAGE ?? "5";
  const n = Number(raw);
  if (!Number.isFinite(n)) return 5;
  return Math.min(20, Math.max(3, Math.floor(n)));
}

function isBoostedPlan(plan: string): boolean {
  return plan === "featured" || plan === "premium";
}

/** Preserve sort order; cap boosted rows, then back-fill from the tail so the page stays full. */
export function capBoostedFirstPage<T extends { id: string; plan: string }>(
  ordered: T[],
  pageSize: number,
  maxBoosted: number,
): T[] {
  const out: T[] = [];
  const picked = new Set<string>();
  let boostedUsed = 0;

  for (const row of ordered) {
    if (out.length >= pageSize) break;
    const boost = isBoostedPlan(row.plan);
    if (boost && boostedUsed >= maxBoosted) continue;
    if (boost) boostedUsed++;
    out.push(row);
    picked.add(row.id);
  }

  if (out.length < pageSize) {
    for (const row of ordered) {
      if (out.length >= pageSize) break;
      if (picked.has(row.id)) continue;
      out.push(row);
      picked.add(row.id);
    }
  }

  return out;
}
