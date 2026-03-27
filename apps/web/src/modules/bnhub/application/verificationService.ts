import { VerificationStatus } from "@prisma/client";
import { updateListingVerification, verifyUserIdentity } from "@/src/modules/bnhub/infrastructure/bnhubRepository";

export async function verifyListingOwnership(args: { listingId: string; approved: boolean }) {
  const status = args.approved ? VerificationStatus.VERIFIED : VerificationStatus.REJECTED;
  return updateListingVerification(args.listingId, status);
}

export async function verifyUserIdentityForBnhub(userId: string) {
  return verifyUserIdentity(userId);
}

