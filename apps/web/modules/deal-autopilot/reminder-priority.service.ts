import type { UrgencyLevel } from "./deal-autopilot.types";

export function priorityScore(urgency: UrgencyLevel): number {
  const map: Record<UrgencyLevel, number> = { low: 1, medium: 2, high: 3, critical: 4 };
  return map[urgency] ?? 1;
}
