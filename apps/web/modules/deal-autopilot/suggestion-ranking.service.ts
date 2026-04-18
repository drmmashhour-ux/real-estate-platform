import type { NextBestAction } from "./deal-autopilot.types";
import { priorityScore } from "./reminder-priority.service";

export function rankNextBestActions(actions: NextBestAction[]): NextBestAction[] {
  return [...actions].sort((a, b) => {
    const pa = priorityScore(a.urgency);
    const pb = priorityScore(b.urgency);
    if (pb !== pa) return pb - pa;
    return a.rank - b.rank;
  });
}
