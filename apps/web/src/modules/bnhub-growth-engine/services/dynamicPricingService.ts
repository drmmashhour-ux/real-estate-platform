import {
  BnhubPricingHistorySource,
  BnhubPricingScopeType,
  BnhubTrustRiskLevel,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  getAreaDemandSignals,
  getBookingPerformanceSignal,
  getInquiryToBookingRatio,
  getLeadVolumeSignal,
  getSeasonalSignal,
  getEventSignalPlaceholder,
} from "./marketSignalService";
import { logPricingDecision } from "./trustAuditService";

const D = (n: number) => new Prisma.Decimal(Math.round(n * 100) / 100);

export function computeBasePrice(nightPriceCents: number): Prisma.Decimal {
  return D(nightPriceCents / 100);
}

export function applyWeekdayWeekendAdjustments(base: Prisma.Decimal, city: string): {
  weekday: Prisma.Decimal;
  weekend: Prisma.Decimal;
  appliedWeekendMult: number;
} {
  const leisure = /montreal|laval|quebec|miami|orlando/i.test(city);
  const appliedWeekendMult = leisure ? 1.08 : 1.05;
  return {
    weekday: D(Number(base) * 0.99),
    weekend: D(Number(base) * appliedWeekendMult),
    appliedWeekendMult,
  };
}

export async function applySeasonalAdjustments(_listingId: string, city: string): Promise<Prisma.Decimal> {
  const s = getSeasonalSignal(_listingId, city);
  return D(s.multiplier);
}

export async function applyDemandAdjustments(listingId: string, city: string): Promise<Prisma.Decimal> {
  const area = await getAreaDemandSignals(city);
  const leads = await getLeadVolumeSignal(listingId);
  const ratio = await getInquiryToBookingRatio(listingId);
  let mult = 1 + (area.demandIndex - 50) / 500;
  if (leads.leadCount30d > 5) mult += 0.02;
  if (ratio.ratio != null && ratio.ratio > 0.35) mult += 0.03;
  if (ratio.ratio != null && ratio.ratio < 0.05) mult -= 0.04;
  return D(Math.max(0.92, Math.min(1.12, mult)));
}

export function applyQualityAdjustments(starRating: number, overallClassification: number): Prisma.Decimal {
  const bump = (starRating - 3) * 0.012 + (overallClassification - 60) / 2000;
  return D(1 + Math.max(-0.06, Math.min(0.08, bump)));
}

export function applyLuxuryAdjustments(tierCode: string | null | undefined): Prisma.Decimal {
  if (tierCode === "PREMIUM") return D(1.04);
  if (tierCode === "ELITE") return D(1.07);
  if (tierCode === "VERIFIED") return D(1.02);
  return D(1);
}

export function applyTrustAdjustments(trustScore: number, riskLevel: string): Prisma.Decimal {
  if (riskLevel === "CRITICAL" || riskLevel === "HIGH") return D(0.92);
  if (trustScore < 45) return D(0.95);
  if (trustScore > 80) return D(1.03);
  return D(1);
}

export async function applyMarketAdjustments(listingId: string, city: string): Promise<Prisma.Decimal> {
  const evt = getEventSignalPlaceholder(city);
  const perf = await getBookingPerformanceSignal(listingId);
  let m = evt.multiplier;
  if (perf.bookingCount12m > 8) m += 0.02;
  return D(Math.min(1.1, m));
}

export function applyGuardrails(
  recommended: Prisma.Decimal,
  minP: Prisma.Decimal,
  maxP: Prisma.Decimal
): Prisma.Decimal {
  const r = Number(recommended);
  const lo = Number(minP);
  const hi = Number(maxP);
  return D(Math.max(lo, Math.min(hi, r)));
}

export async function computeRecommendedPrice(listingId: string): Promise<{
  base: Prisma.Decimal;
  recommended: Prisma.Decimal;
  minPrice: Prisma.Decimal;
  maxPrice: Prisma.Decimal;
  adjustments: Record<string, number | string>;
  confidenceScore: number;
}> {
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: {
      nightPriceCents: true,
      city: true,
      ownerId: true,
    },
  });
  if (!listing) throw new Error("Listing not found");

  const [classification, trust, tier] = await Promise.all([
    prisma.bnhubPropertyClassification.findUnique({ where: { listingId } }),
    prisma.bnhubTrustProfile.findUnique({ where: { listingId } }),
    prisma.bnhubLuxuryTier.findUnique({ where: { listingId } }),
  ]);

  const base = computeBasePrice(listing.nightPriceCents);
  const { appliedWeekendMult } = applyWeekdayWeekendAdjustments(base, listing.city);
  const seasonalM = await applySeasonalAdjustments(listingId, listing.city);
  const demandM = await applyDemandAdjustments(listingId, listing.city);
  const qualityM = applyQualityAdjustments(classification?.starRating ?? 3, classification?.overallScore ?? 50);
  const luxuryM = applyLuxuryAdjustments(tier?.tierCode);
  const trustM = applyTrustAdjustments(trust?.trustScore ?? 50, trust?.overallRiskLevel ?? "LOW");
  const marketM = await applyMarketAdjustments(listingId, listing.city);

  let recommended = Number(base);
  recommended *= appliedWeekendMult * 0.985;
  recommended *= Number(seasonalM);
  recommended *= Number(demandM);
  recommended *= Number(qualityM);
  recommended *= Number(luxuryM);
  recommended *= Number(trustM);
  recommended *= Number(marketM);

  const minPrice = D(Math.max(5, Number(base) * 0.65));
  const maxPrice = D(Number(base) * 1.55);
  let rec = applyGuardrails(D(recommended), minPrice, maxPrice);

  const rules = await prisma.bnhubPricingRule.findMany({
    where: { isEnabled: true, scopeType: { in: [BnhubPricingScopeType.GLOBAL, BnhubPricingScopeType.CITY] } },
    orderBy: { priority: "desc" },
    take: 20,
  });
  for (const rule of rules) {
    if (rule.ruleType === "MIN_GUARDRAIL") {
      const floor = Number((rule.actionsJson as { minUsd?: number } | null)?.minUsd ?? 0);
      if (floor > 0 && Number(rec) < floor) rec = D(floor);
    }
    if (rule.ruleType === "MAX_GUARDRAIL") {
      const cap = Number((rule.actionsJson as { maxUsd?: number } | null)?.maxUsd ?? 0);
      if (cap > 0 && Number(rec) > cap) rec = D(cap);
    }
    if (rule.ruleType === "FRAUD_LOCK" && (trust?.overallRiskLevel === "HIGH" || trust?.overallRiskLevel === "CRITICAL")) {
      rec = base;
    }
  }

  const confidenceScore = Math.round(
    50 +
      (classification ? 15 : 0) +
      (trust && trust.overallRiskLevel === "LOW" ? 20 : 5) +
      (tier && tier.tierCode !== "NONE" ? 10 : 0)
  );

  return {
    base,
    recommended: rec,
    minPrice,
    maxPrice,
    adjustments: {
      weekendMult: appliedWeekendMult,
      seasonal: Number(seasonalM),
      demand: Number(demandM),
      quality: Number(qualityM),
      luxury: Number(luxuryM),
      trust: Number(trustM),
      market: Number(marketM),
    },
    confidenceScore: Math.min(100, confidenceScore),
  };
}

export async function upsertDynamicPricingProfile(listingId: string): Promise<void> {
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: { nightPriceCents: true, city: true, ownerId: true },
  });
  if (!listing) return;

  const { base, recommended, minPrice, maxPrice, adjustments, confidenceScore } =
    await computeRecommendedPrice(listingId);
  const ww = applyWeekdayWeekendAdjustments(base, listing.city);

  const explanation = {
    label: "BNHub dynamic pricing (AI-assisted recommendation)",
    adjustments,
    note: "Recommendation is informational unless autopricing is explicitly enabled by policy.",
  };

  await prisma.bnhubDynamicPricingProfile.upsert({
    where: { listingId },
    create: {
      listingId,
      basePrice: base,
      recommendedPrice: recommended,
      minPrice,
      maxPrice,
      weekdayAdjustment: D(Number(ww.weekday) - Number(base)),
      weekendAdjustment: D(Number(ww.weekend) - Number(base)),
      seasonalAdjustment: D((adjustments.seasonal as number) - 1),
      demandAdjustment: D((adjustments.demand as number) - 1),
      qualityAdjustment: D((adjustments.quality as number) - 1),
      luxuryAdjustment: D((adjustments.luxury as number) - 1),
      trustAdjustment: D((adjustments.trust as number) - 1),
      marketAdjustment: D((adjustments.market as number) - 1),
      confidenceScore,
      explanationJson: explanation,
    },
    update: {
      basePrice: base,
      recommendedPrice: recommended,
      minPrice,
      maxPrice,
      weekdayAdjustment: D(Number(ww.weekday) - Number(base)),
      weekendAdjustment: D(Number(ww.weekend) - Number(base)),
      seasonalAdjustment: D((adjustments.seasonal as number) - 1),
      demandAdjustment: D((adjustments.demand as number) - 1),
      qualityAdjustment: D((adjustments.quality as number) - 1),
      luxuryAdjustment: D((adjustments.luxury as number) - 1),
      trustAdjustment: D((adjustments.trust as number) - 1),
      marketAdjustment: D((adjustments.market as number) - 1),
      confidenceScore,
      explanationJson: explanation,
      computedAt: new Date(),
    },
  });

  await logPricingDecision(listingId, listing.ownerId, {
    recommendedUsd: Number(recommended),
    confidenceScore,
  });
}

export async function recordPricingHistory(input: {
  listingId: string;
  previousPrice: Prisma.Decimal;
  recommendedPrice: Prisma.Decimal;
  appliedPrice?: Prisma.Decimal | null;
  reasonSummary: string;
  factorsJson?: object;
  sourceType: BnhubPricingHistorySource;
}): Promise<void> {
  await prisma.bnhubPricingHistory.create({
    data: {
      listingId: input.listingId,
      previousPrice: input.previousPrice,
      recommendedPrice: input.recommendedPrice,
      appliedPrice: input.appliedPrice ?? null,
      reasonSummary: input.reasonSummary,
      factorsJson: input.factorsJson ?? {},
      sourceType: input.sourceType,
    },
  });
}

export async function getPricingRecommendation(listingId: string) {
  return prisma.bnhubDynamicPricingProfile.findUnique({ where: { listingId } });
}

export async function applyRecommendedPriceIfAutopricingEnabled(listingId: string): Promise<{ applied: boolean; reason: string }> {
  if (process.env.BNHUB_AUTOPRICING_AUTO_APPLY !== "true") {
    return { applied: false, reason: "Autoprice apply disabled (set BNHUB_AUTOPRICING_AUTO_APPLY=true to allow)." };
  }
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: { nightPriceCents: true },
  });
  const prof = await getPricingRecommendation(listingId);
  const trust = await prisma.bnhubTrustProfile.findUnique({
    where: { listingId },
    select: { overallRiskLevel: true },
  });
  if (
    trust?.overallRiskLevel === BnhubTrustRiskLevel.HIGH ||
    trust?.overallRiskLevel === BnhubTrustRiskLevel.CRITICAL
  ) {
    return { applied: false, reason: "Autoprice apply blocked for elevated trust risk on this listing." };
  }
  if (!listing || !prof) return { applied: false, reason: "Missing listing or profile." };
  const prev = D(listing.nightPriceCents / 100);
  const nextCents = Math.round(Number(prof.recommendedPrice) * 100);
  await prisma.shortTermListing.update({
    where: { id: listingId },
    data: { nightPriceCents: nextCents },
  });
  await recordPricingHistory({
    listingId,
    previousPrice: prev,
    recommendedPrice: prof.recommendedPrice,
    appliedPrice: prof.recommendedPrice,
    reasonSummary: "Autopricing apply (env-gated)",
    sourceType: BnhubPricingHistorySource.SYSTEM,
  });
  return { applied: true, reason: "Updated nightPriceCents from recommendation." };
}

export async function refreshDynamicPricingForListing(listingId: string): Promise<void> {
  const before = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: { nightPriceCents: true },
  });
  if (!before) return;
  const prevDec = D(before.nightPriceCents / 100);
  await upsertDynamicPricingProfile(listingId);
  const prof = await getPricingRecommendation(listingId);
  if (!prof) return;
  await recordPricingHistory({
    listingId,
    previousPrice: prevDec,
    recommendedPrice: prof.recommendedPrice,
    appliedPrice: null,
    reasonSummary: "Recomputed pricing recommendation",
    factorsJson: prof.explanationJson as object,
    sourceType: BnhubPricingHistorySource.SYSTEM,
  });
}
