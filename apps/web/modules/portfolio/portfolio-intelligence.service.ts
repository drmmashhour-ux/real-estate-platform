import { prisma } from "@/lib/db";
import { getLatestHealth } from "./asset-health.service";

export type RankedAsset = {
  assetId: string;
  assetName: string;
  score: number;
  band: string;
  riskLevel: string;
};

export async function rankAssets(portfolioId: string): Promise<RankedAsset[]> {
  const links = await prisma.lecipmBrokerPortfolioAssetLink.findMany({
    where: { portfolioId },
    select: { assetId: true },
  });

  const ranked: RankedAsset[] = [];
  for (const l of links) {
    const health = await getLatestHealth(l.assetId);
    const asset = await prisma.lecipmPortfolioAsset.findUnique({
      where: { id: l.assetId },
      select: { assetName: true },
    });
    ranked.push({
      assetId: l.assetId,
      assetName: asset?.assetName ?? l.assetId,
      score: health?.score ?? 0,
      band: health?.band ?? "?",
      riskLevel: health?.riskLevel ?? "?",
    });
  }

  ranked.sort((a, b) => b.score - a.score);
  return ranked;
}

export async function detectUnderperformers(portfolioId: string): Promise<RankedAsset[]> {
  const ranked = await rankAssets(portfolioId);
  return ranked.filter((r) => r.score < 60).slice(-10);
}

export async function detectTopPerformers(portfolioId: string): Promise<RankedAsset[]> {
  const ranked = await rankAssets(portfolioId);
  return ranked.filter((r) => r.score >= 70).slice(0, 10);
}

export async function identifyRiskAssets(portfolioId: string): Promise<RankedAsset[]> {
  const ranked = await rankAssets(portfolioId);
  return ranked.filter((r) => r.riskLevel === "HIGH");
}
