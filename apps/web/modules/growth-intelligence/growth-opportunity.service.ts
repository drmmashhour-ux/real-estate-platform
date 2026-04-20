import type {
  GrowthOpportunity,
  GrowthOpportunityType,
  GrowthSeverity,
  GrowthSignal,
  GrowthSignalType,
  GrowthSnapshot,
} from "./growth.types";
import { prioritizeGrowthOpportunities as prioritizeFn } from "./growth-priority.service";

export type SummarizeGrowthSignalsResult = {
  signals: GrowthSignal[];
  countsByType: Partial<Record<GrowthSignalType, number>>;
};

export function summarizeGrowthSignals(params: {
  snapshot: GrowthSnapshot;
  signals: GrowthSignal[];
}): SummarizeGrowthSignalsResult {
  const counts: Partial<Record<GrowthSignalType, number>> = {};
  for (const s of params.signals) {
    counts[s.signalType] = (counts[s.signalType] ?? 0) + 1;
  }
  const severityRank: Record<GrowthSeverity, number> = { critical: 3, warning: 2, info: 1 };
  const signals = [...params.signals].sort((a, b) => severityRank[b.severity] - severityRank[a.severity]);
  return { signals, countsByType: counts };
}

function opportunityTypeForSignal(t: GrowthSignalType): GrowthOpportunityType {
  const map: Record<GrowthSignalType, GrowthOpportunityType> = {
    seo_gap: "recommend_seo_refresh",
    content_gap: "create_content_brief",
    low_conversion_page: "improve_cta",
    high_intent_search_opportunity: "create_programmatic_page_brief",
    underexposed_listing_cluster: "promote_listing_cluster",
    high_performing_region: "promote_region",
    demand_supply_imbalance: "promote_region",
    lead_form_dropoff: "improve_cta",
    campaign_efficiency_shift: "recommend_campaign_review",
    trust_conversion_opportunity: "recommend_trust_upgrade",
    trend_reversal: "recommend_campaign_review",
    stalled_funnel: "recommend_funnel_fix",
    repeat_dropoff_pattern: "recommend_reactivation_strategy",
  };
  return map[t] ?? "improve_page_copy";
}

function timelineMetaFromSignal(sig: GrowthSignal): Record<string, unknown> {
  const m = sig.metadata;
  const out: Record<string, unknown> = {};
  if (m.timelineDerived === true) out.timelineDerived = true;
  if (typeof m.worseningScore === "number") out.worseningScore = m.worseningScore;
  if (typeof m.timelinePersistenceScore === "number") out.timelinePersistenceScore = m.timelinePersistenceScore;
  if (typeof m.currPositive === "number") out.currPositive = m.currPositive;
  if (typeof m.prevPositive === "number") out.prevPositive = m.prevPositive;
  if (typeof m.dropRatio === "number") out.dropRatio = m.dropRatio;
  if (typeof m.stalledWorkflowCount === "number") out.stalledWorkflowCount = m.stalledWorkflowCount;
  if (typeof m.rejections30d === "number") out.rejections30d = m.rejections30d;
  if (typeof m.documentEntityId === "string") out.documentEntityId = m.documentEntityId;
  return out;
}

export function buildGrowthOpportunities(params: {
  snapshot: GrowthSnapshot;
  signals: GrowthSignal[];
}): GrowthOpportunity[] {
  const out: GrowthOpportunity[] = [];
  const seen = new Set<string>();
  for (const sig of params.signals) {
    const oppType = opportunityTypeForSignal(sig.signalType);
    const id = stableOppId(sig.id, oppType);
    if (seen.has(id)) continue;
    seen.add(id);
    out.push({
      id,
      opportunityType: oppType,
      severity: sig.severity,
      title: briefTitleFor(oppType, sig),
      explanation: sig.explanation,
      entityType: sig.entityType,
      entityId: sig.entityId,
      region: sig.region,
      locale: sig.locale,
      country: sig.country,
      signalIds: [sig.id],
      createdAt: params.snapshot.collectedAt,
      metadata: {
        signalType: sig.signalType as string,
        snapshotId: params.snapshot.id,
        ...timelineMetaFromSignal(sig),
      },
      references: sig.references,
    });
  }
  return out;
}

function stableOppId(signalId: string, oppType: string): string {
  return `opp_${oppType}_${signalId.replace(/[^a-zA-Z0-9_:-]/g, "").slice(0, 120)}`;
}

function briefTitleFor(oppType: GrowthOpportunityType, sig: GrowthSignal): string {
  switch (oppType) {
    case "create_content_brief":
      return `Draft editorial brief — ${sig.title}`;
    case "create_programmatic_page_brief":
      return `Programmatic landing brief — ${sig.region ?? sig.title}`;
    case "improve_cta":
      return `CTA / funnel review — ${sig.entityId ?? sig.title}`;
    case "promote_region":
      return `Regional promotion review — ${sig.region ?? "market"}`;
    case "promote_listing_cluster":
      return `Listing visibility cluster — inventory attention`;
    case "prioritize_broker_leads":
      return `Broker lead prioritization — advisory`;
    case "recommend_trust_upgrade":
      return `Trust/completion prompts — improve readiness`;
    case "recommend_seo_refresh":
      return `SEO refresh brief — localized surfaces`;
    case "recommend_campaign_review":
      return `Campaign efficiency review — advisory`;
    case "recommend_funnel_fix":
      return `Funnel completion review — ${sig.title}`;
    case "recommend_reactivation_strategy":
      return `Reactivation / intake review — ${sig.title}`;
    case "improve_page_copy":
    default:
      return `Copy improvement brief — ${sig.title}`;
  }
}

export function prioritizeGrowthOpportunities(opportunities: GrowthOpportunity[]): GrowthOpportunity[] {
  return prioritizeFn(opportunities);
}
