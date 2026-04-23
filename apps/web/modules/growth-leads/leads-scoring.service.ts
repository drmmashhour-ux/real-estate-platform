import type { BehaviorSignals, IntentLevel, LeadIntent, LeadSourceChannel } from "./leads.types";

export type ScoreLeadInput = {
  intent: LeadIntent;
  source: LeadSourceChannel;
  behaviors?: BehaviorSignals;
};

/**
 * Heuristic scoring — replace with ML or rules engine later.
 * Points drive LOW / MEDIUM / HIGH bands.
 */
export function scoreLead(input: ScoreLeadInput): IntentLevel {
  let pts = 0;

  switch (input.intent) {
    case "INVESTOR":
      pts += 2;
      break;
    case "BUYER":
      pts += 1;
      break;
    case "BROKER":
      pts += 2;
      break;
    case "RENT":
      pts += 1;
      break;
    default:
      break;
  }

  switch (input.source) {
    case "BNHUB_BOOKING":
      pts += 3;
      break;
    case "FORM":
      pts += 2;
      break;
    case "LISTING_PAGE":
      pts += 2;
      break;
    case "MARKETING_CONTENT":
      pts += 1;
      break;
    case "LANDING_PAGE":
      pts += 1;
      break;
    default:
      break;
  }

  const b = input.behaviors;
  if (b?.clickedCta || b?.marketingClick) pts += 2;
  if (b?.listingViews != null && b.listingViews >= 5) pts += 3;
  else if (b?.listingViews != null && b.listingViews >= 2) pts += 2;
  else if (b?.listingViews != null && b.listingViews >= 1) pts += 1;

  if (b?.timeOnSiteSeconds != null && b.timeOnSiteSeconds >= 180) pts += 2;
  else if (b?.timeOnSiteSeconds != null && b.timeOnSiteSeconds >= 60) pts += 1;

  if (b?.repeatSession) pts += 2;

  if (pts >= 8) return "HIGH";
  if (pts >= 4) return "MEDIUM";
  return "LOW";
}
