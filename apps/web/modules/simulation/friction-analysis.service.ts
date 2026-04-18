/**
 * Aggregates and ranks friction for reporting (calls friction-detector + dedupes).
 */
import type { FrictionPoint } from "@/modules/simulation/user-simulation.types";
import { detectFrictionFromSteps } from "@/modules/simulation/friction-detector.service";

export { detectFrictionFromSteps };

export function mergeFrictionPoints(points: FrictionPoint[][]): FrictionPoint[] {
  const map = new Map<string, FrictionPoint>();
  for (const batch of points) {
    for (const p of batch) {
      const key = `${p.category}:${p.description.slice(0, 64)}`;
      const existing = map.get(key);
      if (!existing || severityRank(p.severity) > severityRank(existing.severity)) {
        map.set(key, p);
      }
    }
  }
  return [...map.values()];
}

function severityRank(s: FrictionPoint["severity"]): number {
  return s === "high" ? 3 : s === "medium" ? 2 : 1;
}

export function summarizeFrictionByCategory(points: FrictionPoint[]): Record<string, number> {
  const acc: Record<string, number> = {};
  for (const p of points) {
    acc[p.category] = (acc[p.category] ?? 0) + 1;
  }
  return acc;
}
