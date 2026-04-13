"use client";

import { Sparkles } from "lucide-react";
import {
  buildResidentialAiInsightPanels,
  type ResidentialAiInsightPanelsData,
} from "@/lib/listings/listing-ai-panels-residential";
import type { ListingDemandUiPayload } from "@/lib/listings/listing-analytics-service";

type Props = {
  listingId: string;
  city: string;
  listPriceCents: number;
  demandUi: ListingDemandUiPayload | null | undefined;
};

function MarketCard({ p }: { p: ResidentialAiInsightPanelsData }) {
  return (
    <section
      className="rounded-2xl border border-[#D4AF37]/25 bg-gradient-to-br from-[#141008]/95 to-[#0a0a0a] p-5 shadow-[0_20px_50px_-28px_rgba(212,175,55,0.35)]"
      aria-labelledby="ai-market-insight-heading"
    >
      <div className="flex items-start justify-between gap-2">
        <h2 id="ai-market-insight-heading" className="text-base font-semibold tracking-tight text-[#E8D589]">
          AI Market Insight
        </h2>
        <span className="inline-flex items-center gap-1 rounded-full border border-[#D4AF37]/35 bg-black/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#D4AF37]/90">
          <Sparkles className="h-3 w-3" aria-hidden />
          AI-generated insight
        </span>
      </div>
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex flex-wrap justify-between gap-2 border-b border-white/10 pb-2">
          <dt className="text-white/55">Price vs market</dt>
          <dd className="font-semibold text-[#E8D589]">{p.estimatedMarketLabel}</dd>
        </div>
      </dl>
      <p className="mt-3 text-sm font-semibold leading-snug text-white">{p.vsMarketHeadline}</p>
      <p className="mt-2 text-sm leading-snug text-white/70">{p.comparisonOneLiner}</p>
    </section>
  );
}

function InvestmentCard({ p }: { p: ResidentialAiInsightPanelsData }) {
  return (
    <section
      className="rounded-2xl border border-white/12 bg-[#0c0c0c] p-5 shadow-[0_16px_40px_-24px_rgba(0,0,0,0.85)]"
      aria-labelledby="ai-investment-score-heading"
    >
      <div className="flex items-start justify-between gap-2">
        <h2 id="ai-investment-score-heading" className="text-base font-semibold tracking-tight text-white">
          AI Investment Score
        </h2>
        <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/55">
          <Sparkles className="h-3 w-3 text-[#D4AF37]" aria-hidden />
          AI-generated insight
        </span>
      </div>
      <p className="mt-4 text-4xl font-bold tabular-nums tracking-tight text-[#D4AF37]">
        {p.investmentScore.toFixed(1)}
        <span className="ml-1 text-lg font-semibold text-white/50">/10</span>
      </p>
      <p className="mt-3 text-sm leading-snug text-white/60">{p.investmentBasis}</p>
    </section>
  );
}

/** AI Market Insight only — price vs market + explanation (use at top of listing detail). */
export function ListingAiMarketInsightCard(props: Props) {
  const p = buildResidentialAiInsightPanels(props);
  return <MarketCard p={p} />;
}

/** AI Investment Score only — place after price block on listing detail. */
export function ListingAiInvestmentScoreCard(props: Props) {
  const p = buildResidentialAiInsightPanels(props);
  return <InvestmentCard p={p} />;
}

/** Visible AI market + investment blocks for residential listing detail (dark theme). */
export function ListingAiInsightPanels(props: Props) {
  const p = buildResidentialAiInsightPanels(props);
  return (
    <div className="flex flex-col gap-4">
      <MarketCard p={p} />
      <InvestmentCard p={p} />
    </div>
  );
}
