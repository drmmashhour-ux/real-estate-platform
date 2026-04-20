import type { AutomationEvent } from "./automation.types";

/**
 * Routes events to handlers. Expand with registered handlers per trigger id.
 * Always safe — exceptions swallowed by caller (`dispatchAutomationEvent`).
 */
export async function routeAutomationEvent(event: AutomationEvent): Promise<boolean> {
  switch (event.type) {
    case "low_completion_listing":
      /** Future: enqueue listing quality job */
      return true;
    case "conversion_drop":
      /** Future: enqueue admin digest refresh */
      return true;
    default:
      return false;
  }
}
