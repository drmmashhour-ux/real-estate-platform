/**
 * $100 (CAD) micro-flight — conservative math, not a performance guarantee.
 * Primary revenue: BNHub bookings (~60% of budget).
 */

export type MicroSpendCampaign = {
  id: string;
  name: string;
  budgetCad: number;
  share: number;
  keywords: string[];
  cpcLowCad: number;
  cpcHighCad: number;
  cpcMidCad: number;
  cvrLow: number;
  cvrHigh: number;
  cvrMid: number;
  expectedClicks: number;
  expectedConversions: number;
};

export type First100DollarsResult = {
  totalBudgetCad: number;
  currency: "CAD";
  campaigns: MicroSpendCampaign[];
  expectedClicks: number;
  expectedConversions: number;
  /** BNHub guest-paid GMV proxy × platform take — not net profit. */
  expectedRevenueCad: number;
  assumptions: string[];
};

const SPLIT = { bnhub: 0.6, host: 0.25, retarget: 0.15 } as const;

function mid(a: number, b: number): number {
  return Math.round(((a + b) / 2) * 1000) / 1000;
}

export function buildFirst100DollarsStrategy(): First100DollarsResult {
  const totalBudgetCad = 100;
  const assumptions = [
    "CPC mid-range $1.00–$2.00 CAD blended — validate in Google Ads after 48h.",
    "CVR 2–5% = click → meaningful action (lead/booking intent), not always paid stay.",
    "Revenue uses ~35% of BNHub-line conversions as paid bookings × $185 CAD avg stay × 12% take-rate proxy — tune from Stripe.",
    "Simulation only — does not replace live traffic measurement.",
  ];

  const campaigns: MicroSpendCampaign[] = [
    {
      id: "bnhub_booking_micro",
      name: "BNHub stays — Montréal (primary revenue)",
      budgetCad: Math.round(totalBudgetCad * SPLIT.bnhub * 100) / 100,
      share: SPLIT.bnhub,
      keywords: [
        "short term rental Montreal",
        "Montreal vacation rental",
        "downtown Montreal stay",
        "BNHub Montreal",
        "book stay Montreal",
      ],
      cpcLowCad: 1.0,
      cpcHighCad: 2.0,
      cpcMidCad: 1.5,
      cvrLow: 0.02,
      cvrHigh: 0.05,
      cvrMid: 0.035,
      expectedClicks: 0,
      expectedConversions: 0,
    },
    {
      id: "host_acq_micro",
      name: "Host acquisition — list on BNHub",
      budgetCad: Math.round(totalBudgetCad * SPLIT.host * 100) / 100,
      share: SPLIT.host,
      keywords: [
        "list Airbnb Montreal",
        "host short term rental Quebec",
        "become a host Montreal",
      ],
      cpcLowCad: 1.1,
      cpcHighCad: 2.2,
      cpcMidCad: 1.65,
      cvrLow: 0.02,
      cvrHigh: 0.045,
      cvrMid: 0.032,
      expectedClicks: 0,
      expectedConversions: 0,
    },
    {
      id: "retarget_micro",
      name: "Retargeting — warm LP visitors",
      budgetCad: Math.round(totalBudgetCad * SPLIT.retarget * 100) / 100,
      share: SPLIT.retarget,
      keywords: ["Montreal stay retarget", "LECIPM BNHub", "return visitor booking"],
      cpcLowCad: 0.7,
      cpcHighCad: 1.5,
      cpcMidCad: 1.1,
      cvrLow: 0.03,
      cvrHigh: 0.06,
      cvrMid: 0.045,
      expectedClicks: 0,
      expectedConversions: 0,
    },
  ];

  let expectedClicks = 0;
  let expectedConversions = 0;
  for (const c of campaigns) {
    const cpc = c.cpcMidCad;
    const clicks = Math.max(0, Math.floor(c.budgetCad / cpc));
    const conv = Math.round(clicks * c.cvrMid * 100) / 100;
    c.expectedClicks = clicks;
    c.expectedConversions = conv;
    expectedClicks += clicks;
    expectedConversions += conv;
  }

  const bnhub = campaigns[0]!;
  const paidBookingFactor = 0.35;
  const avgStayCad = 185;
  const takeRate = 0.12;
  const bookingLikeConversions = bnhub.expectedConversions * paidBookingFactor;
  const expectedRevenueCad =
    Math.round(bookingLikeConversions * avgStayCad * takeRate * 100) / 100;

  return {
    totalBudgetCad,
    currency: "CAD",
    campaigns,
    expectedClicks,
    expectedConversions,
    expectedRevenueCad,
    assumptions,
  };
}
