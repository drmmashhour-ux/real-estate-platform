import type {
  LecipmDisputeCase,
  LecipmDisputeCaseEntityType,
  PlatformRole,
} from "@prisma/client";

import { prisma } from "@/lib/db";

export async function userCanAccessRelatedEntity(input: {
  userId: string;
  role: PlatformRole;
  relatedEntityType: LecipmDisputeCaseEntityType;
  relatedEntityId: string;
}): Promise<boolean> {
  if (input.role === "ADMIN") return true;

  try {
    switch (input.relatedEntityType) {
      case "BOOKING": {
        const b = await prisma.booking.findUnique({
          where: { id: input.relatedEntityId },
          select: {
            guestId: true,
            listing: { select: { ownerId: true } },
          },
        });
        if (!b) return false;
        return b.guestId === input.userId || b.listing.ownerId === input.userId;
      }
      case "DEAL": {
        const d = await prisma.deal.findUnique({
          where: { id: input.relatedEntityId },
          select: { buyerId: true, sellerId: true, brokerId: true },
        });
        if (!d) return false;
        return (
          d.buyerId === input.userId ||
          d.sellerId === input.userId ||
          (d.brokerId !== null && d.brokerId === input.userId)
        );
      }
      case "LISTING": {
        const l = await prisma.fsboListing.findUnique({
          where: { id: input.relatedEntityId },
          select: { ownerId: true },
        });
        return l?.ownerId === input.userId;
      }
      case "PAYMENT": {
        const p = await prisma.platformPayment.findUnique({
          where: { id: input.relatedEntityId },
          select: { userId: true },
        });
        return p?.userId === input.userId;
      }
      default:
        return false;
    }
  } catch {
    return false;
  }
}

export async function inferAgainstUserId(input: {
  relatedEntityType: LecipmDisputeCaseEntityType;
  relatedEntityId: string;
  openedByUserId: string;
}): Promise<string | null> {
  try {
    if (input.relatedEntityType === "BOOKING") {
      const b = await prisma.booking.findUnique({
        where: { id: input.relatedEntityId },
        select: {
          guestId: true,
          listing: { select: { ownerId: true } },
        },
      });
      if (!b) return null;
      if (b.guestId === input.openedByUserId) return b.listing.ownerId;
      if (b.listing.ownerId === input.openedByUserId) return b.guestId;
    }
    if (input.relatedEntityType === "DEAL") {
      const d = await prisma.deal.findUnique({
        where: { id: input.relatedEntityId },
        select: { buyerId: true, sellerId: true, brokerId: true },
      });
      if (!d) return null;
      if (d.buyerId === input.openedByUserId) return d.sellerId;
      if (d.sellerId === input.openedByUserId) return d.buyerId;
      if (d.brokerId === input.openedByUserId) return d.buyerId;
    }
    if (input.relatedEntityType === "LISTING") {
      const l = await prisma.fsboListing.findUnique({
        where: { id: input.relatedEntityId },
        select: { ownerId: true },
      });
      if (!l || l.ownerId !== input.openedByUserId) return null;
    }
  } catch {
    return null;
  }
  return null;
}

export function userCanViewCase(
  userId: string,
  role: PlatformRole,
  caseRow: Pick<LecipmDisputeCase, "openedByUserId" | "againstUserId">
): boolean {
  if (role === "ADMIN") return true;
  if (caseRow.openedByUserId === userId) return true;
  if (caseRow.againstUserId === userId) return true;
  return false;
}
