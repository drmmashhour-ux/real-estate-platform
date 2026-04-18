/**
 * Aggregates drop-off points across journeys.
 */
import type { DropOffPoint } from "@/modules/simulation/user-simulation.types";
import { detectDropOffs } from "@/modules/simulation/dropoff-detector.service";

export { detectDropOffs };

export function mergeDropOffs(drops: DropOffPoint[][]): DropOffPoint[] {
  const seen = new Set<string>();
  const out: DropOffPoint[] = [];
  for (const batch of drops) {
    for (const d of batch) {
      const key = `${d.stepId}:${d.reason}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(d);
    }
  }
  return out;
}
