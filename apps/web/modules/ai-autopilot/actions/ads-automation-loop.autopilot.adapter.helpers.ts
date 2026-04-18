/**
 * V8 safe refactor — extracted helpers for `ads-automation-loop.autopilot.adapter`.
 * Behavior is intended to match the pre-extraction inline implementation byte-for-byte
 * (same guard order, same `out` order, same payloads). Do not change semantics here without tests.
 */
import { adsAiAutomationFlags, aiAutopilotV1Flags, engineFlags, profitEngineFlags } from "@/config/feature-flags";
import { ADS_AUTOMATION_LOOP_ACTIONS } from "@/modules/ads/ads-automation-loop-bridge";
import type { AdsAutomationLoopResult } from "@/modules/ads/ads-automation-loop.service";
import { getLastAdsAutomationLoopRun } from "@/modules/ads/ads-automation-loop.service";
import {
  getProfitEngineHealth,
  getTopProfitableCampaigns,
  getUnprofitableCampaigns,
} from "@/modules/growth/profit-engine.repository";
import { buildUnifiedSnapshot, computeUnifiedAutopilotConfidence } from "@/modules/growth/unified-learning.service";
import type { ProposedAction } from "../ai-autopilot.types";

/** Same predicate as legacy inline gate — all must pass to emit proposals. */
export function adsLoopAutopilotFeatureGatesOpen(): boolean {
  return !!(
    engineFlags.growthMachineV1 &&
    aiAutopilotV1Flags.aiAutopilotV1 &&
    aiAutopilotV1Flags.growthDomain &&
    adsAiAutomationFlags.aiAdsAutomationLoopV1
  );
}

export async function loadProfitSnapshotsForAutopilotAdapter(): Promise<{
  profitHealth: Awaited<ReturnType<typeof getProfitEngineHealth>> | null;
  topProfitSnaps: Awaited<ReturnType<typeof getTopProfitableCampaigns>>;
  unprofitSnaps: Awaited<ReturnType<typeof getUnprofitableCampaigns>>;
}> {
  if (!profitEngineFlags.profitEnginePersistenceV1) {
    return {
      profitHealth: null,
      topProfitSnaps: [] as Awaited<ReturnType<typeof getTopProfitableCampaigns>>,
      unprofitSnaps: [] as Awaited<ReturnType<typeof getUnprofitableCampaigns>>,
    };
  }
  const [profitHealth, topProfitSnaps, unprofitSnaps] = await Promise.all([
    getProfitEngineHealth().catch(() => null),
    getTopProfitableCampaigns(4).catch(() => []),
    getUnprofitableCampaigns(4).catch(() => []),
  ]);
  return { profitHealth, topProfitSnaps, unprofitSnaps };
}

export function computeSqlLowConversionCaution(
  unified: ReturnType<typeof buildUnifiedSnapshot>,
): boolean {
  return (
    (unified.sqlLowConversionCounts?.cro ?? 0) > 0 || (unified.sqlLowConversionCounts?.retargeting ?? 0) > 0
  );
}

export function buildAdsLoopPayloadBase(input: {
  last: AdsAutomationLoopResult | null;
  profitHealth: Awaited<ReturnType<typeof getProfitEngineHealth>> | null;
  topProfitSnaps: { campaignKey: string }[];
  unprofitSnaps: { campaignKey: string }[];
}): Record<string, unknown> {
  const { last, profitHealth, topProfitSnaps, unprofitSnaps } = input;
  return {
    module: "modules/ads/ads-automation-loop.service#runAdsAutomationLoop",
    mode: "RECOMMENDATION_ONLY",
    safety: "NO_AD_API_NO_AUTO_SPEND_NO_PUBLISH",
    loopRunId: last?.loopRunId ?? null,
    evidenceOverview: last?.evidenceOverview,
    warnings: last?.warnings ?? [],
    persistenceStatus: last?.persistenceStatus,
    profitEngineHealth: profitHealth,
    profitEngineTopPersisted: topProfitSnaps.map((s) => s.campaignKey),
    profitEngineWeakPersisted: unprofitSnaps.map((s) => s.campaignKey),
  };
}

export function findFirstWinnerWithEvidence(last: AdsAutomationLoopResult | null) {
  return last?.classifiedWithEvidence.find(
    (c) => c.classification === "winner" && c.evidenceQuality !== "LOW",
  );
}

export function findFirstWeakWithEvidence(last: AdsAutomationLoopResult | null) {
  return last?.classifiedWithEvidence.find((c) => {
    if (c.classification !== "weak") return false;
    if (c.evidenceQuality === "LOW") return false;
    const thin = c.metricsSnapshot.impressions < 80 && c.metricsSnapshot.clicks < 20;
    const missingConv = c.metricsSnapshot.leads === 0 && c.metricsSnapshot.bookingsCompleted === 0;
    if (thin && missingConv) return false;
    return true;
  });
}

export function computeLowDataCondition(last: AdsAutomationLoopResult | null): boolean {
  return !!(
    last &&
    last.classifiedWithEvidence.length > 0 &&
    last.evidenceOverview.lowEvidenceCampaigns >= last.classifiedWithEvidence.length * 0.6
  );
}

export function computeGeoEligible(last: AdsAutomationLoopResult | null): boolean {
  return !!(
    adsAiAutomationFlags.aiAdsGeoLearningV1 &&
    !!last?.classifiedWithEvidence.some(
      (c) => c.geoSummary?.available && (c.geoSummary.slices?.length ?? 0) >= 2 && c.evidenceQuality !== "LOW",
    )
  );
}

/**
 * Full proposal list — moved from adapter for readability; must stay semantically aligned with legacy behavior.
 */
export async function buildProposedActionsAdsAutomationLoop(): Promise<ProposedAction[]> {
  if (!adsLoopAutopilotFeatureGatesOpen()) {
    return [];
  }

  const last = getLastAdsAutomationLoopRun();
  const { profitHealth, topProfitSnaps, unprofitSnaps } = await loadProfitSnapshotsForAutopilotAdapter();
  const unified = buildUnifiedSnapshot();
  const sqlLowCaution = computeSqlLowConversionCaution(unified);
  const payloadBase = buildAdsLoopPayloadBase({ last, profitHealth, topProfitSnaps, unprofitSnaps });

  const a = ADS_AUTOMATION_LOOP_ACTIONS;
  const out: ProposedAction[] = [];

  const firstWinner = findFirstWinnerWithEvidence(last);
  const firstWeak = findFirstWeakWithEvidence(last);
  const lowData = computeLowDataCondition(last);
  const geoEligible = computeGeoEligible(last);

  out.push({
    domain: "growth",
    entityType: "ads_automation_loop",
    entityId: "loop_review",
    actionType: a.ADS_LOOP_REVIEW.actionType,
    title: a.ADS_LOOP_REVIEW.title,
    summary: a.ADS_LOOP_REVIEW.summary,
    severity: "low",
    riskLevel: "LOW",
    recommendedPayload: { ...payloadBase },
    reasons: {
      confidence: computeUnifiedAutopilotConfidence(last?.confidence ?? 0.62),
      rationale: sqlLowCaution
        ? "Structured weekly growth intelligence — caution: SQL low-conversion signals present in unified snapshot."
        : "Structured weekly growth intelligence",
      evidenceQuality: last?.classifiedWithEvidence[0]?.evidenceQuality,
      unifiedSnapshotQuality: unified.evidenceQualityHint,
      sqlLowConversionCaution: sqlLowCaution,
    },
    subjectUserId: null,
    audience: "admin",
  });

  if (firstWinner) {
    const durableTop = topProfitSnaps.find((s) => s.campaignKey === firstWinner.campaign.campaignKey);
    let winnerConf = Math.min(
      firstWinner.confidence,
      computeUnifiedAutopilotConfidence(firstWinner.confidence),
    );
    if (
      profitEngineFlags.profitEngineConfidenceV1 &&
      durableTop &&
      durableTop.evidenceQuality === "HIGH" &&
      durableTop.ltvToCplRatio != null &&
      durableTop.ltvToCplRatio > 1.2
    ) {
      winnerConf = Math.min(0.92, winnerConf + 0.04);
    }
    if (profitHealth && profitHealth.snapshotRows14d < 4) {
      winnerConf = Math.min(winnerConf, 0.55);
    }
    const winnerSummary =
      profitHealth && profitHealth.snapshotRows14d < 4
        ? `${a.ADS_SCALE_WINNER.summary} (${firstWinner.campaign.campaignKey}) — monitor: durable profit snapshots still thin.`
        : `${a.ADS_SCALE_WINNER.summary} (${firstWinner.campaign.campaignKey})`;
    out.push({
      domain: "growth",
      entityType: "ads_automation_loop",
      entityId: `scale_${firstWinner.campaign.campaignKey}`,
      actionType: a.ADS_SCALE_WINNER.actionType,
      title: a.ADS_SCALE_WINNER.title,
      summary: winnerSummary,
      severity: "low",
      riskLevel: "LOW",
      recommendedPayload: {
        mode: "MANUAL_IN_ADS_MANAGER_ONLY",
        loopRunId: last?.loopRunId,
        evidenceScore: firstWinner.evidenceScore,
        evidenceQuality: firstWinner.evidenceQuality,
        targetMetrics: firstWinner.metricsSnapshot,
        expectedOutcome: "Incremental conversions at controlled test spend",
      },
      reasons: {
        confidence: winnerConf,
        evidenceScore: firstWinner.evidenceScore,
        evidenceQuality: firstWinner.evidenceQuality,
        operatorAction: "Duplicate ad set manually; do not auto-scale.",
        unifiedSnapshotQuality: unified.evidenceQualityHint,
        profitDurableHighConfidence: !!(
          durableTop && durableTop.evidenceQuality === "HIGH" && profitEngineFlags.profitEngineConfidenceV1
        ),
      },
      subjectUserId: null,
      audience: "admin",
    });
  }

  if (lowData) {
    out.push({
      domain: "growth",
      entityType: "ads_automation_loop",
      entityId: "hold_low_data",
      actionType: a.ADS_HOLD_LOW_DATA.actionType,
      title: a.ADS_HOLD_LOW_DATA.title,
      summary: a.ADS_HOLD_LOW_DATA.summary,
      severity: "low",
      riskLevel: "LOW",
      recommendedPayload: {
        loopRunId: last?.loopRunId,
        evidenceOverview: last?.evidenceOverview,
      },
      reasons: {
        confidence: computeUnifiedAutopilotConfidence(0.52),
        rationale: "Many campaigns show LOW evidence quality — gather volume before scaling or pausing.",
      },
      subjectUserId: null,
      audience: "admin",
    });
  }

  if (firstWeak) {
    const durableBad = unprofitSnaps.find((s) => s.campaignKey === firstWeak.campaign.campaignKey);
    const pausePriority =
      profitEngineFlags.profitEngineConfidenceV1 &&
      !!durableBad &&
      durableBad.evidenceQuality === "HIGH" &&
      durableBad.ltvToCplRatio != null &&
      durableBad.ltvToCplRatio < 0.8;
    let pauseConf = firstWeak.confidence;
    if (pausePriority) pauseConf = Math.min(0.9, pauseConf + 0.06);
    if (profitHealth && profitHealth.snapshotRows14d < 4) pauseConf = Math.min(pauseConf, 0.62);
    out.push({
      domain: "growth",
      entityType: "ads_automation_loop",
      entityId: `pause_${firstWeak.campaign.campaignKey}`,
      actionType: a.ADS_PAUSE_LOSER.actionType,
      title: a.ADS_PAUSE_LOSER.title,
      summary: pausePriority
        ? `Priority review: durable profit engine agrees unit economics are weak — ${a.ADS_PAUSE_LOSER.summary} (${firstWeak.campaign.campaignKey})`
        : `${a.ADS_PAUSE_LOSER.summary} (${firstWeak.campaign.campaignKey})`,
      severity: "low",
      riskLevel: "LOW",
      recommendedPayload: {
        mode: "MANUAL_IN_ADS_MANAGER_ONLY",
        loopRunId: last?.loopRunId,
        evidenceScore: firstWeak.evidenceScore,
        evidenceQuality: firstWeak.evidenceQuality,
        targetMetrics: firstWeak.metricsSnapshot,
      },
      reasons: {
        confidence: pauseConf,
        evidenceScore: firstWeak.evidenceScore,
        evidenceQuality: firstWeak.evidenceQuality,
        profitEngineReinforced: pausePriority,
      },
      subjectUserId: null,
      audience: "admin",
    });
  }

  if (geoEligible) {
    out.push({
      domain: "growth",
      entityType: "ads_automation_loop",
      entityId: "geo_reallocate",
      actionType: a.ADS_GEO_REALLOCATE.actionType,
      title: a.ADS_GEO_REALLOCATE.title,
      summary: a.ADS_GEO_REALLOCATE.summary,
      severity: "low",
      riskLevel: "LOW",
      recommendedPayload: {
        loopRunId: last?.loopRunId,
        mode: "MANUAL_GEO_TEST_ONLY",
      },
      reasons: { confidence: 0.55, rationale: "Geo slices detected in events with sufficient evidence." },
      subjectUserId: null,
      audience: "admin",
    });
  }

  out.push({
    domain: "growth",
    entityType: "ads_automation_loop",
    entityId: "test_variant",
    actionType: a.ADS_TEST_NEW_VARIANT.actionType,
    title: a.ADS_TEST_NEW_VARIANT.title,
    summary: a.ADS_TEST_NEW_VARIANT.summary,
    severity: "low",
    riskLevel: "LOW",
    recommendedPayload: { module: "modules/ads/ads-variant-generator.service", loopRunId: last?.loopRunId },
    reasons: { confidence: computeUnifiedAutopilotConfidence(0.53), evidenceOverview: last?.evidenceOverview },
    subjectUserId: null,
    audience: "admin",
  });

  out.push({
    domain: "growth",
    entityType: "ads_automation_loop",
    entityId: "landing",
    actionType: a.LANDING_OPTIMIZATION_RECOMMENDED.actionType,
    title: a.LANDING_OPTIMIZATION_RECOMMENDED.title,
    summary: a.LANDING_OPTIMIZATION_RECOMMENDED.summary,
    severity: "low",
    riskLevel: "LOW",
    recommendedPayload: { module: "modules/ads/landing-feedback-loop.service", loopRunId: last?.loopRunId },
    reasons: { confidence: computeUnifiedAutopilotConfidence(0.52) },
    subjectUserId: null,
    audience: "admin",
  });

  return out;
}
