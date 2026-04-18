import { prisma } from "@/lib/db";
import * as repo from "./marketplace-intelligence.repository";

export type MarketplaceIntelligenceDashboardPayload = {
  recentDecisions: Awaited<ReturnType<typeof repo.getRecentMarketplaceDecisions>>;
  openFraud: Awaited<ReturnType<typeof repo.getOpenFraudSignals>>;
  pendingPricing: Awaited<ReturnType<typeof repo.getPendingPricingRecommendations>>;
  boostCandidates: { listingId: string | null; reason: string; createdAt: Date }[];
  downrankCandidates: { listingId: string | null; reason: string; createdAt: Date }[];
  sampleQuality: { listingId: string; score: number; confidence: number } | null;
  sampleTrust: { listingId: string; score: number; confidence: number } | null;
};

export async function getMarketplaceIntelligenceDashboardPayload(): Promise<MarketplaceIntelligenceDashboardPayload> {
  const [recentDecisions, openFraud, pendingPricing] = await Promise.all([
    repo.getRecentMarketplaceDecisions(40),
    repo.getOpenFraudSignals(),
    repo.getPendingPricingRecommendations(),
  ]);

  const boostCandidates = recentDecisions
    .filter((d) => d.decisionType === "BOOST_LISTING")
    .slice(0, 8)
    .map((d) => ({ listingId: d.listingId, reason: d.reason, createdAt: d.createdAt }));

  const downrankCandidates = recentDecisions
    .filter((d) => d.decisionType === "DOWNRANK_LISTING")
    .slice(0, 8)
    .map((d) => ({ listingId: d.listingId, reason: d.reason, createdAt: d.createdAt }));

  const latestQ = await prisma.listingQualitySnapshot.findFirst({
    orderBy: { createdAt: "desc" },
    select: { listingId: true, score: true, confidence: true },
  });
  const latestT = await prisma.listingTrustSnapshot.findFirst({
    orderBy: { createdAt: "desc" },
    select: { listingId: true, score: true, confidence: true },
  });

  return {
    recentDecisions,
    openFraud,
    pendingPricing,
    boostCandidates,
    downrankCandidates,
    sampleQuality: latestQ,
    sampleTrust: latestT,
  };
}
