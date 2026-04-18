/**
 * KPI keys for Command Center / Executive board — each ties to an explainable formula in `kpi.service.ts`.
 */
export const KPI_KEYS = [
  "user_growth_rate",
  "listing_growth_rate",
  "gmv_proxy_cents",
  "engagement_ctr",
  "liquidity_headline",
  "conversion_funnel_health",
  "arpu_cents_estimate",
  "revenue_growth_rate",
] as const;

export type KpiKey = (typeof KPI_KEYS)[number];

export type KpiDefinition = {
  key: KpiKey;
  label: string;
  description: string;
  isEstimate: boolean;
  unit: "ratio" | "currency_cents" | "count" | "text";
};

export const KPI_DEFINITIONS: Record<KpiKey, KpiDefinition> = {
  user_growth_rate: {
    key: "user_growth_rate",
    label: "User growth (period vs prior)",
    description: "(new users this period − new users prior period) / max(1, prior new users).",
    isEstimate: false,
    unit: "ratio",
  },
  listing_growth_rate: {
    key: "listing_growth_rate",
    label: "New listing growth",
    description: "From `metrics.marketplace.listingGrowthRate` (segment-aware).",
    isEstimate: false,
    unit: "ratio",
  },
  gmv_proxy_cents: {
    key: "gmv_proxy_cents",
    label: "GMV proxy (payments)",
    description: "Sum of completed payment amounts in window — not external market GMV.",
    isEstimate: false,
    unit: "currency_cents",
  },
  engagement_ctr: {
    key: "engagement_ctr",
    label: "Listing CTR (event log)",
    description: "listing_click / listing_impression in range.",
    isEstimate: false,
    unit: "ratio",
  },
  liquidity_headline: {
    key: "liquidity_headline",
    label: "Market liquidity (top city)",
    description: "Highest liquidity score from internal 7d city rollup.",
    isEstimate: false,
    unit: "text",
  },
  conversion_funnel_health: {
    key: "conversion_funnel_health",
    label: "Booking complete / start",
    description: "booking_complete / booking_start from event log rollup.",
    isEstimate: false,
    unit: "ratio",
  },
  arpu_cents_estimate: {
    key: "arpu_cents_estimate",
    label: "ARPU (estimate)",
    description: "total platform revenue in range / max(1, active user proxy) — see KPI service; labeled estimate.",
    isEstimate: true,
    unit: "currency_cents",
  },
  revenue_growth_rate: {
    key: "revenue_growth_rate",
    label: "Revenue growth vs prior period",
    description: "(current total revenue − prior) / max(1, prior).",
    isEstimate: false,
    unit: "ratio",
  },
};
