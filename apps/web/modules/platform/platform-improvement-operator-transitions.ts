/**
 * Pure transition rules — linear execution bridge (no skipping phases).
 * Safe to import from client components.
 */

import type { PlatformPriorityStatus } from "./platform-improvement.types";

/** Main path: new → acknowledged → planned → in_progress → done. Dismiss early; reopen from terminal. */
export function allowedNextStatuses(from: PlatformPriorityStatus): PlatformPriorityStatus[] {
  switch (from) {
    case "new":
      return ["acknowledged", "dismissed"];
    case "acknowledged":
      return ["planned", "dismissed"];
    case "planned":
      return ["in_progress", "dismissed"];
    case "in_progress":
      return ["done", "dismissed"];
    case "done":
      return ["acknowledged"];
    case "dismissed":
      return ["acknowledged"];
    default:
      return [];
  }
}

export function isTransitionAllowed(from: PlatformPriorityStatus, to: PlatformPriorityStatus): boolean {
  return allowedNextStatuses(from).includes(to);
}

/** Maps UI actions to statuses for the POST handler (same canonical statuses). */
export type PlatformImprovementQuickAction =
  | "acknowledge"
  | "plan"
  | "start"
  | "done"
  | "dismiss"
  | "reopen";

export function nextStatusForQuickAction(
  current: PlatformPriorityStatus,
  action: PlatformImprovementQuickAction,
): PlatformPriorityStatus | null {
  switch (action) {
    case "acknowledge":
      return current === "new" ? "acknowledged" : null;
    case "plan":
      return current === "acknowledged" ? "planned" : null;
    case "start":
      return current === "planned" ? "in_progress" : null;
    case "done":
      return current === "in_progress" ? "done" : null;
    case "dismiss":
      return current === "new" ||
        current === "acknowledged" ||
        current === "planned" ||
        current === "in_progress"
        ? "dismissed"
        : null;
    case "reopen":
      return current === "done" || current === "dismissed" ? "acknowledged" : null;
    default:
      return null;
  }
}
