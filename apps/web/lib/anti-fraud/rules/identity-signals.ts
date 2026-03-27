/**
 * Identity-related fraud signals: owner mismatch, new account many listings, unverified identity.
 */

import { prisma } from "@/lib/db";
import type { FraudReason } from "../models";

export async function checkOwnerNameMismatch(
  listingId: string,
  documentOwnerName: string | null,
  hostUserId: string
): Promise<FraudReason | null> {
  if (!documentOwnerName?.trim()) return null;
  const user = await prisma.user.findUnique({
    where: { id: hostUserId },
    select: { name: true },
  });
  const hostName = (user?.name ?? "").trim().toLowerCase();
  const docName = documentOwnerName.trim().toLowerCase();
  if (!hostName) return null;
  if (docName.includes(hostName) || hostName.includes(docName)) return null;
  const hostParts = hostName.split(/\s+/).filter((p) => p.length > 1);
  if (hostParts.length >= 2 && hostParts.every((p) => docName.includes(p))) return null;
  return { signal: "owner_name_mismatch", points: 30 };
}

export async function checkMultipleListingsNewAccount(
  ownerId: string,
  listingCreatedAt: Date,
  thresholdListings: number = 5,
  accountAgeDays: number = 30
): Promise<FraudReason | null> {
  const user = await prisma.user.findUnique({
    where: { id: ownerId },
    select: { createdAt: true },
  });
  if (!user) return null;
  const accountAge = (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24);
  if (accountAge > accountAgeDays) return null;
  const count = await prisma.shortTermListing.count({
    where: { ownerId, listingVerificationStatus: { not: "REJECTED" } },
  });
  if (count < thresholdListings) return null;
  return {
    signal: "multiple_listings_new_account",
    points: 15,
    detail: `${count} listings, account ${Math.floor(accountAge)} days old`,
  };
}

export async function checkUnverifiedIdentity(ownerId: string): Promise<FraudReason | null> {
  const idVer = await prisma.identityVerification.findUnique({
    where: { userId: ownerId },
    select: { verificationStatus: true },
  });
  if (idVer?.verificationStatus === "VERIFIED") return null;
  const listing = await prisma.shortTermListing.findFirst({
    where: { ownerId },
    select: { listingAuthorityType: true },
  });
  if (listing?.listingAuthorityType === "BROKER") return null;
  return { signal: "unverified_identity", points: 20 };
}
