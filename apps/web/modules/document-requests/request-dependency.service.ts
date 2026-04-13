/**
 * Expected requests by deal stage — advisory for autopilot (not automatic fulfilment).
 */

export type DealStageHint = "initiated" | "offer_submitted" | "accepted" | "inspection" | "financing" | "closing_scheduled" | "closed" | "cancelled";

export function expectedCategoriesForStage(stage: string): string[] {
  const s = stage as DealStageHint;
  switch (s) {
    case "initiated":
    case "offer_submitted":
      return ["SELLER_DOCUMENTS", "BUYER_DOCUMENTS"];
    case "accepted":
    case "inspection":
      return ["SELLER_DOCUMENTS", "INSPECTION_DOCUMENTS", "IDENTITY_COMPLIANCE"];
    case "financing":
      return ["LENDER_DOCUMENTS", "BUYER_DOCUMENTS", "IDENTITY_COMPLIANCE"];
    case "closing_scheduled":
      return ["NOTARY_PREPARATION", "CLOSING_SUPPORT", "LENDER_DOCUMENTS", "SYNDICATE_DOCUMENTS"];
    case "closed":
    case "cancelled":
      return [];
    default:
      return ["OTHER"];
  }
}

export function condoContextHints(propertyIsCondo?: boolean): string[] {
  if (!propertyIsCondo) return [];
  return ["SYNDICATE_DOCUMENTS"];
}
