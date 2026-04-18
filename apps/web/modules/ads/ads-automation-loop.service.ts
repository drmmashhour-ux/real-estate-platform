/**
 * LECIPM Full Automation Loop — orchestrates read/analyze/suggest only.
 * Does not call Meta/Google, does not change budgets, does not touch Stripe/booking/ranking.
 */

import { logInfo } from "@/lib/logger";
import { adsAiAutomationFlags, engineFlags, platformCoreFlags } from "@/config/feature-flags";
import { analyzePerformanceAndImprove, type OptimizationResult } from "./ads-ai-optimizer.service";
import {
  classifyCampaignPerformance,
  classifyCampaignPerformanceWithEvidence,
  type ClassifiedAdsBuckets,
  type CampaignClassificationWithEvidence,
} from "./ads-learning-classifier.service";
import {
  hydrateLearningStoreFromDb,
  ingestClassifiedCampaigns,
  persistLearningStoreSnapshots,
} from "./ads-learning-store.service";
import {
  DEFAULT_ADS_SCALING_THRESHOLDS,
  getAdsPerformanceByCampaign,
  getAdsPerformanceSummary,
  type AdsScalingThresholds,
  type CampaignAdsMetrics,
} from "./ads-performance.service";
import { analyzeLandingFeedbackLoop, type LandingOptimizationRecommendation } from "./landing-feedback-loop.service";
import { buildNextAdsTestPlan, type NextAdsTestPlan } from "./ads-test-plan.service";
import { generateVariantsFromWinner, type WinnerVariantBundle } from "./ads-variant-generator.service";
import type { GeoLearningSummary, PersistenceStatus, RecommendationTypeV4 } from "./ads-automation-v4.types";
import { summarizeGeoSignalsForCampaign } from "./ads-geo-learning.service";
import {
  createLoopRun,
  saveCampaignResults,
  saveRecommendations,
  saveLandingInsights,
} from "./ads-automation-persistence.service";

const NS = "[ads:automation:v4]";

export type AdsAutomationRecommendationRow = {
  recommendationType: RecommendationTypeV4;
  targetKey?: string | null;
  targetLabel?: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH";
  confidence: number | null;
  evidenceScore: number | null;
  reasons: string[];
  operatorAction: string;
  metadata?: Record<string, unknown>;
};

export type AdsAutomationLoopResult = {
  summary: string;
  winners: CampaignAdsMetrics[];
  losers: CampaignAdsMetrics[];
  uncertain: CampaignAdsMetrics[];
  optimizations: OptimizationResult;
  newVariants: WinnerVariantBundle[];
  nextTests: NextAdsTestPlan;
  landing: LandingOptimizationRecommendation[];
  weeklyRoutinePointer: "see ads-operator-routine.service";
  confidence: number;
  why: string;
  warnings: string[];
  loopRunId: string | null;
  classifiedWithEvidence: CampaignClassificationWithEvidence[];
  evidenceOverview: { averageEvidenceScore: number; lowEvidenceCampaigns: number };
  persistenceStatus: PersistenceStatus;
  operatorChecklist: { title: string; steps: string[] };
  recommendations: AdsAutomationRecommendationRow[];
};

let lastRun: AdsAutomationLoopResult | null = null;

export function getLastAdsAutomationLoopRun(): AdsAutomationLoopResult | null {
  return lastRun;
}

function buildOperatorChecklist(): { title: string; steps: string[] } {
  return {
    title: "Weekly ads operator checklist",
    steps: [
      "Export network metrics for the same UTM window and reconcile with LECIPM aggregates.",
      "Apply scale/pause only in Ads Manager — never from this dashboard.",
      "Paste variant copy as new ads; keep landing URLs identical for clean reads.",
    ],
  };
}

async function buildGeoMap(
  keys: string[],
  rangeDays: number,
): Promise<Map<string, GeoLearningSummary>> {
  const m = new Map<string, GeoLearningSummary>();
  if (!adsAiAutomationFlags.aiAdsGeoLearningV1) return m;
  for (const k of keys) {
    try {
      m.set(k, await summarizeGeoSignalsForCampaign(k, rangeDays));
    } catch {
      m.set(k, { available: false, reason: "geo_data_unavailable", slices: [] });
    }
  }
  return m;
}

function buildRecommendationRows(input: {
  buckets: ClassifiedAdsBuckets;
  evidence: CampaignClassificationWithEvidence[];
  geo: Map<string, GeoLearningSummary>;
}): AdsAutomationRecommendationRow[] {
  const evMap = new Map(input.evidence.map((e) => [e.campaign.campaignKey, e]));
  const rows: AdsAutomationRecommendationRow[] = [];

  rows.push({
    recommendationType: "ADS_LOOP_REVIEW",
    priority: "LOW",
    confidence: 0.6,
    evidenceScore: 0.55,
    reasons: ["Structured loop completed — review outputs before acting."],
    operatorAction: "Read winners/weak + test plan; confirm in ad platforms.",
  });

  for (const w of input.buckets.winnerCampaigns) {
    const ev = evMap.get(w.campaignKey);
    const geo = input.geo.get(w.campaignKey);
    const canGeo =
      adsAiAutomationFlags.aiAdsGeoLearningV1 && geo?.available && (geo.slices?.length ?? 0) >= 2;
    if (ev && ev.evidenceQuality !== "LOW") {
      rows.push({
        recommendationType: "ADS_SCALE_WINNER",
        targetKey: w.campaignKey,
        targetLabel: w.campaignKey,
        priority: ev.evidenceQuality === "HIGH" ? "HIGH" : "MEDIUM",
        confidence: ev.confidence,
        evidenceScore: ev.evidenceScore,
        reasons: ev.reasons,
        operatorAction: "Duplicate winning ad set with small budget test — manual in Ads Manager.",
        metadata: { expectedOutcome: "Measure incremental conversions at controlled spend." },
      });
    } else if (ev) {
      rows.push({
        recommendationType: "ADS_HOLD_LOW_DATA",
        targetKey: w.campaignKey,
        priority: "LOW",
        confidence: ev.confidence,
        evidenceScore: ev.evidenceScore,
        reasons: [...ev.reasons, "Evidence too thin to recommend scaling."],
        operatorAction: "Gather more clicks/impressions before scaling.",
      });
    }
    if (canGeo && ev && (ev.evidenceQuality === "MEDIUM" || ev.evidenceQuality === "HIGH")) {
      rows.push({
        recommendationType: "ADS_GEO_REALLOCATE",
        targetKey: w.campaignKey,
        priority: "MEDIUM",
        confidence: ev.confidence,
        evidenceScore: ev.evidenceScore,
        reasons: [`Geo slices available (${geo?.slices.length}). Top signal: ${geo?.topSliceLabel ?? "n/a"}.`],
        operatorAction: "Test creative duplication in stronger geo before shifting budget.",
        metadata: { geo: geo?.slices?.slice(0, 5) },
      });
    }
  }

  for (const l of input.buckets.weakCampaigns) {
    const ev = evMap.get(l.campaignKey);
    const thin = (l.impressions ?? 0) < 80 && (l.clicks ?? 0) < 20;
    const missingConv = l.bookingsCompleted === 0 && l.leads === 0;
    if (ev?.evidenceQuality === "LOW" && thin && missingConv) {
      rows.push({
        recommendationType: "ADS_HOLD_LOW_DATA",
        targetKey: l.campaignKey,
        priority: "LOW",
        confidence: ev.confidence,
        evidenceScore: ev.evidenceScore,
        reasons: ["Weak bucket but traffic/attribution too thin for a pause recommendation here."],
        operatorAction: "Confirm metrics in ad network; avoid pause based on LECIPM alone.",
      });
      continue;
    }
    if (ev && ev.evidenceQuality !== "LOW") {
      rows.push({
        recommendationType: "ADS_PAUSE_LOSER",
        targetKey: l.campaignKey,
        priority: "MEDIUM",
        confidence: ev.confidence,
        evidenceScore: ev.evidenceScore,
        reasons: ev.reasons,
        operatorAction: "Reduce or pause in Ads Manager if network data agrees.",
      });
    }
  }

  for (const u of input.buckets.uncertainCampaigns) {
    const ev = evMap.get(u.campaignKey);
    if (ev?.evidenceQuality === "LOW") {
      rows.push({
        recommendationType: "ADS_HOLD_LOW_DATA",
        targetKey: u.campaignKey,
        priority: "LOW",
        confidence: ev.confidence,
        evidenceScore: ev.evidenceScore,
        reasons: ["Uncertain bucket with low evidence — collect more data before changing bids."],
        operatorAction: "Keep budget flat; widen tracking window.",
      });
    }
  }

  rows.push({
    recommendationType: "ADS_TEST_NEW_VARIANT",
    priority: "MEDIUM",
    confidence: 0.58,
    evidenceScore: 0.52,
    reasons: ["Use generated variant packs as drafts only."],
    operatorAction: "Create new ads from variant text; no auto-publish.",
  });

  rows.push({
    recommendationType: "LANDING_OPTIMIZATION_RECOMMENDED",
    priority: "MEDIUM",
    confidence: 0.57,
    evidenceScore: 0.5,
    reasons: ["Landing funnel diagnostics from aggregate events."],
    operatorAction: "Apply CMS changes manually after review.",
  });

  return rows;
}

export async function runAdsAutomationLoop(opts?: {
  rangeDays?: number;
  thresholds?: AdsScalingThresholds;
  estimatedSpend?: number;
  estimatedSpendByCampaign?: Record<string, number>;
}): Promise<AdsAutomationLoopResult> {
  const rangeDays = opts?.rangeDays ?? 14;
  const thresholds = opts?.thresholds ?? DEFAULT_ADS_SCALING_THRESHOLDS;
  const warnings: string[] = [];

  if (adsAiAutomationFlags.aiAdsAutomationPersistenceV1) {
    try {
      await hydrateLearningStoreFromDb();
    } catch (e) {
      warnings.push(`hydrate_learning_failed:${e instanceof Error ? e.message : "unknown"}`);
      logInfo(`${NS} hydrate skipped`, { err: String(e) });
    }
  }

  const byCampaign = await getAdsPerformanceByCampaign(rangeDays, {
    estimatedSpendByCampaign: opts?.estimatedSpendByCampaign,
  });
  const aggregate = await getAdsPerformanceSummary(rangeDays, { estimatedSpend: opts?.estimatedSpend });

  const buckets: ClassifiedAdsBuckets = classifyCampaignPerformance(byCampaign, thresholds);
  ingestClassifiedCampaigns(buckets);

  const classifiedWithEvidence = await classifyCampaignPerformanceWithEvidence(byCampaign, buckets, thresholds, {
    rangeDays,
    geoLearningEnabled: adsAiAutomationFlags.aiAdsGeoLearningV1,
  });

  const geoMap = await buildGeoMap(
    [
      ...new Set(
        [...buckets.winnerCampaigns, ...buckets.weakCampaigns, ...buckets.uncertainCampaigns].map((c) => c.campaignKey),
      ),
    ],
    rangeDays,
  );

  const optimizations = analyzePerformanceAndImprove({
    ctrPercent: aggregate.ctrPercent,
    cpl: aggregate.cpl,
    conversionRatePercent: aggregate.conversionRatePercent,
  });

  const newVariants: WinnerVariantBundle[] = await Promise.all(
    buckets.winnerCampaigns.slice(0, 2).map((w) => generateVariantsFromWinner(w)),
  );

  const variantLabels = newVariants.flatMap((v, i) => [
    `Variant pack ${i + 1}: ${v.headlines[0].slice(0, 48)}…`,
  ]);

  const nextTests = buildNextAdsTestPlan({
    winners: buckets.winnerCampaigns,
    weak: buckets.weakCampaigns,
    uncertain: buckets.uncertainCampaigns,
    variantLabels,
    evidence: classifiedWithEvidence,
    geoByCampaign: geoMap,
  });

  const landing = analyzeLandingFeedbackLoop({
    impressions: aggregate.impressions,
    clicks: aggregate.clicks,
    leads: aggregate.leads,
    bookingsCompleted: aggregate.bookingsCompleted,
  });

  const wCount = buckets.winnerCampaigns.length;
  const lCount = buckets.weakCampaigns.length;
  const summary = `Window ${rangeDays}d: ${byCampaign.length} UTM campaigns · ${wCount} winners · ${lCount} weak · ${buckets.uncertainCampaigns.length} uncertain. Aggregate recommendation: ${optimizations.recommendation}.`;

  const confidence =
    aggregate.impressions >= 200 && aggregate.clicks >= 15
      ? 0.78
      : aggregate.impressions >= 50
        ? 0.58
        : 0.42;

  const why = [
    `Classified with CTR/CPL/conversion thresholds (winner ≥ ${thresholds.winnerCtrMinPercent}% CTR when volume allows).`,
    `Optimization rules: ${optimizations.summary}`,
    landing[0] ? `Landing: ${landing[0].kind} — ${landing[0].evidence}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const avgEv =
    classifiedWithEvidence.length > 0
      ? classifiedWithEvidence.reduce((s, x) => s + x.evidenceScore, 0) / classifiedWithEvidence.length
      : 0;
  const lowEvidenceCampaigns = classifiedWithEvidence.filter((x) => x.evidenceQuality === "LOW").length;

  const persistenceStatus: PersistenceStatus = {
    persisted: false,
    loopRunId: null,
    warnings: [],
    learningPersisted: false,
  };

  const recommendationRows = buildRecommendationRows({ buckets, evidence: classifiedWithEvidence, geo: geoMap });

  if (adsAiAutomationFlags.aiAdsAutomationPersistenceV1) {
    try {
      const featureFlagsSnapshot = {
        growthMachineV1: engineFlags.growthMachineV1,
        aiAdsAutomationPersistenceV1: adsAiAutomationFlags.aiAdsAutomationPersistenceV1,
        aiAdsAutomationHistoryV1: adsAiAutomationFlags.aiAdsAutomationHistoryV1,
        aiAdsGeoLearningV1: adsAiAutomationFlags.aiAdsGeoLearningV1,
      };
      const { id: loopRunId } = await createLoopRun({
        windowDays: rangeDays,
        aggregateInput: { campaignCount: byCampaign.length, opts },
        aggregateFunnel: aggregate as unknown as Record<string, unknown>,
        winnersCount: wCount,
        weakCount: lCount,
        uncertainCount: buckets.uncertainCampaigns.length,
        recommendationCount: recommendationRows.length,
        confidence,
        summary,
        why,
        featureFlagsSnapshot,
        metadata: { warnings },
      });

      await saveCampaignResults(
        loopRunId,
        classifiedWithEvidence.map((c) => ({
          campaignKey: c.campaign.campaignKey,
          campaignLabel: c.campaign.campaignKey,
          classification: c.classification,
          confidence: c.confidence,
          impressions: c.metricsSnapshot.impressions,
          clicks: c.metricsSnapshot.clicks,
          leads: c.metricsSnapshot.leads,
          bookingsStarted: c.metricsSnapshot.bookingsStarted,
          bookingsCompleted: c.metricsSnapshot.bookingsCompleted,
          spend: c.metricsSnapshot.spend,
          ctr: c.metricsSnapshot.ctrPercent,
          cpl: c.metricsSnapshot.cpl,
          conversionRate: c.metricsSnapshot.conversionRatePercent,
          geoSummary: c.geoSummary ?? undefined,
          evidence: {
            evidenceScore: c.evidenceScore,
            evidenceQuality: c.evidenceQuality,
            reasons: c.reasons,
            warnings: c.warnings,
            missingData: c.missingData,
          },
        })),
      );

      await saveRecommendations(
        loopRunId,
        recommendationRows.map((r) => ({
          recommendationType: r.recommendationType,
          targetKey: r.targetKey,
          targetLabel: r.targetLabel,
          priority: r.priority,
          confidence: r.confidence,
          evidenceScore: r.evidenceScore,
          reasons: r.reasons,
          operatorAction: r.operatorAction,
          metadata: r.metadata,
        })),
      );

      await saveLandingInsights(
        loopRunId,
        landing.map((l) => ({
          segment: null,
          issueType: l.issueType,
          severity: l.severity,
          confidence: l.confidence,
          evidenceScore: l.evidenceScore,
          views: aggregate.impressions,
          clicks: aggregate.clicks,
          leads: aggregate.leads,
          bookings: aggregate.bookingsCompleted,
          reasons: l.reasons,
          recommendations: l.recommendedExperiments,
        })),
      );

      const learn = await persistLearningStoreSnapshots(buckets, classifiedWithEvidence);
      persistenceStatus.persisted = true;
      persistenceStatus.loopRunId = loopRunId;
      persistenceStatus.learningPersisted = learn.ok;
      persistenceStatus.warnings.push(...learn.warnings);
      logInfo(`${NS} persisted loop`, { loopRunId, recommendations: recommendationRows.length });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "persist_failed";
      warnings.push(`persistence:${msg}`);
      persistenceStatus.warnings.push(msg);
      logInfo(`${NS} persistence failed`, { err: String(e) });
    }
  }

  const result: AdsAutomationLoopResult = {
    summary,
    winners: buckets.winnerCampaigns,
    losers: buckets.weakCampaigns,
    uncertain: buckets.uncertainCampaigns,
    optimizations,
    newVariants,
    nextTests,
    landing,
    weeklyRoutinePointer: "see ads-operator-routine.service",
    confidence,
    why,
    warnings: [...warnings, ...persistenceStatus.warnings],
    loopRunId: persistenceStatus.loopRunId,
    classifiedWithEvidence,
    evidenceOverview: { averageEvidenceScore: avgEv, lowEvidenceCampaigns },
    persistenceStatus,
    operatorChecklist: buildOperatorChecklist(),
    recommendations: recommendationRows,
  };

  lastRun = result;

  if (platformCoreFlags.platformCoreV1 && platformCoreFlags.platformCoreAdsIngestionV1) {
    try {
      const { runAdsV4PlatformCoreIngestion } = await import(
        "@/modules/platform-core/platform-core-bridges/ads-ingestion.orchestrator"
      );
      await runAdsV4PlatformCoreIngestion(result);
    } catch (err) {
      console.warn("[ads:v4→platform-core] ingestion failed", err);
    }
  }

  return result;
}
