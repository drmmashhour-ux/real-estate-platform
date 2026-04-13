import type { ListingIntelligenceSnapshot } from "@prisma/client";
import type { BnhubMarketInsightPayload } from "@/lib/bnhub/market-price-insight";

const INVESTMENT_BASIS = "Based on price, location, and demand.";

function moneyCents(cents: number, currency: string): string {
  const n = cents / 100;
  const cur = currency.length === 3 ? currency : "CAD";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: cur,
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `$${n.toFixed(0)}`;
  }
}

/**
 * Guest-facing copy for BNHub stay AI panels — uses marketplace peer pricing when available.
 */
export function buildBnhubStayAiInsightPanels(input: {
  market: BnhubMarketInsightPayload;
  trustScore0to100: number;
  snapshot: ListingIntelligenceSnapshot | null;
}): {
  listNightLabel: string;
  estimatedMarketNightLabel: string;
  comparisonLine: string;
  investmentScore: number;
  investmentBasis: string;
  usedDataFallback: boolean;
} {
  const { market, trustScore0to100, snapshot } = input;
  const cur = market.currency ?? "CAD";
  const list = market.yourNightCents;
  const peer = market.peerAvgNightCents;
  const n = market.peerListingCount;

  const anchor =
    peer != null && peer > 0 && n >= 2 ? peer : market.recommendedNightCents > 0 ? market.recommendedNightCents : list;

  let comparisonLine: string;
  let usedDataFallback: boolean;

  if (peer != null && peer > 0 && n >= 2 && market.percentVsPeerAvg != null) {
    usedDataFallback = false;
    const abs = Math.round(Math.abs(market.percentVsPeerAvg));
    const rel =
      market.percentVsPeerAvg < -2
        ? `${abs}% under`
        : market.percentVsPeerAvg > 2
          ? `${abs}% over`
          : "aligned with";
    comparisonLine = `Your nightly ${moneyCents(list, cur)} vs peer average ${moneyCents(peer, cur)} across ${n} published stays in ${market.city} — ${rel} that BNHUB sample.`;
  } else if (peer != null && peer > 0 && n >= 2) {
    usedDataFallback = false;
    comparisonLine = `Your nightly ${moneyCents(list, cur)} vs peer average ${moneyCents(peer, cur)} (${n} stays in ${market.city} on BNHUB).`;
  } else {
    usedDataFallback = true;
    comparisonLine = `Based on available listing data — model anchor ${moneyCents(anchor, cur)}/night vs your ${moneyCents(list, cur)} while more comparable stays accumulate in ${market.city}.`;
  }

  let investmentScore: number;
  if (snapshot?.aiCompositeScore != null && Number.isFinite(snapshot.aiCompositeScore)) {
    const c = Math.max(0, Math.min(1, snapshot.aiCompositeScore));
    investmentScore = Math.round((5.8 + c * 3.4) * 10) / 10;
  } else {
    const demandBoost =
      market.demandLevel === "high" ? 0.55 : market.demandLevel === "medium" ? 0.3 : 0.1;
    const confBoost = market.confidenceLabel === "high" ? 0.25 : market.confidenceLabel === "medium" ? 0.12 : 0;
    investmentScore =
      Math.round((5.6 + (trustScore0to100 / 100) * 2.6 + demandBoost + confBoost) * 10) / 10;
  }
  investmentScore = Math.min(9.2, Math.max(5.4, investmentScore));

  return {
    listNightLabel: moneyCents(list, cur),
    estimatedMarketNightLabel: moneyCents(anchor, cur),
    comparisonLine,
    investmentScore,
    investmentBasis: INVESTMENT_BASIS,
    usedDataFallback,
  };
}
