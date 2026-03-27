import { prisma } from "@/lib/db";

type PromotionDb = Pick<typeof prisma, "bnhubPromotionPlan">;

export const BNHUB_PROMOTION_SKUS = [
  "featured_listing_weekly",
  "featured_listing_monthly",
  "homepage_slot_weekly",
  "homepage_slot_monthly",
  "category_slot_weekly",
  "category_slot_monthly",
  "local_ad_weekly",
  "local_ad_monthly",
] as const;

export type BnhubPromotionSku = (typeof BNHUB_PROMOTION_SKUS)[number];

type PlanSeed = {
  sku: BnhubPromotionSku;
  name: string;
  placement: string;
  billingPeriod: string;
  priceCents: number;
  description: string;
};

const DEFAULT_PLANS: PlanSeed[] = [
  {
    sku: "featured_listing_weekly",
    name: "Featured listing (7 days)",
    placement: "featured_listing",
    billingPeriod: "weekly",
    priceCents: 7_900,
    description: "Highlight a BNHub listing in featured collections for one week.",
  },
  {
    sku: "featured_listing_monthly",
    name: "Featured listing (30 days)",
    placement: "featured_listing",
    billingPeriod: "monthly",
    priceCents: 24_900,
    description: "Featured placement for a full month.",
  },
  {
    sku: "homepage_slot_weekly",
    name: "Homepage sponsored slot (7 days)",
    placement: "homepage",
    billingPeriod: "weekly",
    priceCents: 12_900,
    description: "Premium homepage visibility for one week.",
  },
  {
    sku: "homepage_slot_monthly",
    name: "Homepage sponsored slot (30 days)",
    placement: "homepage",
    billingPeriod: "monthly",
    priceCents: 39_900,
    description: "Homepage placement for 30 days.",
  },
  {
    sku: "category_slot_weekly",
    name: "Category spotlight (7 days)",
    placement: "category",
    billingPeriod: "weekly",
    priceCents: 5_900,
    description: "Top placement within a BNHub category for one week.",
  },
  {
    sku: "category_slot_monthly",
    name: "Category spotlight (30 days)",
    placement: "category",
    billingPeriod: "monthly",
    priceCents: 17_900,
    description: "Category spotlight for a month.",
  },
  {
    sku: "local_ad_weekly",
    name: "Local services ad (7 days)",
    placement: "local_ad",
    billingPeriod: "weekly",
    priceCents: 3_900,
    description: "Promote a local business or service on BNHub for one week.",
  },
  {
    sku: "local_ad_monthly",
    name: "Local services ad (30 days)",
    placement: "local_ad",
    billingPeriod: "monthly",
    priceCents: 11_900,
    description: "Local ad placement for 30 days.",
  },
];

/**
 * Idempotent catalog seed for BNHub promotion products (admin dashboard + checkout later).
 */
export async function ensureDefaultPromotionPlans(tx: PromotionDb = prisma) {
  for (const p of DEFAULT_PLANS) {
    await tx.bnhubPromotionPlan.upsert({
      where: { sku: p.sku },
      create: {
        sku: p.sku,
        name: p.name,
        placement: p.placement,
        billingPeriod: p.billingPeriod,
        priceCents: p.priceCents,
        currency: "cad",
        active: true,
        description: p.description,
      },
      update: {
        name: p.name,
        placement: p.placement,
        billingPeriod: p.billingPeriod,
        priceCents: p.priceCents,
        description: p.description,
        active: true,
      },
    });
  }
}
