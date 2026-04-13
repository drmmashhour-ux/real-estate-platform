/** True if [aStart,aEnd) overlaps (bStart,bEnd) — half-open intervals on instants. */
export function rangesOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && aEnd > bStart;
}
