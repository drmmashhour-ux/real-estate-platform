import { prisma } from "@/lib/db";
import type { MonitoringOwner } from "@/lib/monitoring/resolve-owner";
import { recordAuditEvent } from "@/modules/analytics/audit-log.service";
import { alertOnHighDealScore } from "@/lib/deal/alerts";
import { computeDealScore, classifyDeal } from "@/lib/deal/scoring";
import { markDealLowConfidence } from "@/lib/deal/safety";

const MONTHLY_EXPENSE_PLACEHOLDER_CENTS = 200_000;
const HEURISTIC_GROSS_YIELD_ANNUAL = 0.05;

/** Placeholder monthly operating cost assumption for illustration (not underwriting). */
function heuristicMonthlyRentCents(priceCents: number): number {
  return Math.max(0, Math.round((priceCents * HEURISTIC_GROSS_YIELD_ANNUAL) / 12));
}

function neighborhoodScoreFromMetrics(m: {
  rankingScore: number;
  trustScore: number;
  qualityScore: number;
} | null): number {
  if (!m) return 45;
  return (m.rankingScore + m.trustScore + m.qualityScore) / 3;
}

/**
 * Scores FSBO inventory (+ metrics). CRM `Listing` rows are not used here (no canonical address on that model).
 */
export async function generateDeals(owner: MonitoringOwner, actorUserId: string) {
  const listings = await prisma.fsboListing.findMany({
    where: {
      status: "ACTIVE",
      moderationStatus: "APPROVED",
      archivedAt: null,
    },
    include: { metrics: true },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  let upserted = 0;

  for (const l of listings) {
    const askingPriceCents = l.priceCents;
    if (!askingPriceCents || askingPriceCents <= 0) continue;

    const estimatedValueCents =
      l.metrics?.priceSuggestedCents && l.metrics.priceSuggestedCents > 0 ?
        l.metrics.priceSuggestedCents
      : Math.round(askingPriceCents * 1.1);

    const monthlyRentCents = heuristicMonthlyRentCents(askingPriceCents);

    const capRate = (monthlyRentCents * 12) / askingPriceCents;
    const roi = capRate;
    const cashflowCents = monthlyRentCents - MONTHLY_EXPENSE_PLACEHOLDER_CENTS;

    const undervaluationPct =
      estimatedValueCents > 0 ?
        ((estimatedValueCents - askingPriceCents) / estimatedValueCents) * 100
      : 0;

    const neighborhoodScore = neighborhoodScoreFromMetrics(l.metrics);

    const lowInfo = markDealLowConfidence(
      [
        !l.metrics ? "No listing metrics snapshot — scores use heuristics." : null,
        l.metrics?.priceSuggestedCents == null ? "No model suggested price — value uplift is placeholder." : null,
      ].filter((x): x is string => Boolean(x)),
    );

    const score = computeDealScore({
      price: askingPriceCents,
      value: estimatedValueCents,
      capRate,
      roi,
      cashflow: cashflowCents,
      neighborhoodScore,
    });

    const dealType = classifyDeal(score, undervaluationPct, capRate);
    const dealLabel = dealType;

    const row = await prisma.dealCandidate.upsert({
      where: {
        source_listingId: {
          source: "internal",
          listingId: l.id,
        },
      },
      create: {
        source: "internal",
        listingId: l.id,
        address: l.address,
        city: l.city,
        askingPriceCents,
        estimatedValueCents,
        monthlyRentCents,
        capRate,
        roiPercent: roi,
        cashflowCents,
        neighborhoodScore,
        investmentZone: l.region?.toLowerCase() ?? null,
        dealScore: score,
        dealLabel,
        dealType,
        lowConfidence: lowInfo.lowConfidence,
        highOpportunityAlerted: false,
      },
      update: {
        address: l.address,
        city: l.city,
        askingPriceCents,
        estimatedValueCents,
        monthlyRentCents,
        capRate,
        roiPercent: roi,
        cashflowCents,
        neighborhoodScore,
        investmentZone: l.region?.toLowerCase() ?? null,
        dealScore: score,
        dealLabel,
        dealType,
        lowConfidence: lowInfo.lowConfidence,
        ...(score < 80 ? { highOpportunityAlerted: false } : {}),
      },
    });

    upserted += 1;

    if (row.dealScore != null && row.dealScore > 80) {
      await alertOnHighDealScore(row.id, owner, actorUserId);
    }
  }

  await recordAuditEvent({
    actorUserId,
    action: "DEAL_FINDER_RUN",
    payload: { scanned: listings.length, upserted },
  });

  return { scanned: listings.length, upserted };
}
