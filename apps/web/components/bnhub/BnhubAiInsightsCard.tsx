import { publicDemandLabel, publicValueLabel } from "@/lib/ai/intelligence/buildExplanation";
import type { ListingIntelligenceSnapshot } from "@prisma/client";

type Props = {
  snapshot: ListingIntelligenceSnapshot | null;
};

/**
 * Guest-facing AI insights — uses persisted snapshot only (no raw internal scores).
 */
export function BnhubAiInsightsCard({ snapshot }: Props) {
  if (!snapshot || snapshot.aiCompositeScore == null) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">AI Insights</h2>
        <p className="mt-2 text-sm text-slate-600">
          Insights will appear after the next intelligence evaluation (search, pricing, or host autopilot run).
        </p>
      </div>
    );
  }

  const scores = {
    relevanceScore: snapshot.relevanceScore ?? 0.5,
    demandScore: snapshot.demandScore ?? 0.5,
    conversionScore: snapshot.conversionScore ?? 0.5,
    priceCompetitiveness: snapshot.priceCompetitiveness ?? 0.5,
    qualityScore: snapshot.qualityScore ?? 0.5,
    personalizationScore: snapshot.personalizationScore ?? 0.5,
    recencyScore: 0.5,
    confidenceScore: snapshot.confidenceScore ?? 0.5,
  };

  const value = publicValueLabel(scores);
  const demand = publicDemandLabel(scores);

  return (
    <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">AI Insights</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-indigo-800 ring-1 ring-indigo-200">
          {value}
        </span>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-800 ring-1 ring-slate-200">
          Demand: {demand}
        </span>
        {snapshot.trendLabel ? (
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
            Trend: {snapshot.trendLabel}
          </span>
        ) : null}
      </div>
      {snapshot.summary ? (
        <p className="mt-3 text-sm leading-relaxed text-slate-700">{snapshot.summary}</p>
      ) : null}
      <p className="mt-3 text-xs text-slate-500">
        Suggestions reflect marketplace signals and may change as your listing and demand evolve.
      </p>
    </div>
  );
}
