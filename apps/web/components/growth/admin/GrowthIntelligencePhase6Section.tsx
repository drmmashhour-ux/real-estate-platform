import { growthIntelligenceFlags } from "@/config/feature-flags";
import {
  buildCtaImprovementBrief,
  buildProgrammaticLandingBrief,
  buildSeoContentBrief,
} from "@/modules/growth-intelligence/growth-content-brief.service";
import { getGrowthIntelligencePayload } from "@/modules/growth-intelligence/growth-admin-payload.service";
import type { GrowthOpportunity } from "@/modules/growth-intelligence/growth.types";
import { scoreGrowthOpportunity } from "@/modules/growth-intelligence/growth-priority.service";
import { GrowthBriefCard } from "./GrowthBriefCard";
import { GrowthFunnelInsightsCard } from "./GrowthFunnelInsightsCard";
import { GrowthIntelligenceSummaryCard } from "./GrowthIntelligenceSummaryCard";
import { GrowthOpportunitiesTable } from "./GrowthOpportunitiesTable";
import { GrowthPriorityBadge } from "./GrowthPriorityBadge";
import { GrowthRegionOpportunityCard } from "./GrowthRegionOpportunityCard";
import { GrowthSignalsTable } from "./GrowthSignalsTable";
import { GrowthTrendSummaryCard } from "./GrowthTrendSummaryCard";

function briefFor(o: GrowthOpportunity) {
  switch (o.opportunityType) {
    case "create_programmatic_page_brief":
      return buildProgrammaticLandingBrief(o);
    case "improve_cta":
      return buildCtaImprovementBrief(o);
    default:
      return buildSeoContentBrief(o);
  }
}

export async function GrowthIntelligencePhase6Section(props: { locale: string; country: string }) {
  if (!growthIntelligenceFlags.growthIntelligenceV1) return null;

  const data = await getGrowthIntelligencePayload({
    locale: props.locale,
    country: props.country,
  });

  if (!data.enabled) {
    return (
      <section className="space-y-4 rounded-2xl border border-white/10 bg-black/20 p-6">
        <GrowthIntelligenceSummaryCard summary={null} disabled />
      </section>
    );
  }

  const top = data.opportunities.slice(0, 12);

  return (
    <section className="space-y-6 rounded-2xl border border-premium-gold/20 bg-gradient-to-b from-black/50 to-black/70 p-6">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-premium-gold">Phase 6 · Intelligence</p>
        <h2 className="mt-2 text-xl font-semibold text-white">Deterministic growth signals</h2>
        <p className="mt-1 max-w-prose text-xs text-zinc-400">
          Advisory-only. No auto-publish, outbound messaging, or budget changes. Briefs are drafts for human review.
        </p>
      </div>

      <GrowthIntelligenceSummaryCard summary={data.summary} />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Top signals</p>
          <GrowthSignalsTable signals={data.signals} />
        </div>
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Prioritized opportunities</p>
          <div className="space-y-2">
            {top.map((o) => {
              const sc = scoreGrowthOpportunity(o);
              return (
                <div key={o.id} className="flex flex-wrap items-start justify-between gap-2 rounded-xl border border-white/10 bg-black/35 px-3 py-2">
                  <div>
                    <p className="text-sm text-white">{o.title}</p>
                    <p className="text-[11px] text-zinc-500">{o.opportunityType}</p>
                  </div>
                  <GrowthPriorityBadge level={sc.level} score={sc.totalScore} />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <GrowthOpportunitiesTable opportunities={data.opportunities} />

      <div className="grid gap-4 lg:grid-cols-2">
        <GrowthTrendSummaryCard trends={data.trends} />
        <div className="rounded-xl border border-white/10 bg-black/25 p-4 text-xs text-zinc-500">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-premium-gold">Timeline signal rows</p>
          <p className="mt-2 text-[11px] leading-relaxed">
            {data.timelineSignals.length === 0
              ? "No discrete timeline-derived signals — enable event timeline + ensure EventRecord ingestion."
              : `${data.timelineSignals.length} condensed rows available in API payload (timelineSignals field).`}
          </p>
        </div>
      </div>

      {growthIntelligenceFlags.growthBriefsV1 ? (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Draft briefs (internal)</p>
          <div className="grid gap-4 md:grid-cols-2">
            {top.slice(0, 4).map((o) => (
              <GrowthBriefCard key={o.id} title={o.opportunityType} brief={briefFor(o)} />
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Regional expansion hints</p>
          <GrowthRegionOpportunityCard rows={data.regionOpportunities} />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Trust leverage</p>
          <p className="rounded-xl border border-white/10 bg-black/30 p-4 text-xs text-zinc-400">
            High-trust low-exposure signals: {data.trustLeverage.highTrustLowExposureCount}
            <span className="mt-2 block text-zinc-500">{data.trustLeverage.notes.join(" ")}</span>
          </p>
          <GrowthFunnelInsightsCard funnel={data.funnel} />
        </div>
      </div>
    </section>
  );
}
