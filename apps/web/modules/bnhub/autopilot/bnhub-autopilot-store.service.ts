/**
 * In-process registry for BNHub autopilot actions (same lifetime pattern as growth ai-autopilot approvals).
 */

import type { BNHubAutopilotAction } from "./bnhub-autopilot.types";

const actionsById = new Map<string, BNHubAutopilotAction>();
const idsByListingId = new Map<string, string[]>();

export function putBnhubAutopilotAction(action: BNHubAutopilotAction): void {
  actionsById.set(action.id, action);
  const list = idsByListingId.get(action.listingId) ?? [];
  if (!list.includes(action.id)) {
    list.push(action.id);
    idsByListingId.set(action.listingId, list);
  }
}

export function getBnhubAutopilotAction(actionId: string): BNHubAutopilotAction | undefined {
  return actionsById.get(actionId);
}

export function listBnhubAutopilotActionsForListing(listingId: string): BNHubAutopilotAction[] {
  const ids = idsByListingId.get(listingId) ?? [];
  return ids.map((id) => actionsById.get(id)).filter((a): a is BNHubAutopilotAction => a != null);
}

export function updateBnhubAutopilotAction(
  actionId: string,
  patch: Partial<Pick<BNHubAutopilotAction, "status">>,
): BNHubAutopilotAction | undefined {
  const cur = actionsById.get(actionId);
  if (!cur) return undefined;
  const next = { ...cur, ...patch };
  actionsById.set(actionId, next);
  return next;
}

/** Removes pending actions for a listing before regenerating suggestions. */
export function clearPendingBnhubAutopilotActionsForListing(listingId: string): void {
  const ids = idsByListingId.get(listingId) ?? [];
  const kept: string[] = [];
  for (const id of ids) {
    const a = actionsById.get(id);
    if (a?.status === "pending") {
      actionsById.delete(id);
    } else if (a) {
      kept.push(id);
    }
  }
  idsByListingId.set(listingId, kept);
}

export function resetBnhubAutopilotStoreForTests(): void {
  actionsById.clear();
  idsByListingId.clear();
}
