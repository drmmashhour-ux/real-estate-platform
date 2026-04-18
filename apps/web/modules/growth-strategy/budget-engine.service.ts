/**
 * Conservative ad budget allocation for launch (CAD).
 * Tied to campaign themes that map to `growth_events` + BNHub revenue flows.
 */

export type BudgetAllocationInput = {
  /** Total monthly or flight budget in CAD — clamped to 500–1000. */
  totalBudget: number;
  city: string;
};

export type AllocatedCampaignRow = {
  id: string;
  name: string;
  /** Share of total (0–1). */
  share: number;
  /** Allocated budget CAD (2 decimals). */
  budgetCad: number;
  /** Audience / product target — maps to tracking `growth_lp` / hub. */
  target: "bnhub_booking" | "host_acquisition" | "buyer_renter" | "retargeting";
  /** Mid-range CPC assumption (CAD). */
  expectedCpcCad: number;
  /** Conservative conversion rate (click → meaningful action). */
  expectedConversionRate: number;
  expectedClicks: number;
  expectedConversions: number;
  notes: string;
};

const SHARES = {
  bnhub: 0.5,
  host: 0.25,
  buyerRenter: 0.15,
  retargeting: 0.1,
} as const;

/** Conservative CPC bands (CAD) — search + meta blended. */
const CPC_BY_TARGET: Record<AllocatedCampaignRow["target"], { min: number; max: number }> = {
  bnhub_booking: { min: 0.9, max: 2.2 },
  host_acquisition: { min: 1.0, max: 2.5 },
  buyer_renter: { min: 0.8, max: 2.0 },
  retargeting: { min: 0.5, max: 1.4 },
};

/** Conservative CVR (click → conversion) — not booking rate; “meaningful” platform action. */
const CVR_BY_TARGET: Record<AllocatedCampaignRow["target"], { min: number; max: number }> = {
  bnhub_booking: { min: 0.02, max: 0.045 },
  host_acquisition: { min: 0.02, max: 0.05 },
  buyer_renter: { min: 0.025, max: 0.055 },
  retargeting: { min: 0.035, max: 0.06 },
};

function mid(a: number, b: number): number {
  return Math.round(((a + b) / 2) * 1000) / 1000;
}

function clampBudget(n: number): number {
  if (!Number.isFinite(n)) return 500;
  return Math.min(1000, Math.max(500, Math.round(n)));
}

export type BudgetEngineResult = {
  city: string;
  totalBudgetCad: number;
  campaigns: AllocatedCampaignRow[];
  assumptions: {
    cpcSource: string;
    cvrSource: string;
    trackingNote: string;
  };
};

/**
 * Allocate budget across launch themes. Outputs are inputs to `simulateCampaignPerformance`.
 */
export function allocateLaunchBudget(input: BudgetAllocationInput): BudgetEngineResult {
  const city = input.city?.trim() || "Montreal";
  const totalBudgetCad = clampBudget(input.totalBudget);

  const rows: AllocatedCampaignRow[] = [
    {
      id: "bnhub-primary",
      name: `BNHub stays — ${city} (primary revenue)`,
      share: SHARES.bnhub,
      budgetCad: Math.round(totalBudgetCad * SHARES.bnhub * 100) / 100,
      target: "bnhub_booking",
      expectedCpcCad: mid(CPC_BY_TARGET.bnhub_booking.min, CPC_BY_TARGET.bnhub_booking.max),
      expectedConversionRate: mid(CVR_BY_TARGET.bnhub_booking.min, CVR_BY_TARGET.bnhub_booking.max),
      expectedClicks: 0,
      expectedConversions: 0,
      notes: "Maps to /lp/rent + BNHub checkout; measure booking_completed in growth_events + Stripe.",
    },
    {
      id: "host-growth",
      name: `Host acquisition — ${city}`,
      share: SHARES.host,
      budgetCad: Math.round(totalBudgetCad * SHARES.host * 100) / 100,
      target: "host_acquisition",
      expectedCpcCad: mid(CPC_BY_TARGET.host_acquisition.min, CPC_BY_TARGET.host_acquisition.max),
      expectedConversionRate: mid(CVR_BY_TARGET.host_acquisition.min, CVR_BY_TARGET.host_acquisition.max),
      expectedClicks: 0,
      expectedConversions: 0,
      notes: "Maps to /lp/host + host_signup / listing_created.",
    },
    {
      id: "demand-discovery",
      name: `Buyer / renter discovery — ${city}`,
      share: SHARES.buyerRenter,
      budgetCad: Math.round(totalBudgetCad * SHARES.buyerRenter * 100) / 100,
      target: "buyer_renter",
      expectedCpcCad: mid(CPC_BY_TARGET.buyer_renter.min, CPC_BY_TARGET.buyer_renter.max),
      expectedConversionRate: mid(CVR_BY_TARGET.buyer_renter.min, CVR_BY_TARGET.buyer_renter.max),
      expectedClicks: 0,
      expectedConversions: 0,
      notes: "Maps to /lp/buy, /lp/rent intent; broker_lead + signup_success.",
    },
    {
      id: "retargeting",
      name: `Retargeting — warm traffic`,
      share: SHARES.retargeting,
      budgetCad: Math.round(totalBudgetCad * SHARES.retargeting * 100) / 100,
      target: "retargeting",
      expectedCpcCad: mid(CPC_BY_TARGET.retargeting.min, CPC_BY_TARGET.retargeting.max),
      expectedConversionRate: mid(CVR_BY_TARGET.retargeting.min, CVR_BY_TARGET.retargeting.max),
      expectedClicks: 0,
      expectedConversions: 0,
      notes: "Uses retargeting segments from traffic_events / flags; lower CPC, higher intent.",
    },
  ];

  for (const r of rows) {
    const cpc = r.expectedCpcCad > 0 ? r.expectedCpcCad : 1.2;
    r.expectedClicks = Math.max(0, Math.floor(r.budgetCad / cpc));
    r.expectedConversions = Math.max(0, Math.round(r.expectedClicks * r.expectedConversionRate * 100) / 100);
  }

  return {
    city,
    totalBudgetCad,
    campaigns: rows,
    assumptions: {
      cpcSource: "Blended paid search/social — conservative mid-range ($0.80–$2.50 CAD).",
      cvrSource: "Conservative 2%–6% click-to-lead style; validate against growth_events.",
      trackingNote: "Compare to growth_events + traffic_events; BNHub revenue from platform_payment booking.",
    },
  };
}
