import type { ListingDemandUiPayload } from "@/lib/listings/listing-analytics-service";

function hashStable(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return h >>> 0;
}

function cadWhole(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-CA", { maximumFractionDigits: 0 })}`;
}

const INVESTMENT_BASIS = "Based on price, location, and demand.";

function headlineVsMarket(diffPct: number): string {
  const a = Math.abs(diffPct);
  if (a < 1) return "Current listing is aligned with market (within 1%).";
  const dir = diffPct > 0 ? "above" : "below";
  return `Current listing is ${Math.round(a)}% ${dir} market.`;
}

export type ResidentialAiInsightPanelsData = {
  estimatedMarketLabel: string;
  vsMarketHeadline: string;
  comparisonOneLiner: string;
  investmentScore: number;
  investmentBasis: string;
  usedDataFallback: boolean;
};

/**
 * Copy for residential listing AI panels — uses peer aggregate when sample ≥3, else deterministic model band + disclaimer.
 */
export function buildResidentialAiInsightPanels(input: {
  listingId: string;
  city: string;
  listPriceCents: number;
  demandUi: ListingDemandUiPayload | null | undefined;
}): ResidentialAiInsightPanelsData {
  const { listingId, city, listPriceCents } = input;
  const demandUi = input.demandUi;
  const peerEst = demandUi?.comparableMarketEstimateCents ?? null;
  const peerCount = demandUi?.comparablePeerCount ?? 0;
  const demandScore = demandUi?.demandScore ?? 0;

  const hBand = hashStable(listingId);
  const modelEstimateCents = Math.round(listPriceCents * (0.96 + ((hBand % 11) / 100)));

  let comparisonOneLiner: string;
  let usedDataFallback: boolean;
  let estimatedMarketLabel: string;
  let vsMarketHeadline: string;

  if (peerEst != null && peerEst > 0 && peerCount >= 3) {
    usedDataFallback = false;
    estimatedMarketLabel = cadWhole(peerEst);
    const diffPct = ((listPriceCents - peerEst) / peerEst) * 100;
    vsMarketHeadline = headlineVsMarket(diffPct);
    comparisonOneLiner = `${peerCount} similar homes in ${city} anchor this estimate on LECIPM.`;
  } else {
    usedDataFallback = true;
    estimatedMarketLabel = cadWhole(modelEstimateCents);
    const diffPct =
      modelEstimateCents > 0 ? ((listPriceCents - modelEstimateCents) / modelEstimateCents) * 100 : 0;
    vsMarketHeadline = headlineVsMarket(diffPct);
    comparisonOneLiner = `Fair-value band uses your ask and local activity until more comps post in ${city}.`;
  }

  const h2 = hashStable(`${listingId}:inv`);
  const base = 5.5 + (demandScore / 100) * 3.4 + ((h2 % 19) / 10) * 0.35;
  const investmentScore = Math.round(Math.min(9.1, Math.max(5.4, base)) * 10) / 10;

  return {
    estimatedMarketLabel,
    vsMarketHeadline,
    comparisonOneLiner,
    investmentScore,
    investmentBasis: INVESTMENT_BASIS,
    usedDataFallback,
  };
}
