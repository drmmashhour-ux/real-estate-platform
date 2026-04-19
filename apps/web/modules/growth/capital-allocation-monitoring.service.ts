/**
 * Lightweight counters / logs for internal review — never throws.
 */

import type { CapitalAllocationPlan } from "@/modules/growth/capital-allocation.types";

const PREFIX = "[capital-allocation]";

export async function recordCapitalAllocationPlan(plan: CapitalAllocationPlan): Promise<void> {
  try {
    let lowConfidence = 0;
    let hold = 0;
    const bucketCounts: Record<string, number> = {};
    for (const r of plan.recommendations) {
      if (r.confidence === "low") lowConfidence += 1;
      if (r.bucket.id === "hold") hold += 1;
      bucketCounts[r.bucket.id] = (bucketCounts[r.bucket.id] ?? 0) + 1;
    }
    const topBucket = Object.entries(bucketCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "none";

    // eslint-disable-next-line no-console -- internal growth ops observability
    console.info(
      `${PREFIX} plans=1 recommendations=${plan.recommendations.length} lowConfidence=${lowConfidence} hold=${hold} topBucket=${topBucket}`,
    );
  } catch {
    /* swallow */
  }
}
