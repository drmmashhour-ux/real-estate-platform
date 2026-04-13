/**
 * Recommendation-specific diversity — builds on ranking diversity + widget de-duplication.
 */

import { diversifyByAreaAndType, diversifyByHost } from "@/lib/ranking/diversity";

export { diversifyByAreaAndType, diversifyByHost };

export function excludeIds<T extends { id: string }>(rows: T[], exclude: Set<string>): T[] {
  return rows.filter((r) => !exclude.has(r.id));
}

/** Drop rows whose id already seen in this session/widget (prevents duplicate cards). */
export function dedupeAgainstSeen<T extends { id: string }>(rows: T[], seen: Set<string>): T[] {
  const out: T[] = [];
  for (const r of rows) {
    if (seen.has(r.id)) continue;
    seen.add(r.id);
    out.push(r);
  }
  return out;
}
