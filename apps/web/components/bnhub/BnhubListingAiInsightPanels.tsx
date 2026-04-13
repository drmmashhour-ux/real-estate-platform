import { Sparkles } from "lucide-react";
import type { ListingIntelligenceSnapshot } from "@prisma/client";
import { buildBnhubStayAiInsightPanels } from "@/lib/bnhub/bnhub-ai-panels-stay";
import type { BnhubMarketInsightPayload } from "@/lib/bnhub/market-price-insight";

type Props = {
  market: BnhubMarketInsightPayload;
  trustScore0to100: number;
  snapshot: ListingIntelligenceSnapshot | null;
};

/** AI Market Insight + AI Investment Score for BNHub stay detail (light shell). */
export function BnhubListingAiInsightPanels({ market, trustScore0to100, snapshot }: Props) {
  const p = buildBnhubStayAiInsightPanels({ market, trustScore0to100, snapshot });

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <section
        className="rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/90 to-white p-5 shadow-sm"
        aria-labelledby="bnhub-ai-market-heading"
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h2 id="bnhub-ai-market-heading" className="text-lg font-semibold text-slate-900">
            AI Market Insight
          </h2>
          <span className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-700">
            <Sparkles className="h-3 w-3" aria-hidden />
            AI-generated insight
          </span>
        </div>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex flex-wrap justify-between gap-2 border-b border-slate-200 pb-2">
            <dt className="text-slate-500">Your nightly rate</dt>
            <dd className="font-semibold text-slate-900">{p.listNightLabel}</dd>
          </div>
          <div className="flex flex-wrap justify-between gap-2 border-b border-slate-200 pb-2">
            <dt className="text-slate-500">Est. market (BNHUB)</dt>
            <dd className="font-semibold text-indigo-900">{p.estimatedMarketNightLabel}/night</dd>
          </div>
        </dl>
        <p className="mt-3 text-sm leading-snug text-slate-700">{p.comparisonLine}</p>
      </section>

      <section
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        aria-labelledby="bnhub-ai-invest-heading"
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h2 id="bnhub-ai-invest-heading" className="text-lg font-semibold text-slate-900">
            AI Investment Score
          </h2>
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
            <Sparkles className="h-3 w-3 text-indigo-600" aria-hidden />
            AI-generated insight
          </span>
        </div>
        <p className="mt-4 text-4xl font-bold tabular-nums tracking-tight text-indigo-900">
          {p.investmentScore.toFixed(1)}
          <span className="ml-1 text-lg font-semibold text-slate-400">/10</span>
        </p>
        <p className="mt-3 text-sm leading-snug text-slate-600">{p.investmentBasis}</p>
      </section>
    </div>
  );
}
