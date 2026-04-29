/**
 * Mirror of Prisma `ListingStatus` — client bundles must not import `@prisma/client`.
 */
export type ListingStatusApi =
  | "DRAFT"
  | "PENDING_REVIEW"
  | "APPROVED"
  | "PUBLISHED"
  | "UNLISTED"
  | "SUSPENDED"
  | "UNDER_INVESTIGATION"
  | "FROZEN"
  | "REJECTED_FOR_FRAUD"
  | "PERMANENTLY_REMOVED";

/** Subset used by host grid filter tabs */
export const ListingStatusClient = {
  PUBLISHED: "PUBLISHED",
  DRAFT: "DRAFT",
  UNLISTED: "UNLISTED",
  PENDING_REVIEW: "PENDING_REVIEW",
} as const;

export type ListingHostFilterStatus = (typeof ListingStatusClient)[keyof typeof ListingStatusClient];

/** Runtime mirror of Prisma `ListingStatus` for server/module queries without `@prisma/client`. */
export const ListingStatus = {
  DRAFT: "DRAFT",
  PENDING_REVIEW: "PENDING_REVIEW",
  APPROVED: "APPROVED",
  PUBLISHED: "PUBLISHED",
  UNLISTED: "UNLISTED",
  SUSPENDED: "SUSPENDED",
  UNDER_INVESTIGATION: "UNDER_INVESTIGATION",
  FROZEN: "FROZEN",
  REJECTED_FOR_FRAUD: "REJECTED_FOR_FRAUD",
  PERMANENTLY_REMOVED: "PERMANENTLY_REMOVED",
} as const;
