/** Listing acquisition pipeline — enums mirrored from Prisma. */

export type ListingAcquisitionSourceType = "OWNER" | "BROKER" | "HOST" | "MANUAL";

export type ListingAcquisitionPermissionStatus = "UNKNOWN" | "REQUESTED" | "GRANTED" | "REJECTED";

export type ListingAcquisitionIntakeStatus =
  | "NEW"
  | "CONTACTED"
  | "INTERESTED"
  | "AWAITING_ASSETS"
  | "READY_FOR_REVIEW"
  | "PUBLISHED"
  | "ARCHIVED";
