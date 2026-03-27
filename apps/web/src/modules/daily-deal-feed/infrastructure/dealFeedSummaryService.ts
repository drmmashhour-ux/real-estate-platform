import type { RankedDailyDealItem } from "@/src/modules/daily-deal-feed/domain/dailyDealFeed.types";

export function buildDealSummary(item: RankedDailyDealItem) {
  const highTrust = item.trustScore >= 65;
  const strongDeal = item.dealScore >= 75;
  const lowConf = item.confidence < 50;

  let headline = "Worth reviewing";
  if (strongDeal && highTrust) headline = "Strong opportunity";
  if (item.riskScore >= 70 || item.trustScore < 40) headline = "Proceed with caution";

  const detailParts: string[] = [];
  if (strongDeal) detailParts.push("deal score is strong");
  if (!highTrust) detailParts.push("trust signal is mixed");
  if (lowConf) detailParts.push("confidence is moderate");
  if (item.riskScore >= 70) detailParts.push("risk indicators are elevated");
  if (!detailParts.length) detailParts.push("scores are balanced for review");

  return {
    headline,
    detail: `${headline} because ${detailParts.join(", ")}.`,
    confidenceNote:
      item.confidence >= 70
        ? "Confidence is strong based on consistent deterministic signals."
        : item.confidence >= 50
          ? "Confidence is moderate; validate assumptions before action."
          : "Confidence is low; treat this as a directional lead.",
  };
}
