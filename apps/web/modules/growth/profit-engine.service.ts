import type { AdsPerformanceAlert, CampaignAdsMetrics } from "@/modules/ads/ads-performance.service";
import { oneBrainV3Flags, profitEngineFlags } from "@/config/feature-flags";
import { campaignPriorityBias } from "@/modules/platform-core/brain-v3-runtime-cache";
import { ingestUnifiedSignal } from "@/modules/growth/unified-learning.service";
import { estimateCampaignLTV } from "@/services/growth/ltv-prediction.service";
import {
  createProfitLearningSignals,
  createProfitSnapshots,
  createProfitTrendRows,
} from "@/modules/growth/profit-engine.repository";
import { classifyProfitTrendForCampaign } from "@/modules/growth/profit-trend.service";
import type { CampaignPortfolioInput } from "./portfolio-optimization.types";
import type { CampaignProfitMetrics, ProfitRecommendation } from "./profit-engine.types";
import { computeProfitConfidence, mapProfitEvidenceQuality } from "./profit-confidence";

export type { CampaignProfitMetrics, ProfitRecommendation } from "./profit-engine.types";
export { computeProfitConfidence, mapProfitEvidenceQuality } from "./profit-confidence";

function utcDay(d = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export function computeCampaignProfitMetrics(input: {
  campaignId: string;
  cpl: number | null;
  avgLTV: number | null;
  leads: number;
  spend?: number;
  bookings?: number;
}): CampaignProfitMetrics {
  const spend = input.spend ?? 0;
  const bookings = input.bookings ?? 0;

  if (!input.cpl || !input.avgLTV || input.leads < 3) {
    const confidenceScore = computeProfitConfidence({
      leads: input.leads,
      bookings,
      spend,
      ltvEstimate: input.avgLTV,
    });
    return {
      campaignId: input.campaignId,
      cpl: input.cpl,
      avgLTV: input.avgLTV,
      ltvToCplRatio: null,
      profitPerLead: null,
      profitabilityStatus: "INSUFFICIENT_DATA",
      confidence: profitEngineFlags.profitEngineConfidenceV1 ? confidenceScore : 0.3,
      confidenceScore,
      evidenceQuality: mapProfitEvidenceQuality(confidenceScore, input.leads),
      profitLearningSignal: null,
      sampleLeads: input.leads,
      sampleBookings: bookings,
    };
  }

  const ratio = input.avgLTV / input.cpl;
  const profit = input.avgLTV - input.cpl;

  let status: CampaignProfitMetrics["profitabilityStatus"];
  if (ratio >= 2) status = "PROFITABLE";
  else if (ratio >= 1.2) status = "BREAKEVEN";
  else status = "UNPROFITABLE";

  let profitLearningSignal: CampaignProfitMetrics["profitLearningSignal"] = null;
  if (ratio > 1.2) profitLearningSignal = "PROFITABLE";
  else if (ratio < 0.8) profitLearningSignal = "UNPROFITABLE";

  const confidenceScore = computeProfitConfidence({
    leads: input.leads,
    bookings,
    spend,
    ltvEstimate: input.avgLTV,
  });
  const evidenceQuality = mapProfitEvidenceQuality(confidenceScore, input.leads);
  const legacyConfidence = Math.min(1, input.leads / 10);

  return {
    campaignId: input.campaignId,
    cpl: input.cpl,
    avgLTV: input.avgLTV,
    ltvToCplRatio: Number(ratio.toFixed(2)),
    profitPerLead: Number(profit.toFixed(2)),
    profitabilityStatus: status,
    confidence: profitEngineFlags.profitEngineConfidenceV1 ? confidenceScore : legacyConfidence,
    confidenceScore,
    evidenceQuality,
    profitLearningSignal,
    sampleLeads: input.leads,
    sampleBookings: bookings,
  };
}

export function generateProfitRecommendations(
  metrics: CampaignProfitMetrics[],
  conversionRates: Record<string, number>,
): ProfitRecommendation[] {
  return metrics.map((m) => {
    const conversion = conversionRates[m.campaignId] ?? 0;
    const lowConf =
      profitEngineFlags.profitEngineConfidenceV1 &&
      (m.evidenceQuality === "LOW" || (m.confidenceScore ?? m.confidence) < 0.45);

    const v3b = oneBrainV3Flags.oneBrainV3CrossDomainV1 ? campaignPriorityBias(m.campaignId) : 0;
    const v3hint =
      oneBrainV3Flags.oneBrainV3CrossDomainV1 && Math.abs(v3b) > 0.002 ?
        `Brain V3 priority bias ${v3b.toFixed(3)} (cross-domain snapshot; capped — does not override profit math).`
      : undefined;

    if (m.profitabilityStatus === "PROFITABLE" && conversion > 0.05) {
      if (lowConf) {
        return {
          campaignId: m.campaignId,
          action: "MONITOR",
          reason: "Profitable estimate but profit confidence is LOW — gather more leads/bookings before scaling.",
          confidence: m.confidence,
          ...(v3hint ? { crossDomainHint: v3hint } : {}),
        };
      }
      return {
        campaignId: m.campaignId,
        action: "SCALE",
        reason: "High LTV relative to CPL with strong conversion",
        confidence: m.confidence,
        ...(v3hint ? { crossDomainHint: v3hint } : {}),
      };
    }

    if (m.profitabilityStatus === "UNPROFITABLE" && conversion < 0.03) {
      return {
        campaignId: m.campaignId,
        action: "PAUSE",
        reason: "Low profitability and weak conversion",
        confidence: m.confidence,
        ...(v3hint ? { crossDomainHint: v3hint } : {}),
      };
    }

    if (m.profitabilityStatus === "UNPROFITABLE" && conversion >= 0.03) {
      return {
        campaignId: m.campaignId,
        action: "FIX_FUNNEL",
        reason: "Traffic converts but CPL too high → optimize landing",
        confidence: m.confidence,
        ...(v3hint ? { crossDomainHint: v3hint } : {}),
      };
    }

    return {
      campaignId: m.campaignId,
      action: "MONITOR",
      reason: "Insufficient or mixed signals",
      confidence: m.confidence,
      ...(v3hint ? { crossDomainHint: v3hint } : {}),
    };
  });
}

async function persistCampaignProfitV2(
  campaigns: CampaignAdsMetrics[],
  metrics: CampaignProfitMetrics[],
): Promise<void> {
  const byId = new Map(metrics.map((m) => [m.campaignId, m]));
  const snapshots: Parameters<typeof createProfitSnapshots>[0] = [];
  const trends: Parameters<typeof createProfitTrendRows>[0] = [];
  const learning: Parameters<typeof createProfitLearningSignals>[0] = [];

  const day = utcDay();

  for (const c of campaigns) {
    const m = byId.get(c.campaignKey);
    if (!m || m.profitabilityStatus === "INSUFFICIENT_DATA") continue;

    snapshots.push({
      campaignKey: c.campaignKey,
      impressions: c.impressions,
      clicks: c.clicks,
      leads: c.leads,
      bookings: c.bookingsCompleted,
      spend: c.estimatedSpend,
      cpl: c.cpl,
      ltvEstimate: m.avgLTV,
      ltvToCplRatio: m.ltvToCplRatio,
      profitPerLead: m.profitPerLead,
      status: m.profitabilityStatus,
      confidenceScore: m.confidenceScore ?? m.confidence,
      evidenceQuality: m.evidenceQuality ?? "LOW",
      metadata: { source: "profit_engine_v2" },
    });

    trends.push({
      campaignKey: c.campaignKey,
      day,
      profitPerLead: m.profitPerLead,
      ltvToCplRatio: m.ltvToCplRatio,
      spend: c.estimatedSpend,
      leads: c.leads,
      bookings: c.bookingsCompleted,
      metadata: { window: "daily_rollup" },
    });

    const signal = m.profitLearningSignal;
    if (signal === "PROFITABLE" || signal === "UNPROFITABLE") {
      const evidenceScore = Math.min(0.85, 0.35 + (m.confidenceScore ?? m.confidence) * 0.45);
      learning.push({
        campaignKey: c.campaignKey,
        signalType: signal,
        confidenceScore: m.confidenceScore ?? m.confidence,
        evidenceScore,
        reason:
          signal === "PROFITABLE"
            ? `ltvToCplRatio=${m.ltvToCplRatio?.toFixed(2) ?? "—"} (>1.2)`
            : `ltvToCplRatio=${m.ltvToCplRatio?.toFixed(2) ?? "—"} (<0.8)`,
        metadata: { evidenceQuality: m.evidenceQuality },
      });
    }
  }

  if (snapshots.length > 0) await createProfitSnapshots(snapshots);
  if (trends.length > 0) await createProfitTrendRows(trends);
  if (learning.length > 0) await createProfitLearningSignals(learning);
}

/**
 * One row per UTM campaign — async for optional DB persistence + trend labels.
 */
export async function buildCampaignProfitMetrics(campaigns: CampaignAdsMetrics[]): Promise<CampaignProfitMetrics[]> {
  const rows: CampaignProfitMetrics[] = campaigns.map((c) => {
    const avgLTV = estimateCampaignLTV({
      leads: c.leads,
      bookings: c.bookingsCompleted,
      avgBookingValue: null,
    });
    return computeCampaignProfitMetrics({
      campaignId: c.campaignKey,
      cpl: c.cpl,
      avgLTV,
      leads: c.leads,
      spend: c.estimatedSpend,
      bookings: c.bookingsCompleted,
    });
  });

  if (profitEngineFlags.profitEnginePersistenceV1) {
    try {
      await persistCampaignProfitV2(campaigns, rows);
    } catch {
      /* durable path is best-effort */
    }
  }

  if (profitEngineFlags.profitEngineTrendsV1) {
    for (let i = 0; i < rows.length; i++) {
      const m = rows[i];
      if (!m || m.profitabilityStatus === "INSUFFICIENT_DATA") continue;
      try {
        m.profitTrend = await classifyProfitTrendForCampaign(m.campaignId, 14);
      } catch {
        m.profitTrend = "insufficient_data";
      }
    }
  }

  return rows;
}

/**
 * Operator alerts — advisory only; no automation.
 */
export function computeProfitEngineAlerts(
  campaigns: CampaignAdsMetrics[],
  profits: CampaignProfitMetrics[],
): AdsPerformanceAlert[] {
  const profitById = new Map(profits.map((p) => [p.campaignId, p]));
  const out: AdsPerformanceAlert[] = [];

  for (const c of campaigns) {
    const spend = c.estimatedSpend ?? 0;
    const p = profitById.get(c.campaignKey);

    if (spend > 50 && c.leads === 0 && c.impressions > 20) {
      out.push({
        kind: "high_spend_no_leads",
        message: `High attributed spend ($${spend.toFixed(0)}) but no leads for “${c.campaignKey}” — check tracking and landing.`,
        severity: spend > 200 ? "critical" : "warning",
      });
    }

    if (
      p &&
      p.profitabilityStatus === "UNPROFITABLE" &&
      p.ltvToCplRatio != null &&
      p.ltvToCplRatio < 1 &&
      c.leads >= 3
    ) {
      out.push({
        kind: "cpl_exceeds_ltv",
        message: `CPL exceeds estimated LTV for “${c.campaignKey}” (ratio ${p.ltvToCplRatio.toFixed(2)}×) — estimate; review unit economics.`,
        severity: "warning",
      });
    }

    if (
      p?.profitabilityStatus === "PROFITABLE" &&
      c.impressions > 0 &&
      c.impressions < 80 &&
      c.leads >= 3
    ) {
      out.push({
        kind: "profitable_low_traffic",
        message: `“${c.campaignKey}” looks profitable on estimates but traffic is low — monitor before scaling.`,
        severity: "warning",
      });
    }
  }

  return out;
}

/**
 * Feed unified learning from profit classifications (best-effort; never throws).
 * Strong negatives require supported ratio + evidence; weak negatives are damped.
 */
export function maybeIngestProfitEngineIntoUnifiedLearning(metrics: CampaignProfitMetrics[]): void {
  try {
    for (const m of metrics) {
      if (m.profitabilityStatus === "INSUFFICIENT_DATA") continue;
      if ((m.sampleLeads ?? 0) < 3) continue;

      const ratio = m.ltvToCplRatio ?? 0;
      const baseEv = Math.min(0.85, 0.35 + (m.confidenceScore ?? m.confidence) * 0.4);
      const q = m.evidenceQuality ?? "MEDIUM";

      if (m.profitLearningSignal === "PROFITABLE" && m.ltvToCplRatio != null) {
        ingestUnifiedSignal({
          source: "ADS_COST",
          entityId: m.campaignId,
          entityType: "ADS_CAMPAIGN",
          signalType: "WIN",
          confidence: m.confidenceScore ?? m.confidence,
          evidenceScore: baseEv,
          hooks: [`profit_ltv_cpl_ratio:${ratio.toFixed(2)}`],
          createdAt: new Date().toISOString(),
          impressions: 0,
          clicks: 0,
          conversions: 0,
        });
      } else if (m.profitLearningSignal === "UNPROFITABLE" && m.cpl != null && m.avgLTV != null) {
        let conf = m.confidenceScore ?? m.confidence;
        let ev = Math.min(0.75, baseEv);
        if (q === "LOW") {
          conf *= 0.45;
          ev *= 0.55;
        } else if (q === "MEDIUM") {
          conf *= 0.72;
        }
        ingestUnifiedSignal({
          source: "ADS_COST",
          entityId: m.campaignId,
          entityType: "ADS_CAMPAIGN",
          signalType: "WEAK",
          confidence: conf,
          evidenceScore: ev,
          hooks: [`profit_negative_ltv_vs_cpl`],
          createdAt: new Date().toISOString(),
          impressions: 0,
          clicks: 0,
          conversions: 0,
        });
      }
    }
  } catch {
    /* ignore */
  }
}

/** Map ads performance + profit rows to portfolio optimization inputs (no duplicate profit math). */
export function buildPortfolioInputsFromCampaignMetrics(
  campaigns: CampaignAdsMetrics[],
  profitMetrics: CampaignProfitMetrics[],
): CampaignPortfolioInput[] {
  const profitById = new Map(profitMetrics.map((m) => [m.campaignId, m]));
  return campaigns.map((c) => {
    const p = profitById.get(c.campaignKey);
    return {
      campaignKey: c.campaignKey,
      spend: c.estimatedSpend,
      leads: c.leads,
      bookings: c.bookingsCompleted,
      ctr: c.ctrPercent != null ? c.ctrPercent / 100 : null,
      conversionRate: c.conversionRatePercent != null ? c.conversionRatePercent / 100 : null,
      cpl: c.cpl,
      ltvEstimate: p?.avgLTV ?? null,
      ltvToCplRatio: p?.ltvToCplRatio ?? null,
      profitPerLead: p?.profitPerLead ?? null,
      profitabilityStatus: p?.profitabilityStatus,
      confidenceScore: p?.confidenceScore ?? p?.confidence ?? null,
      trend: mapProfitTrendToPortfolio(p?.profitTrend),
    };
  });
}

function mapProfitTrendToPortfolio(
  t: CampaignProfitMetrics["profitTrend"] | undefined,
): CampaignPortfolioInput["trend"] {
  if (!t) return "INSUFFICIENT_DATA";
  const m: Record<string, NonNullable<CampaignPortfolioInput["trend"]>> = {
    improving: "IMPROVING",
    declining: "DECLINING",
    unstable: "UNSTABLE",
    insufficient_data: "INSUFFICIENT_DATA",
  };
  return m[t] ?? "INSUFFICIENT_DATA";
}
