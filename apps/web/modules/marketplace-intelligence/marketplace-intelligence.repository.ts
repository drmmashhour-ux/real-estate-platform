import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logWarn } from "@/lib/logger";
import type {
  FraudSignal,
  ListingQualityScore,
  ListingTrustScore,
  MarketplaceDecision,
  MarketplaceRankingScore,
  PricingRecommendation,
} from "./marketplace-intelligence.types";

export type PersistWarning = { step: string; message: string };

function rowToQuality(row: {
  listingId: string;
  score: number;
  confidence: number;
  factors: Prisma.JsonValue;
  warnings: Prisma.JsonValue;
  createdAt: Date;
}): ListingQualityScore {
  return {
    listingId: row.listingId,
    score: row.score,
    confidence: row.confidence,
    factors: Array.isArray(row.factors) ? (row.factors as string[]) : [],
    warnings: Array.isArray(row.warnings) ? (row.warnings as string[]) : [],
    createdAt: row.createdAt.toISOString(),
  };
}

function rowToTrust(row: {
  listingId: string;
  score: number;
  confidence: number;
  factors: Prisma.JsonValue;
  riskFlags: Prisma.JsonValue;
  createdAt: Date;
}): ListingTrustScore {
  return {
    listingId: row.listingId,
    score: row.score,
    confidence: row.confidence,
    factors: Array.isArray(row.factors) ? (row.factors as string[]) : [],
    riskFlags: Array.isArray(row.riskFlags) ? (row.riskFlags as string[]) : [],
    createdAt: row.createdAt.toISOString(),
  };
}

function rowToRanking(row: {
  listingId: string;
  score: number;
  confidence: number;
  qualityScore: number;
  trustScore: number;
  conversionScore: number;
  priceFitScore: number;
  freshnessScore: number;
  reasons: Prisma.JsonValue;
  createdAt: Date;
}): MarketplaceRankingScore {
  const reasons = Array.isArray(row.reasons) ? (row.reasons as string[]) : [];
  return {
    listingId: row.listingId,
    score: row.score,
    confidence: row.confidence,
    components: {
      quality: row.qualityScore,
      trust: row.trustScore,
      conversion: row.conversionScore,
      priceFit: row.priceFitScore,
      freshness: row.freshnessScore,
    },
    reasons,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function saveListingQualitySnapshot(
  input: ListingQualityScore,
  metadata?: Record<string, unknown>,
): Promise<{ id: string } | null> {
  try {
    const row = await prisma.listingQualitySnapshot.create({
      data: {
        listingId: input.listingId,
        score: input.score,
        confidence: input.confidence,
        factors: input.factors,
        warnings: input.warnings,
        metadata: (metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
    return { id: row.id };
  } catch (e) {
    logWarn("[marketplace-intelligence] saveListingQualitySnapshot failed", {
      listingId: input.listingId,
      error: String(e),
    });
    return null;
  }
}

export async function saveListingTrustSnapshot(
  input: ListingTrustScore,
  metadata?: Record<string, unknown>,
): Promise<{ id: string } | null> {
  try {
    const row = await prisma.listingTrustSnapshot.create({
      data: {
        listingId: input.listingId,
        score: input.score,
        confidence: input.confidence,
        factors: input.factors,
        riskFlags: input.riskFlags,
        metadata: (metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
    return { id: row.id };
  } catch (e) {
    logWarn("[marketplace-intelligence] saveListingTrustSnapshot failed", {
      listingId: input.listingId,
      error: String(e),
    });
    return null;
  }
}

export async function saveFraudSignals(
  inputs: FraudSignal[],
): Promise<{ created: number; warnings: PersistWarning[] }> {
  const warnings: PersistWarning[] = [];
  let created = 0;
  for (const s of inputs) {
    try {
      await prisma.listingFraudSignal.create({
        data: {
          listingId: s.listingId ?? undefined,
          userId: s.userId ?? undefined,
          signalType: s.signalType,
          severity: s.severity,
          confidence: s.confidence,
          reason: s.reason,
          evidence: s.evidence as Prisma.InputJsonValue,
        },
      });
      created += 1;
    } catch (e) {
      warnings.push({
        step: "saveFraudSignals",
        message: String(e),
      });
      logWarn("[marketplace-intelligence] saveFraudSignals row failed", {
        listingId: s.listingId,
        signalType: s.signalType,
        error: String(e),
      });
    }
  }
  return { created, warnings };
}

export async function saveRankingSnapshot(
  input: MarketplaceRankingScore,
  metadata?: Record<string, unknown>,
): Promise<{ id: string } | null> {
  try {
    const row = await prisma.listingRankingSnapshot.create({
      data: {
        listingId: input.listingId,
        score: input.score,
        confidence: input.confidence,
        qualityScore: input.components.quality,
        trustScore: input.components.trust,
        conversionScore: input.components.conversion,
        priceFitScore: input.components.priceFit,
        freshnessScore: input.components.freshness,
        reasons: input.reasons,
        metadata: (metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
    return { id: row.id };
  } catch (e) {
    logWarn("[marketplace-intelligence] saveRankingSnapshot failed", {
      listingId: input.listingId,
      error: String(e),
    });
    return null;
  }
}

export async function savePricingRecommendation(
  input: PricingRecommendation,
): Promise<{ id: string } | null> {
  try {
    const row = await prisma.listingPricingRecommendation.create({
      data: {
        listingId: input.listingId,
        currentPrice: input.currentPrice,
        recommendedPrice: input.recommendedPrice,
        adjustmentPercent: input.adjustmentPercent,
        confidence: input.confidence,
        reason: input.reason,
        evidence: input.evidence as Prisma.InputJsonValue,
      },
    });
    return { id: row.id };
  } catch (e) {
    logWarn("[marketplace-intelligence] savePricingRecommendation failed", {
      listingId: input.listingId,
      error: String(e),
    });
    return null;
  }
}

export async function saveMarketplaceDecisions(
  inputs: MarketplaceDecision[],
): Promise<{ created: number; warnings: PersistWarning[] }> {
  const warnings: PersistWarning[] = [];
  let created = 0;
  for (const d of inputs) {
    try {
      await prisma.marketplaceDecisionLog.create({
        data: {
          listingId: d.listingId ?? undefined,
          userId: d.userId ?? undefined,
          decisionType: d.type,
          confidence: d.confidence,
          priority: d.priority,
          reason: d.reason,
          evidence: d.evidence as Prisma.InputJsonValue,
        },
      });
      created += 1;
    } catch (e) {
      warnings.push({ step: "saveMarketplaceDecisions", message: String(e) });
      logWarn("[marketplace-intelligence] saveMarketplaceDecisions row failed", {
        listingId: d.listingId,
        type: d.type,
        error: String(e),
      });
    }
  }
  return { created, warnings };
}

export async function getLatestListingQuality(listingId: string): Promise<ListingQualityScore | null> {
  const row = await prisma.listingQualitySnapshot.findFirst({
    where: { listingId },
    orderBy: { createdAt: "desc" },
  });
  return row ? rowToQuality(row) : null;
}

export async function getLatestListingTrust(listingId: string): Promise<ListingTrustScore | null> {
  const row = await prisma.listingTrustSnapshot.findFirst({
    where: { listingId },
    orderBy: { createdAt: "desc" },
  });
  return row ? rowToTrust(row) : null;
}

export async function getLatestListingRanking(listingId: string): Promise<MarketplaceRankingScore | null> {
  const row = await prisma.listingRankingSnapshot.findFirst({
    where: { listingId },
    orderBy: { createdAt: "desc" },
  });
  return row ? rowToRanking(row) : null;
}

export async function getOpenFraudSignals(listingId?: string) {
  const rows = await prisma.listingFraudSignal.findMany({
    where: {
      status: "OPEN",
      ...(listingId ? { listingId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return rows;
}

export async function getPendingPricingRecommendations(listingId?: string) {
  return prisma.listingPricingRecommendation.findMany({
    where: {
      status: "PENDING",
      ...(listingId ? { listingId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function getRecentMarketplaceDecisions(limit = 50) {
  return prisma.marketplaceDecisionLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
