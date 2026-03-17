/**
 * BNHub listing service — CRUD for short-term rental listings.
 * Implement with Prisma or inject repository.
 */

import type { BNHubListing } from "../models/index.js";

export type CreateListingInput = Omit<BNHubListing, "id" | "createdAt" | "updatedAt">;
export type UpdateListingInput = Partial<CreateListingInput>;

export interface BNHubListingService {
  create(data: CreateListingInput): Promise<BNHubListing>;
  getById(id: string): Promise<BNHubListing | null>;
  update(id: string, data: UpdateListingInput): Promise<BNHubListing>;
  delete(id: string): Promise<void>;
  listByHost(hostId: string): Promise<BNHubListing[]>;
}

/** Stub implementation — replace with Prisma/database in app. */
export const bnhubListingServiceStub: BNHubListingService = {
  async create() {
    throw new Error("BNHub listing service not implemented — wire to database in app");
  },
  async getById() {
    return null;
  },
  async update() {
    throw new Error("BNHub listing service not implemented");
  },
  async delete() {},
  async listByHost() {
    return [];
  },
};
