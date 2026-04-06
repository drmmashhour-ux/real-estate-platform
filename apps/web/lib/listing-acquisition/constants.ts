import type { ListingAcquisitionIntakeStatus } from "@prisma/client";

/** Kanban column order for admin acquisition board */
export const ACQUISITION_PIPELINE_COLUMNS: ListingAcquisitionIntakeStatus[] = [
  "NEW",
  "CONTACTED",
  "INTERESTED",
  "AWAITING_ASSETS",
  "READY_FOR_REVIEW",
  "PUBLISHED",
  "ARCHIVED",
];

export const ACQUISITION_COLUMN_LABELS: Record<ListingAcquisitionIntakeStatus, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  INTERESTED: "Interested",
  AWAITING_ASSETS: "Awaiting assets",
  READY_FOR_REVIEW: "Ready for review",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
};

/** FSBO supply stage (alongside `FsboListing.status` / moderation). */
export const SUPPLY_PUBLICATION_STAGES = [
  "draft",
  "pending_review",
  "approved",
  "published",
  "rejected",
] as const;

export type SupplyPublicationStage = (typeof SUPPLY_PUBLICATION_STAGES)[number];
