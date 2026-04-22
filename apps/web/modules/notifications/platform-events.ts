/**
 * High-level business events for admin + user notification routing.
 * Producers: webhooks, jobs, booking flows, broker unlock, risk engine.
 */
export type PlatformBusinessEvent =
  | { type: "BOOKING_CONFIRMED"; amountCents: number; currency?: string; reference?: string }
  | { type: "LEAD_PURCHASED"; amountCents?: number; reference?: string }
  | { type: "DEAL_CLOSED"; amountCents?: number; reference?: string }
  | { type: "MONEY_GENERATED"; amountCents: number; reference?: string }
  | { type: "SUBSCRIPTION_PAID"; amountCents?: number; reference?: string }
  | { type: "PAYOUT_COMPLETED"; amountCents?: number; reference?: string; beneficiary?: string }
  | { type: "LISTING_PUBLISHED"; listingId?: string; reference?: string }
  | { type: "LISTING_FEE_PAID"; amountCents?: number; reference?: string }
  | { type: "REVENUE_SPIKE"; percentChange: number; window?: "24h" | "7d" }
  | { type: "RISK_ALERT"; code: string; detail?: string }
  | { type: "RISK_ANOMALY"; code: string; detail?: string }
  | { type: "FRAUD_SUSPECTED"; code: string; detail?: string }
  | { type: "HIGH_VALUE_ACTION"; action: string; detail?: string }
  /** Soins Hub — escalated clinical/safety signal (routes admin + optionally family push). */
  | { type: "SOINS_EMERGENCY"; residentId: string; detail?: string }
  /** Soins Hub — operational alert (missed dose, abnormal movement, manual alert). */
  | {
      type: "SOINS_CARE_ALERT";
      residentId: string;
      severity: "LOW" | "MEDIUM" | "HIGH";
      alertCode?: string;
      detail?: string;
    };

export type PlatformEventTypeName = PlatformBusinessEvent["type"];
