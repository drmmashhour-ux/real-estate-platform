/**
 * BNHub booking service — reservations, check availability, create/cancel.
 */

import type { BNHubBooking } from "../models/index.js";

export interface BNHubBookingService {
  checkAvailability(listingId: string, checkIn: Date, checkOut: Date): Promise<boolean>;
  create(data: {
    listingId: string;
    guestId: string;
    checkIn: string;
    checkOut: string;
    guests: number;
  }): Promise<BNHubBooking>;
  getById(id: string): Promise<BNHubBooking | null>;
  cancel(id: string, actorId: string): Promise<BNHubBooking>;
}

export const bnhubBookingServiceStub: BNHubBookingService = {
  async checkAvailability() {
    return true;
  },
  async create() {
    throw new Error("BNHub booking service not implemented");
  },
  async getById() {
    return null;
  },
  async cancel() {
    throw new Error("BNHub booking service not implemented");
  },
};
