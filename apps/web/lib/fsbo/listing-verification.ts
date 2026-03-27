import type { FsboListingVerification } from "@prisma/client";

export function allSellerVerificationVerified(v: FsboListingVerification | null | undefined): boolean {
  if (!v) return false;
  return [
    v.identityStatus,
    v.cadasterStatus,
    v.addressStatus,
    v.sellerDeclarationStatus,
    v.disclosuresStatus,
  ].every((s) => s === "VERIFIED");
}

export type SellerListingLifecycleUx = "draft" | "pending_verification" | "active" | "rejected";

export function fsboListingLifecycleUx(
  status: string,
  moderationStatus: string,
  verification: FsboListingVerification | null | undefined
): SellerListingLifecycleUx {
  const s = status.toUpperCase();
  const m = moderationStatus.toUpperCase();
  if (m === "REJECTED") return "rejected";
  if (s === "PENDING_VERIFICATION") return "pending_verification";
  if (s === "DRAFT") return "draft";
  if (!allSellerVerificationVerified(verification)) return "pending_verification";
  if (m === "PENDING") return "pending_verification";
  if (s === "ACTIVE" && m === "APPROVED") return "active";
  if (s === "ACTIVE") return "pending_verification";
  return "pending_verification";
}
