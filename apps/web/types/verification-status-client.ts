/** Listing / identity verification — mirrors Prisma `VerificationStatus` without `@prisma/client`. */

export const VerificationStatus = {
  PENDING: "PENDING",
  VERIFIED: "VERIFIED",
  REJECTED: "REJECTED",
} as const;

export type VerificationStatus = (typeof VerificationStatus)[keyof typeof VerificationStatus];
