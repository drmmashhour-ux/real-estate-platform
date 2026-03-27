import { prisma } from "@/lib/db";
import type { Contract, ContractSignature } from "@prisma/client";

export type ContractWithRelations = Contract & {
  signatures: ContractSignature[];
  booking: {
    id: string;
    guestId: string;
    listingId: string;
    status: string;
    listing: { ownerId: string };
  } | null;
};

/**
 * Load contract with booking/listing for access checks.
 */
export async function getContractForAccess(contractId: string): Promise<ContractWithRelations | null> {
  const row = await prisma.contract.findUnique({
    where: { id: contractId },
    include: {
      signatures: true,
      booking: {
        include: {
          listing: { select: { ownerId: true } },
        },
      },
    },
  });
  return row as ContractWithRelations | null;
}

/**
 * Returns true if user may view/sign this contract (participant, creator, or admin).
 */
/** Resolve host/owner user id for this contract (for access when no booking row). */
export async function resolveListingOwnerId(c: ContractWithRelations): Promise<string | null> {
  if (c.booking) return c.booking.listing.ownerId;
  if (c.fsboListingId) {
    const fsbo = await prisma.fsboListing.findUnique({
      where: { id: c.fsboListingId },
      select: { ownerId: true },
    });
    return fsbo?.ownerId ?? null;
  }
  if (!c.listingId) return null;
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: c.listingId },
    select: { ownerId: true },
  });
  return listing?.ownerId ?? null;
}

/** Access check — pass listingOwnerId from resolveListingOwnerId when booking is null. */
export function canAccessContract(
  userId: string | null,
  userRole: string | null,
  c: ContractWithRelations,
  listingOwnerId?: string | null
): boolean {
  if (!userId) return false;
  if (userRole === "ADMIN") return true;
  if (c.createdById === userId) return true;
  if (c.userId === userId) return true;
  if (c.signatures.some((s) => s.userId === userId)) return true;
  if (c.booking) {
    if (c.booking.guestId === userId) return true;
    if (c.booking.listing.ownerId === userId) return true;
  }
  if (c.listingId && listingOwnerId && listingOwnerId === userId) return true;
  return false;
}

/**
 * Which signature row applies to this user (first unsigned match wins).
 */
export function resolveSignerSignature(
  c: ContractWithRelations,
  userId: string,
  userEmail: string | null | undefined
): ContractSignature | null {
  const emailLower = userEmail?.trim().toLowerCase() ?? "";
  const pending = c.signatures.filter((s) => !s.signedAt);
  const byUser = pending.find((s) => s.userId === userId);
  if (byUser) return byUser;
  if (emailLower) {
    const byEmail = pending.find((s) => s.email.trim().toLowerCase() === emailLower);
    if (byEmail) return byEmail;
  }
  return null;
}
