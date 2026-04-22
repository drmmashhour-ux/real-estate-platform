import type { PlatformBusinessEvent } from "./platform-events";

/**
 * Reduces notification noise: high-severity and money events always pass;
 * low-signal events can be dropped for SMS (email may still go to digest).
 */
export function shouldNotifyAdmin(event: PlatformBusinessEvent, channel: "email" | "sms"): boolean {
  if (event.type === "RISK_ANOMALY" || event.type === "FRAUD_SUSPECTED") {
    return true;
  }
  if (event.type === "HIGH_VALUE_ACTION" || event.type === "RISK_ALERT") {
    return true;
  }
  if (event.type === "SOINS_EMERGENCY") {
    return true;
  }
  if (event.type === "SOINS_CARE_ALERT" && event.severity === "HIGH") {
    return true;
  }
  if (
    event.type === "BOOKING_CONFIRMED" ||
    event.type === "LEAD_PURCHASED" ||
    event.type === "DEAL_CLOSED" ||
    event.type === "SUBSCRIPTION_PAID" ||
    event.type === "PAYOUT_COMPLETED" ||
    event.type === "LISTING_FEE_PAID"
  ) {
    return true;
  }
  if (event.type === "LISTING_PUBLISHED") {
    return channel === "email";
  }
  if (event.type === "REVENUE_SPIKE" && event.percentChange >= 10) {
    return true;
  }
  if (event.type === "MONEY_GENERATED" && event.amountCents >= 10_000) {
    return true;
  }
  if (channel === "sms") {
    if (event.type === "SOINS_CARE_ALERT" && event.severity === "HIGH") return true;
    return false;
  }
  if (event.type === "SOINS_CARE_ALERT" && event.severity !== "HIGH") {
    return channel === "email";
  }
  return true;
}
