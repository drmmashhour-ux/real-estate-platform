/**
 * Pluggable persistence — default in-memory for tests/scripts; swap for Prisma later.
 */

import type { CoownershipChecklistItem } from "./coownership-autopilot.types";

export interface CoownershipAutopilotStore {
  listChecklistKeys(listingId: string): Promise<string[]>;
  getChecklistItems(listingId: string): Promise<CoownershipChecklistItem[]>;
  upsertChecklistItem(listingId: string, item: CoownershipChecklistItem): Promise<void>;
  deleteChecklistItemsForListing(listingId: string): Promise<void>;
  getComplianceApplicable(listingId: string): Promise<boolean | undefined>;
  setComplianceApplicable(listingId: string, applicable: boolean): Promise<void>;
  /** True if a compliance decision was already recorded for this listing + cycle (any trigger). */
  hasDecisionForCycle(listingId: string, cycleKey: string): Promise<boolean>;
  recordDecision(listingId: string, cycleKey: string, trigger: string): Promise<void>;
}

/** In-memory store with uniqueness enforced per (listingId, item.key). */
export function createMemoryCoownershipStore(): CoownershipAutopilotStore {
  const checklist = new Map<string, Map<string, CoownershipChecklistItem>>();
  const decisions = new Set<string>();
  const applicable = new Map<string, boolean>();

  function ck(listingId: string): Map<string, CoownershipChecklistItem> {
    let m = checklist.get(listingId);
    if (!m) {
      m = new Map();
      checklist.set(listingId, m);
    }
    return m;
  }

  return {
    async listChecklistKeys(listingId: string): Promise<string[]> {
      return [...ck(listingId).keys()];
    },

    async getChecklistItems(listingId: string): Promise<CoownershipChecklistItem[]> {
      return [...ck(listingId).values()];
    },

    async upsertChecklistItem(listingId: string, item: CoownershipChecklistItem): Promise<void> {
      ck(listingId).set(item.key, { ...item });
    },

    async deleteChecklistItemsForListing(listingId: string): Promise<void> {
      checklist.delete(listingId);
    },

    async getComplianceApplicable(listingId: string): Promise<boolean | undefined> {
      return applicable.get(listingId);
    },

    async setComplianceApplicable(listingId: string, v: boolean): Promise<void> {
      applicable.set(listingId, v);
    },

    async hasDecisionForCycle(listingId: string, cycleKey: string): Promise<boolean> {
      return decisions.has(`${listingId}::${cycleKey}`);
    },

    async recordDecision(listingId: string, cycleKey: string, trigger: string): Promise<void> {
      decisions.add(`${listingId}::${cycleKey}`);
      void trigger;
    },
  };
}
