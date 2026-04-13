import { prisma } from "../lib/db";

type BundleItemSeed = {
  id: string;
  serviceId: string;
  defaultQuantity?: number;
  isRequired?: boolean;
};

/** Replace bundle line items idempotently (catalog services must exist first). */
async function syncBundleItems(bundleId: string, rows: BundleItemSeed[]): Promise<void> {
  await prisma.bnhubBundleItem.deleteMany({ where: { bundleId } });
  if (rows.length === 0) return;
  await prisma.bnhubBundleItem.createMany({
    data: rows.map((r) => ({
      id: r.id,
      bundleId,
      serviceId: r.serviceId,
      defaultQuantity: r.defaultQuantity ?? 1,
      isRequired: r.isRequired ?? true,
    })),
  });
}

/**
 * Bundles, memberships, safety rules, extended catalog rows — run after base hospitality catalog seed.
 */
export async function seedBnhubHospitalityEcosystemV2(): Promise<void> {
  const plans = [
    {
      id: "bnhub-plan-plus",
      membershipCode: "BNHUB_PLUS",
      name: "BNHUB Plus",
      audienceType: "GUEST" as const,
      description: "Service discounts and early bundle access (staged billing).",
      priceCents: 999,
      billingCycle: "MONTHLY" as const,
      benefitsJson: { serviceDiscountBps: 300, earlyBundleAccess: true },
    },
    {
      id: "bnhub-plan-premium-traveler",
      membershipCode: "BNHUB_PREMIUM_TRAVELER",
      name: "BNHUB Premium Traveler",
      audienceType: "GUEST" as const,
      description: "Larger discounts and premium concierge surfaces.",
      priceCents: 2499,
      billingCycle: "MONTHLY" as const,
      benefitsJson: { serviceDiscountBps: 800, premiumConcierge: true },
    },
    {
      id: "bnhub-plan-elite-host",
      membershipCode: "BNHUB_ELITE_HOST",
      name: "BNHUB Elite Host",
      audienceType: "HOST" as const,
      description: "Marketing tools and priority review hooks (staged).",
      priceCents: 4999,
      billingCycle: "MONTHLY" as const,
      benefitsJson: { marketingBoost: true, priorityReview: true },
    },
  ];

  for (const p of plans) {
    await prisma.bnhubMembershipPlan.upsert({
      where: { id: p.id },
      create: { ...p, currency: "USD", isActive: true },
      update: {
        name: p.name,
        description: p.description,
        priceCents: p.priceCents,
        benefitsJson: p.benefitsJson,
        isActive: true,
      },
    });
  }

  const extraServices: {
    id: string;
    serviceCode: string;
    name: string;
    category: "TRANSPORT" | "FOOD" | "CLEANING" | "CONVENIENCE" | "EXPERIENCE" | "ACCESS" | "HOSPITALITY" | "CONCIERGE";
    description: string;
    iconKey: string;
  }[] = [
    {
      id: "bnhub-svc-private-driver",
      serviceCode: "private_driver_request",
      name: "Private driver request",
      category: "TRANSPORT",
      description: "Request a private driver (partner-managed / quote).",
      iconKey: "car",
    },
    {
      id: "bnhub-svc-shuttle",
      serviceCode: "shuttle_request",
      name: "Shuttle request",
      category: "TRANSPORT",
      description: "Shared or scheduled shuttle (request / quote).",
      iconKey: "bus",
    },
    {
      id: "bnhub-svc-grocery",
      serviceCode: "grocery_prestocking",
      name: "Grocery pre-stocking",
      category: "FOOD",
      description: "Groceries stocked before arrival.",
      iconKey: "cart",
    },
    {
      id: "bnhub-svc-towel",
      serviceCode: "towel_refresh",
      name: "Towel refresh",
      category: "CLEANING",
      description: "Fresh towels on request.",
      iconKey: "droplet",
    },
    {
      id: "bnhub-svc-deep-clean",
      serviceCode: "deep_cleaning_request",
      name: "Deep cleaning request",
      category: "CLEANING",
      description: "Heavy clean (quote may be required).",
      iconKey: "sparkles",
    },
    {
      id: "bnhub-svc-self-checkin",
      serviceCode: "self_checkin_assistance",
      name: "Self check-in assistance",
      category: "HOSPITALITY",
      description: "Help with smart lock / access.",
      iconKey: "key",
    },
    {
      id: "bnhub-svc-early",
      serviceCode: "early_checkin_request",
      name: "Early check-in request",
      category: "ACCESS",
      description: "Subject to calendar and host approval.",
      iconKey: "clock",
    },
    {
      id: "bnhub-svc-late",
      serviceCode: "late_checkout_request",
      name: "Late check-out request",
      category: "ACCESS",
      description: "Subject to calendar and host approval.",
      iconKey: "clock",
    },
    {
      id: "bnhub-svc-celebration",
      serviceCode: "celebration_setup",
      name: "Celebration setup",
      category: "EXPERIENCE",
      description: "Party / event setup coordination.",
      iconKey: "party",
    },
  ];

  for (const s of extraServices) {
    await prisma.bnhubService.upsert({
      where: { id: s.id },
      create: {
        id: s.id,
        serviceCode: s.serviceCode,
        name: s.name,
        category: s.category,
        description: s.description,
        shortDescription: s.description,
        iconKey: s.iconKey,
        icon: s.iconKey,
        serviceScope: "LISTING_HOSTED",
        catalogPricingBehavior: "FIXED",
        isActive: true,
      },
      update: {
        name: s.name,
        category: s.category,
        description: s.description,
        shortDescription: s.description,
        iconKey: s.iconKey,
      },
    });
  }

  const romanticId = "bnhub-bundle-romantic";
  await prisma.bnhubServiceBundle.upsert({
    where: { bundleCode: "romantic_package" },
    create: {
      id: romanticId,
      bundleCode: "romantic_package",
      name: "Romantic package",
      description: "Decoration, breakfast, late checkout request, welcome note.",
      targetSegment: "ROMANTIC",
      pricingType: "FIXED",
      basePriceCents: 8900,
      currency: "USD",
      isActive: true,
      visibilityScope: "PUBLIC",
    },
    update: { isActive: true, basePriceCents: 8900 },
  });
  await syncBundleItems(romanticId, [
    { id: "bnhub-bi-romantic-deco", serviceId: "bnhub-svc-room-decoration" },
    { id: "bnhub-bi-romantic-breakfast", serviceId: "bnhub-svc-breakfast" },
    { id: "bnhub-bi-romantic-late", serviceId: "bnhub-svc-late" },
    { id: "bnhub-bi-romantic-concierge", serviceId: "bnhub-svc-concierge" },
  ]);

  const familyId = "bnhub-bundle-family";
  await prisma.bnhubServiceBundle.upsert({
    where: { bundleCode: "family_comfort_package" },
    create: {
      id: familyId,
      bundleCode: "family_comfort_package",
      name: "Family comfort package",
      description: "Grocery, laundry, early check-in, cleaning.",
      targetSegment: "FAMILY",
      pricingType: "MIXED",
      basePriceCents: 12000,
      currency: "USD",
      isActive: true,
      visibilityScope: "PUBLIC",
    },
    update: { isActive: true },
  });
  await syncBundleItems(familyId, [
    { id: "bnhub-bi-family-grocery", serviceId: "bnhub-svc-grocery" },
    { id: "bnhub-bi-family-laundry", serviceId: "bnhub-svc-laundry" },
    { id: "bnhub-bi-family-early", serviceId: "bnhub-svc-early" },
    { id: "bnhub-bi-family-clean", serviceId: "bnhub-svc-daily-cleaning" },
  ]);

  const businessId = "bnhub-bundle-business";
  await prisma.bnhubServiceBundle.upsert({
    where: { bundleCode: "business_traveler_package" },
    create: {
      id: businessId,
      bundleCode: "business_traveler_package",
      name: "Business traveler package",
      description: "Check-in assistance, breakfast, airport pickup, late checkout request.",
      targetSegment: "BUSINESS",
      pricingType: "MIXED",
      basePriceCents: 13500,
      currency: "USD",
      isActive: true,
      visibilityScope: "PUBLIC",
    },
    update: { isActive: true, basePriceCents: 13500 },
  });
  await syncBundleItems(businessId, [
    { id: "bnhub-bi-biz-checkin", serviceId: "bnhub-svc-self-checkin" },
    { id: "bnhub-bi-biz-breakfast", serviceId: "bnhub-svc-breakfast" },
    { id: "bnhub-bi-biz-pickup", serviceId: "bnhub-svc-airport-pickup" },
    { id: "bnhub-bi-biz-late", serviceId: "bnhub-svc-late" },
  ]);

  const luxuryId = "bnhub-bundle-luxury-arrival";
  await prisma.bnhubServiceBundle.upsert({
    where: { bundleCode: "luxury_arrival_package" },
    create: {
      id: luxuryId,
      bundleCode: "luxury_arrival_package",
      name: "Luxury arrival package",
      description: "Airport pickup, breakfast, concierge, premium room setup.",
      targetSegment: "LUXURY",
      pricingType: "FIXED",
      basePriceCents: 18900,
      currency: "USD",
      isActive: true,
      visibilityScope: "PUBLIC",
    },
    update: { isActive: true, basePriceCents: 18900 },
  });
  await syncBundleItems(luxuryId, [
    { id: "bnhub-bi-lux-pickup", serviceId: "bnhub-svc-airport-pickup" },
    { id: "bnhub-bi-lux-breakfast", serviceId: "bnhub-svc-breakfast" },
    { id: "bnhub-bi-lux-concierge", serviceId: "bnhub-svc-concierge" },
    { id: "bnhub-bi-lux-deco", serviceId: "bnhub-svc-room-decoration" },
  ]);

  const longStayId = "bnhub-bundle-long-stay";
  await prisma.bnhubServiceBundle.upsert({
    where: { bundleCode: "long_stay_support_package" },
    create: {
      id: longStayId,
      bundleCode: "long_stay_support_package",
      name: "Long-stay support package",
      description: "Grocery pre-stocking, linen change, mid-stay cleaning, laundry.",
      targetSegment: "LONG_STAY",
      pricingType: "MIXED",
      basePriceCents: 15500,
      currency: "USD",
      isActive: true,
      visibilityScope: "PUBLIC",
    },
    update: { isActive: true, basePriceCents: 15500 },
  });
  await syncBundleItems(longStayId, [
    { id: "bnhub-bi-ls-grocery", serviceId: "bnhub-svc-grocery" },
    { id: "bnhub-bi-ls-linen", serviceId: "bnhub-svc-linen-change" },
    { id: "bnhub-bi-ls-mid", serviceId: "bnhub-svc-mid-stay-cleaning" },
    { id: "bnhub-bi-ls-laundry", serviceId: "bnhub-svc-laundry" },
  ]);

  const welcomeId = "bnhub-bundle-welcome";
  await prisma.bnhubServiceBundle.upsert({
    where: { bundleCode: "welcome_bundle" },
    create: {
      id: welcomeId,
      bundleCode: "welcome_bundle",
      name: "Welcome bundle",
      description: "Breakfast, concierge welcome, meal delivery coordination.",
      targetSegment: "ARRIVAL",
      pricingType: "FIXED",
      basePriceCents: 6500,
      currency: "USD",
      isActive: true,
      visibilityScope: "PUBLIC",
    },
    update: { isActive: true, basePriceCents: 6500 },
  });
  await syncBundleItems(welcomeId, [
    { id: "bnhub-bi-welcome-breakfast", serviceId: "bnhub-svc-breakfast" },
    { id: "bnhub-bi-welcome-concierge", serviceId: "bnhub-svc-concierge" },
    { id: "bnhub-bi-welcome-meal", serviceId: "bnhub-svc-meal-delivery" },
  ]);

  await prisma.bnhubHospitalitySafetyRule.createMany({
    data: [
      {
        id: "bnhub-safety-block-premium-high-risk",
        ruleName: "block_premium_addons_high_trust_risk",
        scopeType: "GLOBAL",
        isEnabled: true,
        priority: 100,
        conditionsJson: { trustRiskAtLeast: "HIGH" },
        actionsJson: { blockPremiumCatalog: true },
      },
    ],
    skipDuplicates: true,
  });

  await prisma.bnhubTravelProduct.createMany({
    data: [
      {
        id: "bnhub-travel-placeholder-hotel",
        productType: "HOTEL",
        title: "Partner hotel inventory (placeholder)",
        status: "DRAFT",
      },
    ],
    skipDuplicates: true,
  });
}
