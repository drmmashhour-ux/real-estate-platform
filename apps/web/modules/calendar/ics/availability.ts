/** Standard interval overlap (half-open stays use the same predicate as `[a0,a1)` vs `[b0,b1)` when end is exclusive). */
export function rangesOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd;
}
