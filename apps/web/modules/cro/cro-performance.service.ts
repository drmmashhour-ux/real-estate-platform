/**
 * CRO performance evaluators — use unified snapshot + real aggregates when available.
 */

import { buildUnifiedSnapshot } from "@/modules/growth/unified-learning.service";
import { listCroLowConversionSnapshots } from "@/modules/growth/cro-retargeting-durability.repository";
import { negativeSignalQualityFlags } from "@/config/feature-flags";

export type CroMetricEvaluation = {
  conversionRate: number | null;
  confidence: number;
  evidenceScore: number;
  impressions?: number;
  clicks?: number;
  leads?: number;
  bookings?: number;
  evidenceQuality?: string | null;
  reasons?: string[];
  warnings?: string[];
  sourceLabel?: "SQL" | "SNAPSHOT" | "HEURISTIC";
};

export async function evaluateCTA(ctaVariant: string): Promise<CroMetricEvaluation> {
  const u = buildUnifiedSnapshot();
  const bestIdx = u.bestCtas.indexOf(ctaVariant);
  const weakIdx = u.weakCtas.indexOf(ctaVariant);
  const evidenceScore =
    bestIdx >= 0 ? 0.55 + Math.min(0.25, (u.bestCtas.length - bestIdx) * 0.02) : weakIdx >= 0 ? 0.28 : 0.4;
  const confidence = u.evidenceQualityHint === "HIGH" ? 0.75 : u.evidenceQualityHint === "MEDIUM" ? 0.58 : 0.42;
  let base: CroMetricEvaluation = {
    conversionRate: null,
    confidence,
    evidenceScore: weakIdx >= 0 ? Math.min(evidenceScore, 0.35) : evidenceScore,
    sourceLabel: "HEURISTIC",
  };
  if (negativeSignalQualityFlags.negativeSignalQualityV1) {
    try {
      const snaps = await listCroLowConversionSnapshots({ limit: 80 });
      const hit = snaps.find((s) => s.ctaVariant === ctaVariant || s.groupKey.includes(ctaVariant));
      if (hit) {
        base = {
          ...base,
          conversionRate: hit.conversionRate,
          impressions: hit.impressions,
          clicks: hit.clicks,
          leads: hit.leads,
          bookings: hit.bookings,
          evidenceQuality: hit.evidenceQuality,
          reasons: Array.isArray(hit.reasons) ? (hit.reasons as string[]) : undefined,
          warnings: Array.isArray(hit.warnings) ? (hit.warnings as string[]) : undefined,
          sourceLabel: "SNAPSHOT",
          evidenceScore: Math.min(1, Math.max(base.evidenceScore, hit.evidenceScore * 0.9)),
        };
      }
    } catch {
      base.warnings = [...(base.warnings ?? []), "Snapshot read failed — heuristic fallback only."];
    }
  }
  return base;
}

export function evaluateCTASync(ctaVariant: string): CroMetricEvaluation {
  const u = buildUnifiedSnapshot();
  const bestIdx = u.bestCtas.indexOf(ctaVariant);
  const weakIdx = u.weakCtas.indexOf(ctaVariant);
  const evidenceScore =
    bestIdx >= 0 ? 0.55 + Math.min(0.25, (u.bestCtas.length - bestIdx) * 0.02) : weakIdx >= 0 ? 0.28 : 0.4;
  const confidence = u.evidenceQualityHint === "HIGH" ? 0.75 : u.evidenceQualityHint === "MEDIUM" ? 0.58 : 0.42;
  return {
    conversionRate: null,
    confidence,
    evidenceScore: weakIdx >= 0 ? Math.min(evidenceScore, 0.35) : evidenceScore,
    sourceLabel: "HEURISTIC",
  };
}

export async function evaluateTrustImpact(trustVariant: string): Promise<CroMetricEvaluation> {
  const u = buildUnifiedSnapshot();
  const aligned = u.bestHooks.some((h) => h.includes(trustVariant) || trustVariant.includes(h.slice(0, 12)));
  return {
    conversionRate: null,
    confidence: aligned ? 0.62 : 0.48,
    evidenceScore: aligned ? 0.52 : 0.38,
    sourceLabel: "HEURISTIC",
  };
}

export async function evaluateUrgencyImpact(
  urgencyType: "views_today" | "limited_availability" | string,
): Promise<CroMetricEvaluation> {
  void urgencyType;
  const u = buildUnifiedSnapshot();
  return {
    conversionRate: null,
    confidence: 0.5,
    evidenceScore: u.evidenceQualityHint === "HIGH" ? 0.55 : 0.4,
    sourceLabel: "HEURISTIC",
  };
}
