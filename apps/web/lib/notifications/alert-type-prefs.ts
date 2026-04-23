import type { NotificationPreference, WatchlistAlertType } from "@prisma/client";

export function preferenceAllowsAlertType(
  alertType: WatchlistAlertType,
  pref: Pick<NotificationPreference, "alertNewDeals" | "alertPriceDrop" | "alertScoreChange" | "alertBuyBox">,
): boolean {
  switch (alertType) {
    case "price_changed":
      return pref.alertPriceDrop;
    case "deal_score_up":
    case "deal_score_down":
    case "trust_score_changed":
    case "fraud_risk_up":
    case "confidence_up":
    case "confidence_down":
      return pref.alertScoreChange;
    case "listing_status_changed":
      return pref.alertNewDeals;
    case "strong_opportunity_detected":
    case "needs_review_detected":
      return pref.alertBuyBox;
    default:
      return true;
  }
}
