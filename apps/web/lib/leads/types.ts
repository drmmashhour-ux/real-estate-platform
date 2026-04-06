import type { ListingContactTargetKind } from "@prisma/client";

export type LeadAccessStatus = "locked" | "paid" | "expired";

export interface Lead {
  id: string;
  listingId: string;
  buyerId: string;
  status: LeadAccessStatus;
  priceCents: number;
  createdAt: Date;
  targetKind: ListingContactTargetKind;
}
