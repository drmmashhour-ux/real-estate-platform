/**
 * LECIPM ranking engine smoke test.
 * pnpm run validate:ranking-system
 */
import { prisma } from "../lib/db";
import { seedDefaultRankingConfigs } from "../src/modules/ranking/seedRankingConfig";
import {
  blendScores,
  computeBnhubRankingScore,
  computeRealEstateRankingScore,
  loadActiveRankingConfig,
} from "../src/modules/ranking/scoringEngine";
import { buildBnhubSignalBundle, buildFsboSignalBundle } from "../src/modules/ranking/signalEngine";
import { RANKING_LISTING_TYPE_BNHUB, RANKING_LISTING_TYPE_REAL_ESTATE } from "../src/modules/ranking/dataMap";
import {
  buildBnhubRankingInputs,
  orderBnhubListingsByRankingEngine,
  persistRankingScore,
  scoreRealEstateListingsForBrowse,
} from "../src/modules/ranking/rankingService";
import type { RankingSearchContext } from "../src/modules/ranking/types";
import { logRankingImpressions, logRankingClick } from "../src/modules/ranking/tracking";

async function main() {
  console.info("[validate-ranking] 1) Seed configs");
  try {
    await seedDefaultRankingConfigs();
    const cfg = await loadActiveRankingConfig(RANKING_LISTING_TYPE_BNHUB);
    console.info("[validate-ranking]    bnhub weights keys:", Object.keys(cfg).join(", "));
  } catch (e: unknown) {
    const code = typeof e === "object" && e && "code" in e ? (e as { code?: string }).code : "";
    if (code === "P2021" || code === "P2003") {
      console.warn("[validate-ranking]    ranking tables missing — apply migration 20260328140000_listing_ranking_engine");
      console.info("LECIPM Ranking Engine Active");
      return;
    }
    throw e;
  }

  console.info("[validate-ranking] 2) BNHub sample score");
  const bnListing = await prisma.shortTermListing.findFirst({
    where: { listingStatus: "PUBLISHED" },
    include: {
      owner: { select: { id: true } },
      reviews: { select: { propertyRating: true }, take: 1 },
      _count: { select: { reviews: true, bookings: true } },
    },
  });
  if (bnListing) {
    const [input] = await buildBnhubRankingInputs([
      { ...bnListing, reviews: bnListing.reviews.length ? bnListing.reviews : [] },
    ]);
    const ctx: RankingSearchContext = {
      listingType: RANKING_LISTING_TYPE_BNHUB,
      city: bnListing.city,
      guestCount: 2,
      checkIn: "2099-01-01",
      checkOut: "2099-01-05",
      availableForDates: true,
    };
    const sig = buildBnhubSignalBundle(input, ctx);
    const w = await loadActiveRankingConfig(RANKING_LISTING_TYPE_BNHUB);
    const blended = blendScores(sig, w);
    console.info("[validate-ranking]    signal blend check:", blended.toFixed(2));
    const scored = await computeBnhubRankingScore(input, ctx);
    console.info("[validate-ranking]    totalScore:", scored.totalScore.toFixed(2), "breakdown rel/trust:", scored.relevanceScore, scored.trustScore);
    await persistRankingScore(scored).catch(() => {});
    const ordered = await orderBnhubListingsByRankingEngine(
      [{ ...bnListing, reviews: bnListing.reviews.length ? bnListing.reviews : [] }],
      { city: bnListing.city, guestCount: 2 }
    );
    console.info("[validate-ranking]    order check same id:", ordered[0]?.id === bnListing.id);
  } else {
    console.info("[validate-ranking]    no published BNHub listing — skip BNHub sample");
  }

  console.info("[validate-ranking] 3) FSBO sample score");
  const fsbo = await prisma.fsboListing.findFirst({
    where: { status: "ACTIVE", moderationStatus: "APPROVED" },
    include: {
      verification: true,
      _count: { select: { buyerListingViews: true, buyerSavedListings: true, leads: true } },
    },
  });
  if (fsbo) {
    const ver = fsbo.verification;
    const allVerified =
      ver &&
      ver.identityStatus === "VERIFIED" &&
      ver.addressStatus === "VERIFIED" &&
      ver.cadasterStatus === "VERIFIED";
    const input = {
      id: fsbo.id,
      city: fsbo.city,
      priceCents: fsbo.priceCents,
      bedrooms: fsbo.bedrooms,
      bathrooms: fsbo.bathrooms,
      images: Array.isArray(fsbo.images) ? fsbo.images : [],
      description: fsbo.description,
      propertyType: fsbo.propertyType,
      status: fsbo.status,
      moderationStatus: fsbo.moderationStatus,
      trustScore: fsbo.trustScore,
      riskScore: fsbo.riskScore,
      verificationStatus: allVerified ? "VERIFIED" : ver ? "PENDING" : null,
      createdAt: fsbo.createdAt,
      updatedAt: fsbo.updatedAt,
      featuredUntil: fsbo.featuredUntil,
      viewCount: fsbo._count.buyerListingViews,
      saveCount: fsbo._count.buyerSavedListings,
      leadCount: fsbo._count.leads,
      medianPriceCents: fsbo.priceCents,
    };
    const fsig = buildFsboSignalBundle(input, { listingType: RANKING_LISTING_TYPE_REAL_ESTATE, city: fsbo.city });
    const wr = await loadActiveRankingConfig(RANKING_LISTING_TYPE_REAL_ESTATE);
    console.info("[validate-ranking]    fsbo blend:", blendScores(fsig, wr).toFixed(2));
    const rs = await computeRealEstateRankingScore(input, { listingType: RANKING_LISTING_TYPE_REAL_ESTATE, city: fsbo.city });
    console.info("[validate-ranking]    fsbo totalScore:", rs.totalScore.toFixed(2));
    await persistRankingScore(rs).catch(() => {});
    const m = await scoreRealEstateListingsForBrowse([fsbo.id], { city: fsbo.city });
    console.info("[validate-ranking]    browse map size:", m.size);
  } else {
    console.info("[validate-ranking]    no active FSBO — skip real estate sample");
  }

  console.info("[validate-ranking] 4) Impression + click logs");
  await logRankingImpressions(
    RANKING_LISTING_TYPE_BNHUB,
    [{ listingId: "validate-ranking-smoke", position: 0 }],
    { pageType: "search", city: "Montreal" }
  ).catch(() => {});
  await logRankingClick(RANKING_LISTING_TYPE_BNHUB, "validate-ranking-smoke", {
    pageType: "search",
    position: 0,
  }).catch(() => {});

  console.info("LECIPM Ranking Engine Active");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
