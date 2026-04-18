import { prisma } from "@/lib/db";
import { PRICING } from "@/lib/monetization/pricing";

export type RevenueControlSettings = {
  monetizationEnabled: boolean;
  leadUnlockMinCents: number;
  leadUnlockMaxCents: number;
  /** Admin override for default lead anchor (cents); null = use `PRICING_CONFIG.canada.lead.default` */
  leadDefaultPriceCents: number | null;
  listingBoostPriceCents: number;
  listingBoostDurationDays: number;
  bnhubHostFeePercentOverride: number | null;
};

const DEFAULT_DAYS = 30;

export async function getRevenueControlSettings(): Promise<RevenueControlSettings> {
  const row = await prisma.platformFinancialSettings.findUnique({
    where: { id: "default" },
    select: {
      revenueMonetizationEnabled: true,
      revenueLeadUnlockMinCents: true,
      revenueLeadUnlockMaxCents: true,
      revenueLeadDefaultPriceCents: true,
      revenueListingBoostPriceCents: true,
      revenueListingBoostDurationDays: true,
      bnhubHostFeePercentOverride: true,
    },
  });

  const minC = row?.revenueLeadUnlockMinCents ?? Math.min(PRICING.leadPriceCents, 9_900);
  const maxC = row?.revenueLeadUnlockMaxCents ?? Math.max(PRICING.leadPriceCents, 79_900);

  let hostOverride: number | null = null;
  if (row?.bnhubHostFeePercentOverride != null) {
    const n = Number(row.bnhubHostFeePercentOverride);
    if (Number.isFinite(n) && n >= 0 && n <= 50) hostOverride = n;
  }

  let leadDefault: number | null = null;
  if (row?.revenueLeadDefaultPriceCents != null && row.revenueLeadDefaultPriceCents > 0) {
    leadDefault = row.revenueLeadDefaultPriceCents;
  }

  return {
    monetizationEnabled: row?.revenueMonetizationEnabled ?? false,
    leadUnlockMinCents: minC,
    leadUnlockMaxCents: maxC,
    leadDefaultPriceCents: leadDefault,
    listingBoostPriceCents: row?.revenueListingBoostPriceCents ?? PRICING.featuredListingPriceCents,
    listingBoostDurationDays: row?.revenueListingBoostDurationDays ?? DEFAULT_DAYS,
    bnhubHostFeePercentOverride: hostOverride,
  };
}

