import type { DealAnalysisPublicDto } from "@/modules/deal-analyzer/domain/contracts";
import { DealRecommendationBadge } from "@/components/deal/DealRecommendationBadge";
import { DealRiskPanel } from "@/components/deal/DealRiskPanel";
import { DealAnalysisRunButton } from "@/components/deal/DealAnalysisRunButton";
import { DealCashFlowPreview } from "@/components/deal/DealCashFlowPreview";
import { ComparableInsightsCard } from "@/components/deal/ComparableInsightsCard";
import { ScenarioSimulatorCard } from "@/components/deal/ScenarioSimulatorCard";
import { BnHubOpportunityCard } from "@/components/deal/BnHubOpportunityCard";
import { DealConfidencePanel } from "@/components/deal/DealConfidencePanel";
import { DealPhase2RerunButton } from "@/components/deal/DealPhase2RerunButton";

const OPP_LABEL: Record<string, string> = {
  cash_flow_candidate: "Cash-flow candidate",
  appreciation_candidate: "Appreciation candidate",
  value_add_candidate: "Value-add candidate",
  bnhub_candidate: "BNHub candidate",
  overpriced: "Overpriced signal",
  high_risk: "High risk",
  insufficient_data: "Insufficient data",
};

export function DealAnalysisCard({
  listingId,
  analysis,
  showRunButton,
}: {
  listingId: string;
  analysis: DealAnalysisPublicDto | null;
  showRunButton?: boolean;
}) {
  if (!analysis) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#C9A646]">AI Deal Analyzer</p>
        <p className="mt-2 text-sm text-[#A1A1A1]">
          No analysis on file yet. Run a deterministic, rules-based opportunity check (not investment advice).
        </p>
        {showRunButton ? <DealAnalysisRunButton listingId={listingId} /> : null}
      </div>
    );
  }

  const topReasons = analysis.reasons.slice(0, 3);
  const topWarnings = analysis.warnings.slice(0, 2);

  return (
    <div className="rounded-2xl border border-[#C9A646]/25 bg-gradient-to-b from-[#C9A646]/[0.07] to-[#121212] p-6 shadow-[0_0_40px_rgba(201,166,70,0.08)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#C9A646]">AI Deal Analyzer</p>
          <p className="mt-1 text-lg font-semibold text-white">Opportunity snapshot</p>
        </div>
        <DealRecommendationBadge recommendation={analysis.recommendation} />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-[#121212] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#A1A1A1]">Investment score</p>
          <p className="mt-1 font-serif text-3xl font-bold text-white">{analysis.investmentScore}</p>
          <p className="text-xs text-[#A1A1A1]">/ 100 · confidence: {analysis.confidenceLevel}</p>
        </div>
        <DealRiskPanel dto={analysis} />
      </div>

      <p className="mt-4 text-xs text-[#A1A1A1]">
        Type:{" "}
        <span className="font-medium text-white">
          {OPP_LABEL[analysis.opportunityType] ?? analysis.opportunityType}
        </span>
        {analysis.phase2?.decision?.opportunity ? (
          <span className="block text-slate-500">
            Phase 2 type: {OPP_LABEL[analysis.phase2.decision.opportunity] ?? analysis.phase2.decision.opportunity}
          </span>
        ) : null}
      </p>

      {analysis.phase2?.comparables ? <ComparableInsightsCard data={analysis.phase2.comparables} /> : null}
      {analysis.phase2?.scenarios && analysis.phase2.scenarios.length > 0 ? (
        <div className="mt-4">
          <ScenarioSimulatorCard scenarios={analysis.phase2.scenarios} />
        </div>
      ) : null}
      {analysis.phase2?.bnhub ? (
        <div className="mt-4">
          <BnHubOpportunityCard data={analysis.phase2.bnhub} />
        </div>
      ) : null}
      {analysis.phase2 ? (
        <div className="mt-4">
          <DealConfidencePanel phase2={analysis.phase2} />
        </div>
      ) : null}

      {analysis.scenarioPreview?.monthlyRent != null ? (
        <div className="mt-4">
          <DealCashFlowPreview scenario={analysis.scenarioPreview} />
        </div>
      ) : null}

      {topReasons.length > 0 ? (
        <div className="mt-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#A1A1A1]">Top reasons</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-300">
            {topReasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {topWarnings.length > 0 ? (
        <div className="mt-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-200/90">Warnings</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-amber-100/90">
            {topWarnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="mt-4 text-[11px] leading-relaxed text-slate-500">{analysis.disclaimer}</p>

      {showRunButton ? (
        <>
          <DealAnalysisRunButton listingId={listingId} />
          <DealPhase2RerunButton listingId={listingId} />
        </>
      ) : null}
    </div>
  );
}
