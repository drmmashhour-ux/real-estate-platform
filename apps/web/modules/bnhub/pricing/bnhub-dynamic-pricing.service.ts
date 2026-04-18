import {
  BNHUB_PRICING_GUARDRAILS,
} from "@/config/bnhub-ranking-pricing.config";
import { recordBnhubPricingFallback, recordBnhubPricingSuggestion } from "@/modules/bnhub/ranking/bnhub-ranking-monitor";
import type {
  BnhubAdvisoryPricingReasonCode,
  BnhubAdvisoryPricingSuggestion,
} from "./bnhub-dynamic-pricing.types";
import { loadBnhubPricingSignals } from "./bnhub-pricing-signals.service";
import { getCityPeerPriceStats } from "./bnhub-market-pricing.service";
import { prisma } from "@/lib/db";

function clampCents(n: number): number {
  return Math.max(100, Math.round(n));
}

/**
 * Advisory pricing only — callers must not persist without explicit host action + flags.
 */
export async function computeBnhubAdvisoryPricing(listingId: string): Promise<BnhubAdvisoryPricingSuggestion | null> {
  try {
    const row = await prisma.shortTermListing.findUnique({
      where: { id: listingId },
      select: { id: true, nightPriceCents: true, city: true },
    });
    if (!row) return null;

    const loaded = await loadBnhubPricingSignals(listingId);
    if (!loaded) return null;

    const { smart, funnel } = loaded;
    const peerCity = await getCityPeerPriceStats(row.city ?? "", listingId);

    const minPeer = BNHUB_PRICING_GUARDRAILS.minPeerSampleForMedianNarrative;
    const thinPeers =
      peerCity.sampleSize < minPeer || (funnel.peerListingCount ?? 0) < minPeer;

    const reasons: BnhubAdvisoryPricingReasonCode[] = [];
    const lines: string[] = [];

    const cur = row.nightPriceCents;
    let target = smart.recommendedPriceCents;
    let confidenceScore = smart.confidenceScore ?? 45;
    let noChange = false;

    const weakMarketEvidence = funnel.dataSparse || thinPeers;

    if (weakMarketEvidence) {
      reasons.push("SPARSE_TRAFFIC");
      lines.push("Thin peer sample or low event volume — advisory only; avoid large moves.");
      confidenceScore = Math.min(confidenceScore, 40);
      recordBnhubPricingFallback("sparse_data");
    }

    if (funnel.listingViews >= 25 && funnel.bookingStarts === 0) {
      reasons.push("CONVERSION_FRICTION");
      lines.push("≥25 listing views, 0 booking starts (last 30d) — consider clarity/total price before raising.");
      target = Math.round(cur * (1 - BNHUB_PRICING_GUARDRAILS.maxDecreasePct * 0.5));
      confidenceScore -= 10;
    } else if (funnel.bookingStarts >= 4 && funnel.startToPaidRate < 0.25) {
      reasons.push("CONVERSION_FRICTION");
      lines.push("≥4 starts, low completion — checkout friction likely; hold nightly rate.");
      noChange = true;
      target = cur;
    } else if (
      !thinPeers &&
      funnel.demandLevel === "high" &&
      smart.marketAvgCents != null &&
      cur < smart.marketAvgCents * 0.92
    ) {
      reasons.push("DEMAND_STRONG");
      reasons.push("MILD_INCREASE");
      lines.push(
        "Booking pace vs peer listings (last 30d) plus rate below computed peer average — small bump optional.",
      );
      target = Math.round(cur * (1 + Math.min(BNHUB_PRICING_GUARDRAILS.maxIncreasePct, 0.08)));
    } else if (
      peerCity.sampleSize >= minPeer &&
      peerCity.medianCents != null &&
      cur > peerCity.medianCents * 1.18 &&
      funnel.viewToStartRate < 0.04
    ) {
      reasons.push("MILD_DECREASE");
      lines.push(
        `Above city median (${peerCity.sampleSize} peers) with low view→start — small cut optional.`,
      );
      target = Math.round(cur * (1 - BNHUB_PRICING_GUARDRAILS.maxDecreasePct * 0.45));
    } else {
      reasons.push("HOLD_STEADY");
      lines.push("Mixed or weak context — hold or minor tweak only.");
      noChange = confidenceScore < 52 || weakMarketEvidence;
      target = cur;
    }

    const maxUp = Math.round(cur * (1 + BNHUB_PRICING_GUARDRAILS.maxIncreasePct));
    const maxDown = Math.round(cur * (1 - BNHUB_PRICING_GUARDRAILS.maxDecreasePct));
    target = clampCents(Math.min(maxUp, Math.max(maxDown, target)));

    if (weakMarketEvidence && confidenceScore < 48) {
      const band = Math.round(cur * BNHUB_PRICING_GUARDRAILS.lowConfidenceMaxAbsMovePct);
      target = clampCents(cur + Math.max(-band, Math.min(band, target - cur)));
    }

    const minRec = clampCents(Math.min(cur, target) * 0.97);
    const maxRec = clampCents(Math.max(cur, target) * 1.03);

    const confLabel: BnhubAdvisoryPricingSuggestion["confidenceLabel"] =
      confidenceScore >= 72 ? "high" : confidenceScore >= 52 ? "medium" : "low";
    const confidence = Math.min(1, Math.max(0, confidenceScore / 100));

    if (peerCity.sampleSize >= minPeer) reasons.unshift("PEER_ANCHOR");

    recordBnhubPricingSuggestion(confLabel, funnel.dataSparse);

    return {
      listingId,
      currentPriceCents: cur,
      suggestedPriceCents: target,
      minRecommendedCents: minRec,
      maxRecommendedCents: maxRec,
      band: { minCents: minRec, maxCents: maxRec },
      demandLevel: funnel.demandLevel,
      confidence,
      confidenceLabel: confLabel,
      explanation: {
        summary: noChange
          ? "No major change recommended from current signals."
          : "Advisory suggestion from DB peers + your listing events (last 30d); not auto-applied.",
        lines: lines.slice(0, 4),
      },
      reasonCodes: [...new Set(reasons)].slice(0, 8),
      noChangeRecommended: noChange || Math.abs(target - cur) < Math.max(200, cur * 0.02),
    };
  } catch (e) {
    recordBnhubPricingFallback("exception");
    return null;
  }
}
