/**
 * Unified contract creation – auto-create Contract records for listing publish, booking, etc.
 */

import { prisma } from "@/lib/db";
import { CONTRACT_TYPES } from "./contract-types";
import type { Prisma } from "@prisma/client";

function safeInputJson(value: Record<string, unknown> | undefined, fallback: Prisma.InputJsonValue): Prisma.InputJsonValue {
  const v = value ?? fallback;
  try {
    return JSON.parse(JSON.stringify(v)) as Prisma.InputJsonValue;
  } catch {
    return fallback;
  }
}

/** Create a listing_contract when a listing is published (owner is the party). */
export async function createListingContract(params: {
  listingId: string;
  userId: string;
  hub: string;
  content?: Record<string, unknown>;
}): Promise<string> {
  const fallback: Prisma.InputJsonValue = {
    listingId: params.listingId,
    createdAt: new Date().toISOString(),
  };
  const contract = await prisma.contract.create({
    data: {
      type: CONTRACT_TYPES.LISTING_CONTRACT,
      userId: params.userId,
      listingId: params.listingId,
      hub: params.hub,
      content: safeInputJson(params.content, fallback),
      status: "signed",
      signedAt: new Date(),
    },
  });
  return contract.id;
}

/** Create a booking_contract when a booking is created (guest is the party). */
export async function createBookingContract(params: {
  bookingId: string;
  userId: string;
  listingId: string;
  hub?: string;
  content?: Record<string, unknown>;
}): Promise<string> {
  const fallback: Prisma.InputJsonValue = {
    bookingId: params.bookingId,
    listingId: params.listingId,
    createdAt: new Date().toISOString(),
  };
  const contract = await prisma.contract.create({
    data: {
      type: CONTRACT_TYPES.BOOKING_CONTRACT,
      userId: params.userId,
      listingId: params.listingId,
      bookingId: params.bookingId,
      hub: params.hub ?? "bnhub",
      content: safeInputJson(params.content, fallback),
      status: "signed",
      signedAt: new Date(),
    },
  });
  return contract.id;
}
