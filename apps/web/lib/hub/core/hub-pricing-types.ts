/**
 * Generic pricing contracts — nightly, daily, fixed, or quote-based per adapter.
 */

export type HubPriceLine = {
  code: string;
  labelKey: string;
  amountCents: number;
  kind: "lodging" | "fee" | "tax" | "addon" | "discount" | "other";
};

export type HubPricingContext = {
  hubKey: string;
  entityId: string;
  currency: string;
  window: Record<string, string>;
};

export type HubPricingResult = {
  lines: HubPriceLine[];
  totalCents: number;
  /** Version for cache / Stripe alignment */
  pricingSchemaVersion: number;
};

export type HubPricingEngine = {
  price(ctx: HubPricingContext): Promise<HubPricingResult | null>;
};
