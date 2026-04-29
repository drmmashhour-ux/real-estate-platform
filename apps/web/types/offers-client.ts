/** BNHub / CRM offer lifecycle — mirrors Prisma enums without `@prisma/client`. */
export type OfferStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "COUNTERED"
  | "ACCEPTED"
  | "REJECTED"
  | "WITHDRAWN"
  | "EXPIRED";

export type OfferEventType =
  | "CREATED"
  | "SUBMITTED"
  | "STATUS_CHANGED"
  | "COUNTERED"
  | "ACCEPTED"
  | "REJECTED"
  | "WITHDRAWN"
  | "NOTE_ADDED";

export type OfferEventRow = {
  id: string;
  type: OfferEventType | string;
  message: string | null;
  createdAt: Date | string;
  metadata: unknown;
};
