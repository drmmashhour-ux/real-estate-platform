import type { SyriaAppUser } from "@/generated/prisma";

export type Sy8ReputationTier = "new" | "trusted" | "distinguished";

/**
 * Public listing = active for reputation (published + in good standing for browse).
 * Archived = "sold" / closed (proxy for مباع in marketplace).
 */
export function computeSy8SellerScore(soldListings: number, activeListings: number): number {
  return soldListings * 2 + activeListings;
}

export function sy8ReputationLabelId(score: number): Sy8ReputationTier {
  if (score <= 2) return "new";
  if (score <= 10) return "trusted";
  return "distinguished";
}

type OwnerPick =
  Pick<SyriaAppUser, "phoneVerifiedAt" | "verifiedAt" | "verificationLevel"> &
    Partial<Pick<SyriaAppUser, "phoneVerified">>;

/** True when phone verified (SYBNB-96 flag or legacy timestamp), admin verification, etc. */
export function isSy8SellerVerified(owner: OwnerPick | null | undefined): boolean {
  if (!owner) return false;
  if (owner.phoneVerified === true) return true;
  if (owner.phoneVerifiedAt != null) return true;
  if (owner.verifiedAt != null) return true;
  const lvl = owner.verificationLevel?.trim();
  return Boolean(lvl && lvl.length > 0);
}
