/**
 * Deterministic signal completeness — no ML. Used to temper copy when DB/context is thin.
 */

import type { HubJourneyContext, HubKey, JourneyConfidence } from "./hub-journey.types";

/** Keys per hub that materially affect journey accuracy when known vs unknown. */
const SIGNAL_KEYS: Record<HubKey, (keyof HubJourneyContext)[]> = {
  buyer: [
    "buyerCitySelected",
    "buyerBudgetSet",
    "buyerBrowseSessions",
    "buyerShortlistCount",
    "buyerContactedSeller",
    "buyerViewingScheduled",
    "buyerOfferStarted",
  ],
  seller: [
    "sellerListingStarted",
    "sellerDetailsComplete",
    "sellerPhotosCount",
    "sellerPricingViewed",
    "sellerPublished",
    "sellerInquiryCount",
    "sellerDealStage",
  ],
  rent: [
    "rentCriteriaSet",
    "rentShortlistCount",
    "rentContacted",
    "rentVisitScheduled",
    "rentApplicationStarted",
  ],
  landlord: [
    "landlordHasRentalListing",
    "landlordPhotosCount",
    "landlordPublished",
    "landlordLeadCount",
    "landlordResponded",
  ],
  bnhub_guest: [
    "bnGuestSearchDone",
    "bnGuestCompared",
    "bnGuestOpenedDetail",
    "bnGuestBookingStarted",
    "bnGuestBookingPaid",
    "bnGuestStayActive",
  ],
  bnhub_host: [
    "bnHostListingCreated",
    "bnHostPhotosCount",
    "bnHostPublished",
    "bnHostBookingCount",
    "bnHostLowConversion",
  ],
  broker: [
    "brokerProfileComplete",
    "brokerLeadsUnlocked",
    "brokerLeadsContacted",
    "brokerPipelineMoved",
    "brokerClosedCount",
  ],
  investor: [
    "investorGoalsSet",
    "investorBrowseCount",
    "investorInsightsViewed",
    "investorShortlistCount",
    "investorAnalysisRequested",
    "investorCompared",
  ],
  admin: [
    "adminDashboardVisited",
    "adminRevenueReviewed",
    "adminAlertsReviewed",
    "adminLeadQualityReviewed",
    "adminBnhubReviewed",
    "adminGrowthReviewed",
    "adminActionsExecuted",
  ],
};

function countDefined(ctx: HubJourneyContext, keys: (keyof HubJourneyContext)[]): number {
  let n = 0;
  for (const k of keys) {
    const v = ctx[k];
    if (v === undefined || v === null) continue;
    if (typeof v === "number" && !Number.isFinite(v)) continue;
    n += 1;
  }
  return n;
}

/**
 * Ratio of known journey signals. Guest/unauthenticated sessions often score lower — expected.
 */
export function computeHubJourneySignalConfidence(hub: HubKey, ctx: HubJourneyContext): JourneyConfidence {
  const keys = SIGNAL_KEYS[hub];
  const total = keys.length;
  if (total === 0) return "high";

  const defined = countDefined(ctx, keys);
  let ratio = defined / total;

  /** Logged-out users on hubs that typically need account signals — cap confidence ceiling. */
  const needsAccount =
    hub === "broker" || hub === "investor" || hub === "seller" || hub === "landlord" || hub === "admin";
  if (needsAccount && !ctx.userId) {
    ratio = Math.min(ratio, 0.45);
  }

  if (ratio >= 0.55) return "high";
  if (ratio >= 0.28) return "medium";
  return "low";
}
