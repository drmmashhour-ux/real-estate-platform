/** Map 0–100 opportunity scores to coarse priority for internal queues. */
export function priorityBandFromScore(score: number): "p0" | "p1" | "p2" | "p3" {
  if (score >= 80) return "p0";
  if (score >= 65) return "p1";
  if (score >= 50) return "p2";
  return "p3";
}
