import { prisma } from "@/lib/db";
import { revenueV4Flags } from "@/config/feature-flags";
import { MIN_COMPARABLE_LISTINGS } from "@/src/modules/revenue/revenue.constants";
import { computeRecommendedPrice } from "@/src/modules/bnhub-growth-engine/services/dynamicPricingService";
import type { FsboPricingSignals } from "./pricing.signals";
import { loadFsboPricingSignalsExtended } from "./pricing.signals";
import { optimizeFsboListPrice } from "./pricing.optimizer";
import { calculatePriceCompetitiveness } from "./pricing.competitiveness";
import { loadStrPeerNightStats } from "./pricing-v2.str";
import { expectedImpactBnhub, expectedImpactFsbo } from "./pricing-v2.explainer";
import { STALE_LISTING_DAYS } from "@/src/modules/revenue/revenue.constants";
import type { PriceScenarioV2, RecommendPriceV2Input, RecommendPriceV2Result } from "./pricing-v2.types";

function daysSince(d: Date): number {
  return (Date.now() - d.getTime()) / 86400000;
}

/** Limits single-step suggested moves vs current list to avoid volatile swings when confidence is medium/low. */
function clampRecommendedMove(currentCents: number, targetCents: number, maxFraction: number): number {
  if (currentCents <= 0) return targetCents;
  const maxAbs = Math.round(currentCents * maxFraction);
  const delta = targetCents - currentCents;
  if (Math.abs(delta) <= maxAbs) return targetCents;
  return currentCents + Math.sign(delta) * maxAbs;
}

function scenarioTriplet(
  baseCents: number,
  bandCents: number,
  lowConfidence: boolean,
): { conservative: PriceScenarioV2; balanced: PriceScenarioV2; aggressive: PriceScenarioV2 } {
  const bal = Math.round(baseCents);
  const minB = Math.max(1000, bal - bandCents);
  const maxB = bal + bandCents;
  if (lowConfidence) {
    const cur = bal;
    const tight = Math.max(500, Math.round(bandCents * 0.5));
    const minP = Math.max(10, (cur - tight) / 100);
    const maxP = (cur + tight) / 100;
    const rec = cur / 100;
    return {
      conservative: { key: "conservative", label: "Hold (tight band)", recommendedPrice: rec, minPrice: minP, maxPrice: maxP },
      balanced: { key: "balanced", label: "Hold / verify comps", recommendedPrice: rec, minPrice: minP, maxPrice: maxP },
      aggressive: { key: "aggressive", label: "Hold (wider exploratory band)", recommendedPrice: rec, minPrice: minP, maxPrice: maxP },
    };
  }
  const cons = Math.round(baseCents * 0.98);
  const agg = Math.round(baseCents * 1.03);
  return {
    conservative: {
      key: "conservative",
      label: "Conservative",
      recommendedPrice: cons / 100,
      minPrice: Math.max(10, (cons - bandCents) / 100),
      maxPrice: (cons + bandCents) / 100,
    },
    balanced: {
      key: "balanced",
      label: "Balanced",
      recommendedPrice: bal / 100,
      minPrice: minB / 100,
      maxPrice: maxB / 100,
    },
    aggressive: {
      key: "aggressive",
      label: "Aggressive",
      recommendedPrice: agg / 100,
      minPrice: Math.max(10, (agg - bandCents) / 100),
      maxPrice: (agg + bandCents) / 100,
    },
  };
}

async function buildFsboV2(listingId: string): Promise<RecommendPriceV2Result> {
  const ext = await loadFsboPricingSignalsExtended(listingId);
  if (!ext) {
    throw new Error("FSBO listing not found");
  }

  const metrics = await prisma.fsboListingMetrics.findUnique({
    where: { fsboListingId: listingId },
  });

  const rec = optimizeFsboListPrice(ext as FsboPricingSignals);
  const comp = calculatePriceCompetitiveness(
    { priceCents: ext.priceCents },
    ext.peerPricesCents.map((priceCents) => ({ priceCents })),
  );

  const lowConfidence = rec.lowConfidence || ext.peerSampleSize < MIN_COMPARABLE_LISTINGS;
  const thinPeers = ext.peerSampleSize < MIN_COMPARABLE_LISTINGS;
  const preserveCurrentPrice = lowConfidence && (rec.confidence < 0.4 || thinPeers);
  const stale = daysSince(ext.updatedAt) > STALE_LISTING_DAYS;

  const band = Math.max(5000, Math.round(ext.priceCents * 0.04));
  let recCents = preserveCurrentPrice ? ext.priceCents : rec.recommendedPriceCents;
  if (!preserveCurrentPrice) {
    let maxFrac = rec.confidence >= 0.58 ? 0.12 : rec.confidence >= 0.48 ? 0.09 : 0.07;
    if (stale && !thinPeers) maxFrac *= 0.88;
    recCents = clampRecommendedMove(ext.priceCents, recCents, maxFrac);
  }

  const demandStrengthScore = Math.min(
    100,
    Math.round(
      Math.min(100, (metrics?.engagementScore ?? 40) + (ext.viewCount > 40 ? 8 : 0) + ext.leadCount * 3),
    ),
  );
  const listingStrengthScore = metrics
    ? Math.round((metrics.qualityScore + metrics.trustScore + (metrics.conversionScore ?? 50)) / 3)
    : Math.min(85, 45 + Math.min(20, ext.photoCount * 2));

  const warnings: string[] = [];
  if (lowConfidence) warnings.push("Comparable sample is thin — use a valuation professional before major changes.");
  if (ext.viewCount > 50 && ext.leadCount === 0) warnings.push("High views with no leads — review price, photos, and trust signals.");

  const marketMedian = ext.medianPeerPriceCents != null ? ext.medianPeerPriceCents / 100 : null;
  const marketP25 = ext.p25PeerPriceCents != null ? ext.p25PeerPriceCents / 100 : null;
  const marketP75 = ext.p75PeerPriceCents != null ? ext.p75PeerPriceCents / 100 : null;

  return {
    listingType: "fsbo",
    currencyHint: "CAD",
    recommendedPrice: recCents / 100,
    minPrice: preserveCurrentPrice ? ext.priceCents / 100 : rec.priceRangeCents.min / 100,
    maxPrice: preserveCurrentPrice ? ext.priceCents / 100 : rec.priceRangeCents.max / 100,
    confidence: preserveCurrentPrice ? Math.min(rec.confidence, 0.35) : rec.confidence,
    comparableCount: ext.peerSampleSize,
    marketMedian,
    marketP25,
    marketP75,
    expectedImpact: expectedImpactFsbo(lowConfidence),
    scores: {
      priceCompetitivenessScore: comp.lowConfidence ? 55 : comp.score0to100,
      demandStrengthScore,
      listingStrengthScore,
    },
    scenarios: scenarioTriplet(recCents, band, preserveCurrentPrice),
    reasoning: [
      ...rec.reasoning,
      preserveCurrentPrice ? "Preserving current list price until confidence improves." : "",
      stale && !thinPeers
        ? "Listing is stale (45d+) with peer sample — single-step move capped tighter vs fresh listings."
        : "",
    ].filter(Boolean),
    warnings,
    lowConfidence,
    preserveCurrentPrice,
    currentPrice: ext.priceCents / 100,
  };
}

async function buildBnhubV2(listingId: string): Promise<RecommendPriceV2Result> {
  const str = await loadStrPeerNightStats(listingId);
  if (!str) throw new Error("BNHub listing not found");

  const row = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: { nightPriceCents: true, currency: true, city: true },
  });
  if (!row) throw new Error("BNHub listing not found");

  let recommendedCents = str.nightPriceCents;
  let confidence = 0.35;
  let reasoning: string[] = [
    `Internal STR peer sample in ${str.city}: n=${str.peerSampleSize} (published listings).`,
  ];
  let lowConfidence = str.peerSampleSize < MIN_COMPARABLE_LISTINGS;
  let usedDynamic = false;

  if (revenueV4Flags.bnhubDynamicPricingV1) {
    try {
      const dyn = await computeRecommendedPrice(listingId);
      recommendedCents = Math.round(Number(dyn.recommended) * 100);
      confidence = Math.min(0.92, Math.max(0.25, dyn.confidenceScore / 100));
      reasoning.push("Blended with BNHub dynamic pricing pipeline (internal signals only).");
      lowConfidence = dyn.confidenceScore < 52;
      usedDynamic = true;
    } catch {
      reasoning.push("Dynamic pricing unavailable — peer-band fallback only.");
    }
  } else if (str.medianPeerCents && str.medianPeerCents > 0) {
    const ratio = str.nightPriceCents / str.medianPeerCents;
    reasoning.push(`Your nightly / peer median ratio ≈ ${ratio.toFixed(2)}.`);
    if (ratio > 1.15) reasoning.push("Above peer cluster — consider testing a modest decrease if occupancy is soft.");
    else if (ratio < 0.88) reasoning.push("Below peer cluster — room to test increases if demand supports it.");
    confidence = str.peerSampleSize >= MIN_COMPARABLE_LISTINGS ? 0.55 : 0.28;
  }

  const preserveCurrentPrice = lowConfidence && str.peerSampleSize < MIN_COMPARABLE_LISTINGS;
  let recCents = preserveCurrentPrice ? str.nightPriceCents : recommendedCents;
  if (!preserveCurrentPrice && usedDynamic) {
    const maxFrac = confidence >= 0.58 ? 0.12 : 0.08;
    recCents = clampRecommendedMove(str.nightPriceCents, recCents, maxFrac);
    if (recCents !== recommendedCents) {
      reasoning.push("Suggested nightly rate smoothed vs current publish price to avoid abrupt swings.");
    }
  }
  const band = Math.max(500, Math.round(str.nightPriceCents * 0.06));

  const marketMedian = str.medianPeerCents != null ? str.medianPeerCents / 100 : null;
  const marketP25 = str.p25Cents != null ? str.p25Cents / 100 : null;
  const marketP75 = str.p75Cents != null ? str.p75Cents / 100 : null;

  const ratioForComp =
    str.medianPeerCents && str.medianPeerCents > 0 ? str.nightPriceCents / str.medianPeerCents : 1;
  const priceCompetitivenessScore = Math.round(Math.max(0, 100 - Math.min(100, Math.abs(Math.log(ratioForComp)) * 80)));

  const warnings: string[] = [];
  if (lowConfidence) warnings.push("Few published peers in this city sample — treat nightly suggestion as exploratory.");

  return {
    listingType: "bnhub",
    currencyHint: row.currency || "CAD",
    recommendedPrice: recCents / 100,
    minPrice: preserveCurrentPrice ? str.nightPriceCents / 100 : Math.max(10, (recCents - band) / 100),
    maxPrice: preserveCurrentPrice ? str.nightPriceCents / 100 : (recCents + band) / 100,
    confidence: preserveCurrentPrice ? Math.min(confidence, 0.32) : confidence,
    comparableCount: str.peerSampleSize,
    marketMedian,
    marketP25,
    marketP75,
    expectedImpact: expectedImpactBnhub(lowConfidence),
    scores: {
      priceCompetitivenessScore,
      demandStrengthScore: Math.min(100, 50 + Math.min(30, str.completedStays)),
      listingStrengthScore: Math.min(100, 55 + (str.completedStays > 5 ? 15 : 0)),
    },
    scenarios: scenarioTriplet(recCents, band, preserveCurrentPrice),
    reasoning,
    warnings,
    lowConfidence,
    preserveCurrentPrice,
    currentPrice: str.nightPriceCents / 100,
  };
}

/**
 * Unified v2 recommendation — FSBO list price or BNHub nightly (major units).
 * Does not write listing prices. Optional snapshot for analytics.
 */
export async function recommendPriceV2(
  input: RecommendPriceV2Input,
  opts?: { persistSnapshot?: boolean; leadId?: string | null },
): Promise<RecommendPriceV2Result | null> {
  if (!revenueV4Flags.pricingEngineV2) return null;

  const result =
    input.listingType === "fsbo" ? await buildFsboV2(input.listingId) : await buildBnhubV2(input.listingId);

  if (opts?.persistSnapshot && result) {
    const listingId = input.listingType === "fsbo" ? input.listingId : null;
    void prisma.pricingInsightSnapshot
      .create({
        data: {
          listingId,
          leadId: opts.leadId ?? null,
          input: { ...input } as object,
          output: result as unknown as object,
        },
      })
      .catch(() => {});
  }

  return result;
}
