import type { PrismaClient } from "@prisma/client";
import type { GrowthCitySlug } from "@/lib/growth/geo-slugs";
import { growthCityDisplayName, growthCityRegion } from "@/lib/growth/geo-slugs";

export type SeoGrowthPageKind = "buy" | "rent" | "investment";

export type SeoPageContentDraft = {
  blockBestProperties: string;
  blockTopInvestment: string;
  blockRentVsBuy: string;
  keywords: string[];
};

/**
 * Deterministic programmatic copy (no external LLM). Cron overwrites DB rows daily.
 */
export function generateSeoPageContentDraft(
  slug: GrowthCitySlug,
  pageKind: SeoGrowthPageKind
): SeoPageContentDraft {
  const cityDisplay = growthCityDisplayName(slug);
  const region = growthCityRegion(slug);
  const regionLabel = region === "US" ? "the United States" : "Canada";

  const best = `Best properties in ${cityDisplay} combine location, light, and realistic pricing for ${regionLabel}. Buyers often prioritize transit access, school catchments, and walkable amenities — patterns that also support stronger resale liquidity. On LECIPM you can browse FSBO homes and curated stays, then shortlist what fits your budget and timeline before you tour.`;

  const invest = `Top investment areas in ${cityDisplay} typically cluster near employment hubs, universities, and renewal corridors where rental demand stays steady. Look for balanced cap-ex risk: newer systems, transparent condo docs, and neighbourhoods with diversified employers. Use LECIPM deal tools alongside local professionals before you commit capital.`;

  const rentVs = `Rent vs buy in ${cityDisplay} depends on how long you plan to stay, mortgage rates, and local carrying costs. Renting preserves flexibility for job changes or travel-heavy seasons; buying builds equity when you hold through a full market cycle. Model both paths with a conservative maintenance buffer — especially for older housing stock in ${regionLabel}.`;

  const angle =
    pageKind === "buy"
      ? " Focus this month on resale listings and FSBO introductions with clear pricing history."
      : pageKind === "rent"
        ? " Short-term BNHUB inventory updates frequently — set alerts for your travel dates."
        : " Income-focused buyers should stress-test vacancy and interest-rate shocks on every scenario.";

  const keywords = [
    `best properties ${cityDisplay}`,
    `investment ${cityDisplay}`,
    `rent vs buy ${cityDisplay}`,
    pageKind === "rent" ? `short term rental ${cityDisplay}` : `real estate ${cityDisplay}`,
    "LECIPM",
  ];

  return {
    blockBestProperties: best + angle,
    blockTopInvestment:
      invest +
      (pageKind === "investment" ? " Review cash-on-cash and exit liquidity with a licensed advisor." : ""),
    blockRentVsBuy:
      rentVs +
      (pageKind === "buy" ? " Request a property consultation when you want a second opinion on offers." : ""),
    keywords,
  };
}

export async function generateAndPersistSeoPageContent(
  db: PrismaClient,
  citySlug: GrowthCitySlug,
  pageKind: SeoGrowthPageKind
) {
  const draft = generateSeoPageContentDraft(citySlug, pageKind);
  return db.seoPageContent.upsert({
    where: {
      citySlug_pageKind: { citySlug, pageKind },
    },
    create: {
      citySlug,
      pageKind,
      blockBestProperties: draft.blockBestProperties,
      blockTopInvestment: draft.blockTopInvestment,
      blockRentVsBuy: draft.blockRentVsBuy,
      keywords: draft.keywords,
    },
    update: {
      blockBestProperties: draft.blockBestProperties,
      blockTopInvestment: draft.blockTopInvestment,
      blockRentVsBuy: draft.blockRentVsBuy,
      keywords: draft.keywords,
      generatedAt: new Date(),
    },
  });
}

/** Refresh all programmatic rows for one city (buy + rent + investment). */
export async function refreshSeoContentForCity(db: PrismaClient, citySlug: GrowthCitySlug) {
  const kinds: SeoGrowthPageKind[] = ["buy", "rent", "investment"];
  await Promise.all(kinds.map((k) => generateAndPersistSeoPageContent(db, citySlug, k)));
}

function isoWeekKey(d: Date): string {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const year = t.getUTCFullYear();
  const week = Math.ceil(((t.getTime() - Date.UTC(year, 0, 1)) / 86400000 + 1) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

/**
 * Weekly indexable article linked to city hubs + sample listing discovery CTAs.
 */
export async function ensureWeeklyGrowthBlogPost(db: PrismaClient, citySlug: GrowthCitySlug) {
  const city = growthCityDisplayName(citySlug);
  const week = isoWeekKey(new Date());
  const slug = `growth-${citySlug}-market-${week}`;
  const title = `${city} real estate week of ${week.replace("-W", " W")} — what moved`;
  const excerpt = `Programmatic market snapshot for ${city}: inventory themes, rent vs buy notes, and where to browse on LECIPM.`;
  const body = [
    `This week we're tracking buyer and guest demand signals across ${city}.`,
    `Start on the city hub: /city/${citySlug} — then open Buy, Rent, or Investment guides for structured FAQs and listings.`,
    `Best properties: compare FSBO detail pages with BNHUB stays if you're weighing a purchase against flexible housing.`,
    `Investment: use the ROI calculator and deal analyzer from the blog footer before you underwrite.`,
    `Related: /city/${citySlug}/buy · /city/${citySlug}/rent · /city/${citySlug}/investment`,
  ].join("\n\n");

  const existing = await db.seoBlogPost.findUnique({ where: { slug } });
  if (existing) return { slug, created: false as const };

  await db.seoBlogPost.create({
    data: {
      slug,
      title,
      body,
      excerpt,
      city,
      keywords: [city, "market snapshot", "LECIPM", citySlug],
      publishedAt: new Date(),
    },
  });
  return { slug, created: true as const };
}
