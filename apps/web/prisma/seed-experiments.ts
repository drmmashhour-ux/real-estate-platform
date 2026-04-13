import { prisma } from "../lib/db";

/**
 * Default A/B experiments (draft) — start from Admin → Experiments when ready.
 */
export async function seedDefaultExperiments(): Promise<void> {
  const defs = [
    {
      name: "BNHub listing primary CTA",
      slug: "bnhub-listing-cta-v1",
      targetSurface: "bnhub_listing_cta",
      primaryMetric: "cta_click",
      hypothesis: "Reserve-oriented copy may improve booking intent.",
      trafficSplitJson: { control: 0.5, b: 0.5 },
      variants: [
        { variantKey: "control", name: "Book now", configJson: { ctaText: "Book now" } },
        { variantKey: "b", name: "Reserve your stay", configJson: { ctaText: "Reserve your stay" } },
      ],
    },
    {
      name: "Listing trust line (Stripe)",
      slug: "bnhub-listing-trust-line-v1",
      targetSurface: "bnhub_listing_trust_line",
      primaryMetric: "listing_view",
      hypothesis: "Stripe reassurance may increase trust on the listing card.",
      trafficSplitJson: { control: 0.5, b: 0.5 },
      variants: [
        { variantKey: "control", name: "No extra line", configJson: { showTrustLine: false } },
        {
          variantKey: "b",
          name: "Stripe reassurance",
          configJson: { showTrustLine: true, trustLineText: "Secure payment via Stripe" },
        },
      ],
    },
    {
      name: "Homepage hero line",
      slug: "lecipm-home-hero-v1",
      targetSurface: "lecipm_home_hero",
      primaryMetric: "page_view",
      hypothesis: "Verified-listings framing may improve search engagement.",
      trafficSplitJson: { control: 0.5, b: 0.5 },
      variants: [
        {
          variantKey: "control",
          name: "Find your stay",
          configJson: { headline: "Find your stay, property, or investment" },
        },
        {
          variantKey: "b",
          name: "Verified Canada",
          configJson: { headline: "Search verified listings across Canada" },
        },
      ],
    },
  ] as const;

  for (const def of defs) {
    await prisma.experiment.upsert({
      where: { slug: def.slug },
      create: {
        name: def.name,
        slug: def.slug,
        status: "draft",
        targetSurface: def.targetSurface,
        hypothesis: def.hypothesis,
        primaryMetric: def.primaryMetric,
        trafficSplitJson: def.trafficSplitJson as object,
        variants: {
          create: def.variants.map((v) => ({
            variantKey: v.variantKey,
            name: v.name,
            configJson: v.configJson as object,
          })),
        },
      },
      update: {},
    });
  }

  console.log(`Seeded ${defs.length} experiment definition(s) (draft).`);
}
