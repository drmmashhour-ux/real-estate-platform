/**
 * BNHub availability service — calendar slots, block/open dates, special prices.
 */

import type { BNHubAvailability } from "../models/index.js";

export interface BNHubAvailabilityService {
  getForListing(listingId: string, start: Date, end: Date): Promise<BNHubAvailability[]>;
  setSlot(listingId: string, date: Date, isAvailable: boolean, priceOverrideCents?: number): Promise<BNHubAvailability>;
  bulkSet(listingId: string, slots: { date: Date; isAvailable: boolean; priceOverrideCents?: number }[]): Promise<void>;
}

export const bnhubAvailabilityServiceStub: BNHubAvailabilityService = {
  async getForListing() {
    return [];
  },
  async setSlot() {
    throw new Error("BNHub availability service not implemented");
  },
  async bulkSet() {},
};
