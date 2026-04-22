/**
 * LECIPM monetization engine — typed anchors for checkouts, dashboards, and guards.
 * Live Stripe amounts remain authoritative at checkout time.
 */

import { getBnhubCommissionRate } from "@/lib/stripe/bnhub-connect";
import { FAMILY_ADDON_LIST_PRICES } from "@/modules/soins-revenue/soins-revenue-catalog";
import { PRICING_CONFIG as LEGACY_PRICING_CONFIG } from "@/modules/revenue/pricing-config";
import { DEFAULT_BROKER_LEAD_PRICE } from "@/modules/billing/brokerPricing";

export { PRICING_CONFIG } from "@/modules/revenue/pricing-config";
export { FAMILY_ADDON_LIST_PRICES } from "@/modules/soins-revenue/soins-revenue-catalog";

export type ResidenceTierId = "BASIC" | "PRO" | "ELITE";
export type InvestorTierId = "STARTER" | "PRO" | "ELITE";

export type TierAnchor = {
  /** Monthly anchor in whole CAD dollars (marketing / fallback — Stripe Price IDs win at checkout). */
  monthlyPriceCad: number;
  /** Stripe Price env key reference (see STRIPE_PRICE_ENV). */
  stripePriceEnvKey?: keyof typeof STRIPE_PRICE_ENV;
};

export type LecipmSubscriptionHubKind =
  | "workspace"
  | "broker_saas"
  | "investor"
  | "residence_soins"
  | "family_premium";

export const LECIPM_STRIPE_METADATA = {
  hubKind: "lecipmHubKind",
  workspaceFlag: "lecipmWorkspace",
  paymentType: "paymentType",
  userId: "userId",
  workspaceId: "workspaceId",
  brokerPlan: "lecipmBrokerPlan",
} as const;

export const STRIPE_PRICE_ENV = {
  workspacePro: "STRIPE_PRICE_LECIPM_PRO",
  workspaceEnterprise: "STRIPE_PRICE_LECIPM_ENTERPRISE",
  brokerPro: "STRIPE_PRICE_LECIPM_BROKER_PRO",
  brokerPlatinum: "STRIPE_PRICE_LECIPM_BROKER_PLATINUM",
  investorPremium: "STRIPE_PRICE_LECIPM_INVESTOR_PREMIUM",
  investorElite: "STRIPE_PRICE_LECIPM_INVESTOR_ELITE",
  residenceSoinsBasic: "STRIPE_PRICE_LECIPM_SOINS_RESIDENCE_BASIC",
  residenceSoinsPro: "STRIPE_PRICE_LECIPM_SOINS_RESIDENCE_PRO",
  residenceSoinsElite: "STRIPE_PRICE_LECIPM_SOINS_RESIDENCE_ELITE",
  familyPremiumBundle: "STRIPE_PRICE_LECIPM_FAMILY_PREMIUM",
} as const;

/** Residence / care operator listing SaaS — tier anchors (CAD/month). */
export const residenceSubscriptionTiers: Record<ResidenceTierId, TierAnchor> = {
  BASIC: { monthlyPriceCad: 199, stripePriceEnvKey: "residenceSoinsBasic" },
  PRO: { monthlyPriceCad: 399, stripePriceEnvKey: "residenceSoinsPro" },
  ELITE: { monthlyPriceCad: 799, stripePriceEnvKey: "residenceSoinsElite" },
};

/** Investor Hub analytics / portal depth — tier anchors (CAD/month). */
export const investorSubscriptionTiers: Record<InvestorTierId, TierAnchor> = {
  STARTER: { monthlyPriceCad: 49 },
  PRO: { monthlyPriceCad: 149, stripePriceEnvKey: "investorPremium" },
  ELITE: { monthlyPriceCad: 399, stripePriceEnvKey: "investorElite" },
};

export type ListingFeeAnchors = {
  featuredListingByDays: typeof LEGACY_PRICING_CONFIG.canada.featuredListing;
  fsboPublishAnchorCents: number;
};

export type LeadPricingAnchors = typeof LEGACY_PRICING_CONFIG.canada.lead & {
  defaultUnitDollars: number;
};

export type CommissionAnchors = {
  bnhubPlatformRate: number;
  brokerSuccessBonusRateOfPlatformFee: number;
};

export type FamilyPremiumAnchors = typeof FAMILY_ADDON_LIST_PRICES;

/**
 * Unified typed config — use top-level aliases below for stable imports.
 */
export const LECIPM_PRICING_CONFIG = {
  currency: "cad" as const,
  listingFees: {
    featuredListingByDays: LEGACY_PRICING_CONFIG.canada.featuredListing,
    fsboPublishAnchorCents: 9900,
  } satisfies ListingFeeAnchors,
  leadPricing: {
    ...LEGACY_PRICING_CONFIG.canada.lead,
    defaultUnitDollars: LEGACY_PRICING_CONFIG.canada.lead.default,
  } satisfies LeadPricingAnchors,
  subscriptions: {
    brokerLeadDefaultDollars: DEFAULT_BROKER_LEAD_PRICE,
  },
  commissions: {
    bnhubPlatformRate: getBnhubCommissionRate(),
    brokerSuccessBonusRateOfPlatformFee: parseEnvRate(
      process.env.LECIPM_BROKER_SUCCESS_BONUS_RATE,
      0.15,
    ),
  } satisfies CommissionAnchors,
  familyPremium: FAMILY_ADDON_LIST_PRICES satisfies FamilyPremiumAnchors,
  aiPremiumMonthlyCad: LEGACY_PRICING_CONFIG.canada.aiPremium.monthly,
  residenceSubscriptionTiers,
  investorSubscriptionTiers,
} as const;

/** FSBO single listing publish anchor (major units CAD ≈ cents / 100 for display). */
export const listingFeeCents = LECIPM_PRICING_CONFIG.listingFees.fsboPublishAnchorCents;

/** Premium placement — smallest featured window (7-day SKU anchor CAD). */
export const premiumListingFeeCad =
  LECIPM_PRICING_CONFIG.listingFees.featuredListingByDays[7] ?? 25;

/** Default broker-assigned lead unit before profile override (CAD). */
export const brokerLeadPriceCad = LECIPM_PRICING_CONFIG.subscriptions.brokerLeadDefaultDollars;

/** Fraction of platform fee suggested for broker success bonus pool. */
export const brokerSuccessBonusRate =
  LECIPM_PRICING_CONFIG.commissions.brokerSuccessBonusRateOfPlatformFee;

/** BNHub booking platform take rate (same as Stripe application fee basis). */
export const bnhubCommissionRate = LECIPM_PRICING_CONFIG.commissions.bnhubPlatformRate;

/**
 * Bundled family premium anchor (sum of catalog add-ons as a reference list price).
 * Configure `STRIPE_PRICE_LECIPM_FAMILY_PREMIUM` for the actual recurring SKU.
 */
export const familyPremiumPriceCad = round2(
  Object.values(FAMILY_ADDON_LIST_PRICES).reduce((a, b) => a + b, 0),
);

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function parseEnvRate(raw: string | undefined, fallback: number): number {
  if (raw === undefined || raw === "") return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0 || n > 1) return fallback;
  return n;
}

/** Resolve optional Stripe Price ID from env (trimmed). */
export function stripePriceIdFromEnv(envName: keyof typeof STRIPE_PRICE_ENV): string | null {
  const key = STRIPE_PRICE_ENV[envName];
  const v = process.env[key]?.trim();
  return v || null;
}

export function suggestedBrokerSuccessBonusCents(platformFeeCents: number): number {
  const rate = LECIPM_PRICING_CONFIG.commissions.brokerSuccessBonusRateOfPlatformFee;
  return Math.max(0, Math.round(platformFeeCents * rate));
}

// —— Part 1 stable names (amounts: fee/price in cents or CAD as noted) ——
/** FSBO-style listing publish anchor, cents. */
export const listingFee = listingFeeCents;
/** Premium/featured listing window anchor — 7‑day SKU, whole CAD dollars. */
export const premiumListingFee = premiumListingFeeCad;
/** Default broker lead unit price, whole CAD dollars (before broker profile override). */
export const brokerLeadPrice = brokerLeadPriceCad;
/** Success bonus pool as fraction of platform fee on closed deals. */
export const brokerSuccessBonus = brokerSuccessBonusRate;
