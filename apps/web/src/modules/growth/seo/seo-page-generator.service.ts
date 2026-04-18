import { prisma } from "@/lib/db";
import { engineFlags } from "@/config/feature-flags";
import { buildSeoDraftTemplate } from "./seo-page-template.service";
import { computeSeoPageScores } from "./seo-page-quality.service";

/**
 * Builds a reviewable draft from DB facts only (counts, prices, photos — no trend claims).
 */
export async function generateSeoDraftForOpportunity(seoPageOpportunityId: string): Promise<{ draftId: string } | null> {
  if (!engineFlags.seoDraftGenerationV2 && !engineFlags.seoPageGeneratorV2) return null;

  const opp = await prisma.seoPageOpportunity.findUnique({ where: { id: seoPageOpportunityId } });
  if (!opp) return null;

  const listings = await prisma.fsboListing.findMany({
    where: {
      city: { equals: opp.city ?? "", mode: "insensitive" },
      status: "ACTIVE",
      moderationStatus: "APPROVED",
      ...(opp.propertyType
        ? { propertyType: { equals: opp.propertyType, mode: "insensitive" } }
        : {}),
    },
    take: 24,
    select: {
      id: true,
      title: true,
      priceCents: true,
      city: true,
      images: true,
      updatedAt: true,
      propertyType: true,
    },
  });

  const now = Date.now();
  const ages = listings.map((l) => (now - l.updatedAt.getTime()) / 86400000);
  const medianAgeDays = ages.length ? [...ages].sort((a, b) => a - b)[Math.floor(ages.length / 2)]! : 0;
  const types = new Set(listings.map((l) => (l.propertyType ?? "").toLowerCase()).filter(Boolean));
  const avgImages =
    listings.length > 0
      ? listings.reduce((s, l) => s + (Array.isArray(l.images) ? l.images.length : 0), 0) / listings.length
      : 0;

  const scores = computeSeoPageScores({
    inventoryCount: listings.length,
    distinctPropertyTypes: types.size,
    medianAgeDays,
    avgImageCount: avgImages,
    duplicateSlugCount: 0,
  });

  const deal =
    (opp.metadataJson as { listingDealType?: string } | null)?.listingDealType?.toLowerCase() === "rent"
      ? "rent"
      : "sale";
  const tpl = buildSeoDraftTemplate({
    city: opp.city ?? "Market",
    pageFamily: opp.pageFamily ?? opp.pageType,
    transactionLabel: deal === "rent" ? "rent" : "sale",
    propertyTypeLabel: opp.propertyType,
  });

  const contentJson = {
    version: 2,
    keyStats: {
      activeListingsSampled: listings.length,
      medianListingAgeDays: Math.round(medianAgeDays),
      propertyTypesObserved: [...types].slice(0, 12),
    },
    featuredListings: listings.slice(0, 8).map((l) => ({
      id: l.id,
      title: l.title,
      priceCents: l.priceCents,
      imageCount: Array.isArray(l.images) ? l.images.length : 0,
    })),
    faqCandidates: [
      {
        q: `How many listings are in ${opp.city}?`,
        a: `We currently sample ${listings.length} active listings in this view; counts change as inventory updates.`,
      },
    ],
    internalLinkSuggestions: [`/listings`, `/city/${encodeURIComponent((opp.city ?? "").toLowerCase())}`],
    scores,
  };

  const draft = await prisma.seoPageDraft.upsert({
    where: { seoPageOpportunityId: opp.id },
    create: {
      seoPageOpportunityId: opp.id,
      draftStatus: "awaiting_review",
      publishStatus: "not_published",
      title: tpl.title,
      metaTitle: tpl.metaTitle,
      metaDescription: tpl.metaDescription,
      canonicalSlug: opp.slug,
      contentJson,
      lastGeneratedAt: new Date(),
    },
    update: {
      draftStatus: "awaiting_review",
      title: tpl.title,
      metaTitle: tpl.metaTitle,
      metaDescription: tpl.metaDescription,
      canonicalSlug: opp.slug,
      contentJson,
      lastGeneratedAt: new Date(),
    },
  });

  await prisma.seoPageOpportunity.update({
    where: { id: opp.id },
    data: {
      seoScoresJson: scores as object,
      opportunityScore: scores.overallSeoOpportunityScore,
      lastEvaluatedAt: new Date(),
      status: "draft_ready",
    },
  });

  return { draftId: draft.id };
}
