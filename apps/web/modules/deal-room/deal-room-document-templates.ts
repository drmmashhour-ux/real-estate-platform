/**
 * Operational checklist starters — not legal packs.
 */

import type { DealRoomEntityType } from "./deal-room.types";
import type { DealRoomDocumentCategory } from "./deal-room-document-workflow.types";

export type DocumentChecklistTemplateId = "buyer_lead" | "broker_listing" | "property_review";

export type TemplateRow = {
  title: string;
  category: DealRoomDocumentCategory;
  required: boolean;
};

export const DOCUMENT_CHECKLIST_TEMPLATES: Record<DocumentChecklistTemplateId, TemplateRow[]> = {
  buyer_lead: [
    { title: "Identity reference (internal)", category: "identity", required: true },
    { title: "Buyer intent / timeline note", category: "support", required: false },
    { title: "Preferred areas / budget summary", category: "support", required: false },
    { title: "Supporting correspondence note", category: "support", required: false },
  ],
  broker_listing: [
    { title: "Listing summary / MLS ref", category: "property", required: true },
    { title: "Broker disclosure / card on file", category: "broker", required: true },
    { title: "Property proof / factsheet", category: "property", required: false },
    { title: "Marketing collateral link", category: "support", required: false },
  ],
  property_review: [
    { title: "Property checklist / highlights", category: "property", required: true },
    { title: "Comparable snapshot or note", category: "support", required: false },
    { title: "Risk / caveat note", category: "support", required: false },
    { title: "Follow-up actions note", category: "support", required: false },
  ],
};

export function templateAllowedForRoom(entityType: DealRoomEntityType, templateId: DocumentChecklistTemplateId): boolean {
  switch (templateId) {
    case "buyer_lead":
      return entityType === "lead";
    case "broker_listing":
      return entityType === "listing";
    case "property_review":
      return entityType === "property" || entityType === "listing";
    default:
      return false;
  }
}
