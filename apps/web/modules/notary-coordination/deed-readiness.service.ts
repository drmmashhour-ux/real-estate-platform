import type { NotaryPackageItem } from "./notary-coordination.types";

export function deedReadinessScore(items: NotaryPackageItem[]): number {
  if (!items.length) return 0;
  const done = items.filter((i) => i.done).length;
  return Math.round((done / items.length) * 100);
}
