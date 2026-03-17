/**
 * Timeline stage order and default steps per stage.
 */

import type { TimelineStage } from "./types";
import type { StepDefinition } from "./types";

export const STAGE_ORDER: TimelineStage[] = [
  "listing_live",
  "offer_submitted",
  "negotiation",
  "offer_accepted",
  "deposit_pending",
  "deposit_received",
  "inspection_pending",
  "inspection_completed",
  "financing_pending",
  "financing_confirmed",
  "legal_documents_prepared",
  "notary_review",
  "closing_scheduled",
  "closing_completed",
  "cancelled",
];

export const DEFAULT_STEPS_BY_STAGE: Record<string, StepDefinition[]> = {
  listing_live: [{ stepCode: "listing_active", stepName: "Listing is live", stageName: "listing_live", defaultAssignedRole: "seller" }],
  offer_submitted: [
    { stepCode: "offer_submit", stepName: "Buyer submits offer", stageName: "offer_submitted", defaultAssignedRole: "buyer" },
    { stepCode: "offer_review", stepName: "Seller reviews offer", stageName: "offer_submitted", defaultAssignedRole: "seller" },
  ],
  negotiation: [
    { stepCode: "negotiation_counter", stepName: "Counter-offer or negotiation", stageName: "negotiation", defaultAssignedRole: "seller" },
    { stepCode: "negotiation_accept", stepName: "Offer accepted", stageName: "negotiation", defaultAssignedRole: "seller" },
  ],
  offer_accepted: [{ stepCode: "offer_accepted", stepName: "Offer accepted", stageName: "offer_accepted", defaultAssignedRole: "system" }],
  deposit_pending: [
    { stepCode: "deposit_request", stepName: "Deposit requested", stageName: "deposit_pending", defaultAssignedRole: "buyer" },
    { stepCode: "deposit_pay", stepName: "Buyer pays deposit", stageName: "deposit_pending", defaultAssignedRole: "buyer" },
  ],
  deposit_received: [{ stepCode: "deposit_received", stepName: "Deposit received in escrow", stageName: "deposit_received", defaultAssignedRole: "system" }],
  inspection_pending: [
    { stepCode: "inspection_schedule", stepName: "Schedule inspection", stageName: "inspection_pending", defaultAssignedRole: "buyer" },
    { stepCode: "inspection_complete", stepName: "Inspection completed", stageName: "inspection_pending", defaultAssignedRole: "buyer" },
  ],
  inspection_completed: [{ stepCode: "inspection_done", stepName: "Inspection completed or waived", stageName: "inspection_completed", defaultAssignedRole: "system" }],
  financing_pending: [
    { stepCode: "financing_apply", stepName: "Financing application", stageName: "financing_pending", defaultAssignedRole: "buyer" },
    { stepCode: "financing_confirm", stepName: "Financing confirmed", stageName: "financing_pending", defaultAssignedRole: "buyer" },
  ],
  financing_confirmed: [{ stepCode: "financing_done", stepName: "Financing approved or waived", stageName: "financing_confirmed", defaultAssignedRole: "system" }],
  legal_documents_prepared: [
    { stepCode: "documents_generate", stepName: "Generate closing documents", stageName: "legal_documents_prepared", defaultAssignedRole: "broker" },
    { stepCode: "documents_review", stepName: "Documents reviewed", stageName: "legal_documents_prepared", defaultAssignedRole: "buyer" },
  ],
  notary_review: [
    { stepCode: "notary_assign", stepName: "Notary assigned", stageName: "notary_review", defaultAssignedRole: "admin" },
    { stepCode: "notary_review", stepName: "Notary review completed", stageName: "notary_review", defaultAssignedRole: "notary" },
  ],
  closing_scheduled: [
    { stepCode: "closing_schedule", stepName: "Closing date set", stageName: "closing_scheduled", defaultAssignedRole: "notary" },
    { stepCode: "closing_funds", stepName: "Final funds confirmed", stageName: "closing_scheduled", defaultAssignedRole: "buyer" },
  ],
  closing_completed: [{ stepCode: "closing_done", stepName: "Closing completed", stageName: "closing_completed", defaultAssignedRole: "notary" }],
  cancelled: [],
};

export function getNextStage(current: TimelineStage): TimelineStage | null {
  const i = STAGE_ORDER.indexOf(current);
  if (i < 0 || i >= STAGE_ORDER.length - 1) return null;
  return STAGE_ORDER[i + 1] ?? null;
}

export function getStageOrderIndex(stage: TimelineStage): number {
  const i = STAGE_ORDER.indexOf(stage);
  return i >= 0 ? i : -1;
}
