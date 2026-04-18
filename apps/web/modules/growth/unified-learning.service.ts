/**
 * V4.5 unified learning — in-memory fusion of AB, CRO, Ads, Retargeting (real events only).
 * Conflict order: AB_TEST > CRO > ADS > RETARGETING.
 */

import { logInfo } from "@/lib/logger";
import {
  croRetargetingDurabilityFlags,
  croRetargetingLearningFlags,
  marketplaceIntelligenceFlags,
  negativeSignalQualityFlags,
  portfolioOptimizationFlags,
} from "@/config/feature-flags";
import type { CampaignPortfolioInput, PortfolioOptimizationSummary } from "./portfolio-optimization.types";
import { getRecentCroSignalSummary, getRecentRetargetingSignalSummary } from "./cro-retargeting-learning.repository";
import { detectLowConversionRetargetingMessages, detectLowConversionSurfaces } from "./cro-low-conversion.service";
import { computeEvidenceScore } from "@/modules/ads/ads-evidence-score.service";
import { getLearningMemoryHighlights } from "@/modules/ads/ads-learning-store.service";
import type { EvidenceQuality } from "@/modules/ads/ads-automation-v4.types";
import { bumpRetargetingBooking } from "./retargeting-performance.service";

export type UnifiedSignalSource =
  | "AB_TEST"
  | "CRO"
  | "ADS"
  /** Profit / LTV vs CPL layer (additive; conservative weight) */
  | "ADS_COST"
  /** Portfolio reallocation hints (additive; weaker than single-campaign ADS) */
  | "ADS_PORTFOLIO"
  | "RETARGETING"
  | "MARKETPLACE"
  /** Operator assistant lifecycle feedback (conservative weight). */
  | "UNIFIED";

export type UnifiedSignalType =
  | "HIGH_CONVERSION"
  | "LOW_CONVERSION"
  | "WIN"
  | "WEAK"
  | "TRUST_LIFT"
  | "URGENCY_LIFT";

export type IngestUnifiedSignalInput = {
  source: UnifiedSignalSource;
  entityId: string;
  entityType: string;
  signalType: UnifiedSignalType;
  confidence: number;
  evidenceScore: number;
  ctas?: string[];
  hooks?: string[];
  createdAt: string;
  /** Optional counters for threshold gating */
  impressions?: number;
  clicks?: number;
  conversions?: number;
};

const MIN_IMPRESSIONS = 100;
const MIN_CLICKS = 20;
const MIN_CONVERSIONS = 5;

const WEIGHT: Record<UnifiedSignalSource, number> = {
  AB_TEST: 4,
  CRO: 3,
  ADS: 2,
  ADS_COST: 1.6,
  ADS_PORTFOLIO: 1.2,
  RETARGETING: 1,
  MARKETPLACE: 0.35,
  UNIFIED: 0.45,
};

type Aggregated = {
  source: UnifiedSignalSource;
  ctas: Map<string, number>;
  hooks: Map<string, number>;
  weakCtAs: Map<string, number>;
  weakHooks: Map<string, number>;
  score: number;
};

const aggregates: Map<string, Aggregated> = new Map();

/** Filled by `loadPersistentCroRetargetingLearning()` for `buildUnifiedSnapshot()` (additive blend). */
type DurabilityBlendHint = {
  persistedCroTotal: number;
  persistedRtTotal: number;
  sqlLowCroRows: number;
  sqlLowRtRows: number;
  extraWeakHooks: Map<string, number>;
  notes: string[];
  warnings: string[];
  loadedAt: string;
};

let durabilityBlendHint: DurabilityBlendHint | null = null;

function passesThresholds(input: IngestUnifiedSignalInput): boolean {
  const imp = input.impressions ?? 0;
  const clk = input.clicks ?? 0;
  const conv = input.conversions ?? 0;
  if (imp > 0 && imp < MIN_IMPRESSIONS) return false;
  if (clk > 0 && clk < MIN_CLICKS) return false;
  if (conv > 0 && conv < MIN_CONVERSIONS) return false;
  if (imp === 0 && clk === 0 && conv === 0) {
    if (input.source === "AB_TEST") return true;
    if (input.source === "MARKETPLACE") {
      return input.evidenceScore >= 0.26 && input.confidence >= 0.4;
    }
    if (input.source === "ADS_COST") {
      return input.evidenceScore >= 0.28 && input.confidence >= 0.3;
    }
    if (input.source === "UNIFIED") {
      return input.evidenceScore >= 0.45 && input.confidence >= 0.35;
    }
    return input.evidenceScore >= 0.45;
  }
  return true;
}

/**
 * Ingest a learning signal (typically after threshold checks). No-op if gated.
 */
export function ingestUnifiedSignal(input: IngestUnifiedSignalInput): { accepted: boolean; reason?: string } {
  if (!passesThresholds(input)) {
    return { accepted: false, reason: "below_volume_thresholds" };
  }

  const w = WEIGHT[input.source];
  const aggKey = input.entityType + ":" + input.entityId;
  let agg = aggregates.get(aggKey);
  if (!agg) {
    agg = {
      source: input.source,
      ctas: new Map(),
      hooks: new Map(),
      weakCtAs: new Map(),
      weakHooks: new Map(),
      score: 0,
    };
    aggregates.set(aggKey, agg);
  }

  const bump = (signal: UnifiedSignalType) => {
    const sign =
      signal === "HIGH_CONVERSION" || signal === "WIN" || signal === "TRUST_LIFT" || signal === "URGENCY_LIFT"
        ? 1
        : -1;
    agg!.score += sign * w * input.evidenceScore;
  };
  bump(input.signalType);

  for (const c of input.ctas ?? []) {
    const k = c.trim();
    if (!k) continue;
    const m = input.signalType === "LOW_CONVERSION" || input.signalType === "WEAK" ? agg!.weakCtAs : agg!.ctas;
    m.set(k, (m.get(k) ?? 0) + w);
  }
  for (const h of input.hooks ?? []) {
    const k = h.trim();
    if (!k) continue;
    const m = input.signalType === "LOW_CONVERSION" || input.signalType === "WEAK" ? agg!.weakHooks : agg!.hooks;
    m.set(k, (m.get(k) ?? 0) + w);
  }

  logInfo("[unified-learning] ingest", {
    source: input.source,
    signalType: input.signalType,
    entityId: input.entityId,
  });

  return { accepted: true };
}

export type UnifiedLearningSnapshot = {
  bestCtas: string[];
  weakCtas: string[];
  bestHooks: string[];
  weakHooks: string[];
  /** Precedence-merged primary CTA suggestion */
  preferredPrimaryCta: string | null;
  sources: Partial<Record<UnifiedSignalSource, { weight: number; topCta: string | null }>>;
  evidenceQualityHint: EvidenceQuality;
  /** Phase 2 — narrative + sparse-data warnings */
  notes?: string[];
  warnings?: string[];
  persistedCroSignalTotal?: number;
  persistedRetargetingSignalTotal?: number;
  sqlLowConversionCounts?: { cro: number; retargeting: number };
  snapshotQuality?: {
    durableBlendLoaded: boolean;
    sqlLowConversionTagged: boolean;
    blendLoadedAt?: string;
  };
};

/**
 * Hydrate durable summaries + conservative SQL negatives before `buildUnifiedSnapshot()` (SSR / jobs).
 */
export async function loadPersistentCroRetargetingLearning(): Promise<void> {
  const persist =
    croRetargetingLearningFlags.croRetargetingPersistenceV1 ||
    croRetargetingDurabilityFlags.croRetargetingDurabilityV1;
  if (!persist) {
    durabilityBlendHint = null;
    return;
  }
  const [croS, rtS] = await Promise.all([getRecentCroSignalSummary(14), getRecentRetargetingSignalSummary(14)]);
  const notes: string[] = [];
  const warn: string[] = [];
  let sqlCro = 0;
  let sqlRt = 0;
  const extraWeakHooks = new Map<string, number>();

  const sqlGate =
    negativeSignalQualityFlags.negativeSignalQualityV1 || croRetargetingLearningFlags.croSqlLowConversionV1;
  if (sqlGate) {
    const [croLow, rtLow] = await Promise.all([
      detectLowConversionSurfaces(14),
      detectLowConversionRetargetingMessages(14),
    ]);
    for (const row of croLow) {
      if (row.signalType === "LOW_CONVERSION") sqlCro += 1;
    }
    for (const row of rtLow) {
      if (row.signalType === "LOW_CONVERSION") sqlRt += 1;
      if (
        row.signalType === "LOW_CONVERSION" &&
        row.entityKind === "RETARGETING_MESSAGE" &&
        row.evidenceQuality !== "LOW"
      ) {
        const mid = row.entityId.includes(":") ? row.entityId.split(":").pop() ?? row.entityId : row.entityId;
        extraWeakHooks.set(
          `retargeting:${mid}`,
          (extraWeakHooks.get(`retargeting:${mid}`) ?? 0) + row.evidenceScore * WEIGHT.RETARGETING * 0.3,
        );
      }
    }
    if (croLow.some((r) => r.signalType === "INSUFFICIENT_DATA")) {
      warn.push("CRO aggregate: insufficient volume for strong LOW_CONVERSION claims.");
    }
    if (rtLow.some((r) => r.signalType === "INSUFFICIENT_DATA")) {
      warn.push("Retargeting: insufficient persisted performance for strong weak-message claims.");
    }
  }

  notes.push(`Durable signals (14d): CRO rows=${croS.total}, retargeting rows=${rtS.total}.`);

  durabilityBlendHint = {
    persistedCroTotal: croS.total,
    persistedRtTotal: rtS.total,
    sqlLowCroRows: sqlCro,
    sqlLowRtRows: sqlRt,
    extraWeakHooks,
    notes,
    warnings: warn,
    loadedAt: new Date().toISOString(),
  };
}

export type NegativeSignalBatchRow = {
  source: UnifiedSignalSource;
  entityId: string;
  entityType: string;
  signalType: UnifiedSignalType;
  confidence: number;
  evidenceScore: number;
  ctas?: string[];
  hooks?: string[];
  impressions?: number;
  clicks?: number;
  conversions?: number;
};

export function ingestNegativeSignalBatch(rows: NegativeSignalBatchRow[]): { accepted: number; skipped: number } {
  let accepted = 0;
  let skipped = 0;
  for (const r of rows) {
    const weak = r.signalType === "LOW_CONVERSION" || r.signalType === "WEAK";
    const damp =
      weak && (r.confidence < 0.45 || r.evidenceScore < 0.35) ? 0.55
      : weak ? 0.72
      : 1;
    const res = ingestUnifiedSignal({
      ...r,
      confidence: r.confidence * damp,
      evidenceScore: r.evidenceScore * damp,
      createdAt: new Date().toISOString(),
    });
    if (res.accepted) accepted += 1;
    else skipped += 1;
  }
  return { accepted, skipped };
}

export async function getUnifiedDurabilityHealth(): Promise<{
  persistenceEnabled: boolean;
  croSignals14d: number;
  retargetingSignals14d: number;
  blendLoadedAt: string | null;
  sqlLowCro: number;
  sqlLowRetargeting: number;
}> {
  const persist =
    croRetargetingLearningFlags.croRetargetingPersistenceV1 ||
    croRetargetingDurabilityFlags.croRetargetingDurabilityV1;
  if (!persist) {
    return {
      persistenceEnabled: false,
      croSignals14d: 0,
      retargetingSignals14d: 0,
      blendLoadedAt: null,
      sqlLowCro: 0,
      sqlLowRetargeting: 0,
    };
  }
  const [croS, rtS] = await Promise.all([getRecentCroSignalSummary(14), getRecentRetargetingSignalSummary(14)]);
  return {
    persistenceEnabled: true,
    croSignals14d: croS.total,
    retargetingSignals14d: rtS.total,
    blendLoadedAt: durabilityBlendHint?.loadedAt ?? null,
    sqlLowCro: durabilityBlendHint?.sqlLowCroRows ?? 0,
    sqlLowRetargeting: durabilityBlendHint?.sqlLowRtRows ?? 0,
  };
}

function topByScore(m: Map<string, number>, limit: number): string[] {
  return [...m.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([k]) => k);
}

/**
 * Merge Ads learning + aggregated unified signals. Conflict order for labels: AB_TEST > CRO > ADS > RETARGETING.
 */
export function buildUnifiedSnapshot(): UnifiedLearningSnapshot {
  const notes: string[] = [];
  const warnings: string[] = [];
  let persistedCroSignalTotal: number | undefined;
  let persistedRetargetingSignalTotal: number | undefined;
  let sqlCroN = 0;
  let sqlRtN = 0;
  let cache = false;

  if (durabilityBlendHint) {
    cache = true;
    notes.push(...durabilityBlendHint.notes);
    warnings.push(...durabilityBlendHint.warnings);
    persistedCroSignalTotal = durabilityBlendHint.persistedCroTotal;
    persistedRetargetingSignalTotal = durabilityBlendHint.persistedRtTotal;
    sqlCroN = durabilityBlendHint.sqlLowCroRows;
    sqlRtN = durabilityBlendHint.sqlLowRtRows;
  }

  const ads = getLearningMemoryHighlights();
  const mergedCtas = new Map<string, number>();
  const mergedWeakCtas = new Map<string, number>();
  const hookScores = new Map<string, number>();
  const weakHooks = new Map<string, number>();

  for (const agg of aggregates.values()) {
    const w = WEIGHT[agg.source];
    for (const [k, c] of agg.ctas) mergedCtas.set(k, (mergedCtas.get(k) ?? 0) + c * w);
    for (const [k, c] of agg.weakCtAs) mergedWeakCtas.set(k, (mergedWeakCtas.get(k) ?? 0) + c * w);
    for (const [k, c] of agg.hooks) hookScores.set(k, (hookScores.get(k) ?? 0) + c * w);
    for (const [k, c] of agg.weakHooks) weakHooks.set(k, (weakHooks.get(k) ?? 0) + c * w);
  }

  for (const t of ads.topCtas) mergedCtas.set(t, (mergedCtas.get(t) ?? 0) + WEIGHT.ADS * 2);
  for (const t of ads.weakCtas) mergedWeakCtas.set(t, (mergedWeakCtas.get(t) ?? 0) + WEIGHT.ADS * 2);
  for (const h of ads.topHooks) hookScores.set(h, (hookScores.get(h) ?? 0) + WEIGHT.ADS * 2);
  for (const h of ads.hooksToAvoid) weakHooks.set(h, (weakHooks.get(h) ?? 0) + WEIGHT.ADS);

  const bestCtas = topByScore(mergedCtas, 14);
  const weakCtaList = topByScore(mergedWeakCtas, 14);
  const bestHooks = topByScore(hookScores, 14);
  const weakHookList = topByScore(weakHooks, 8);

  const weakSet = new Set(weakCtaList);
  let preferredPrimaryCta: string | null = null;
  for (const c of bestCtas) {
    if (!weakSet.has(c)) {
      preferredPrimaryCta = c;
      break;
    }
  }
  if (!preferredPrimaryCta) preferredPrimaryCta = bestCtas[0] ?? null;

  const sources: UnifiedLearningSnapshot["sources"] = {};
  const order: UnifiedSignalSource[] = [
    "AB_TEST",
    "CRO",
    "ADS",
    "ADS_COST",
    "ADS_PORTFOLIO",
    "RETARGETING",
    "MARKETPLACE",
    "UNIFIED",
  ];
  for (const src of order) {
    const fromAgg = [...aggregates.values()].filter((a) => a.source === src);
    let top: string | null = null;
    let best = 0;
    for (const a of fromAgg) {
      for (const [k, c] of a.ctas) {
        const sc = c * WEIGHT[src];
        if (sc > best) {
          best = sc;
          top = k;
        }
      }
    }
    if (!top && src === "ADS" && ads.topCtas[0]) top = ads.topCtas[0] ?? null;
    sources[src] = { weight: WEIGHT[src], topCta: top };
  }

  const ev = computeEvidenceScore({
    impressions: MIN_IMPRESSIONS,
    clicks: MIN_CLICKS,
    leads: MIN_CONVERSIONS,
    spendKnown: true,
    cplComputable: true,
    conversionComputable: true,
    windowDays: 14,
  });
  let evidenceQualityHint: EvidenceQuality = ev >= 0.65 ? "HIGH" : ev >= 0.38 ? "MEDIUM" : "LOW";
  if (warnings.length > 0 && evidenceQualityHint === "HIGH") evidenceQualityHint = "MEDIUM";
  if (durabilityBlendHint && durabilityBlendHint.persistedCroTotal + durabilityBlendHint.persistedRtTotal < 4) {
    if (evidenceQualityHint === "HIGH") evidenceQualityHint = "MEDIUM";
    warnings.push("Few durable CRO/retargeting signal rows in window — treat rankings as exploratory.");
  }

  return {
    bestCtas,
    weakCtas: weakCtaList,
    bestHooks,
    weakHooks: weakHookList,
    preferredPrimaryCta,
    sources,
    evidenceQualityHint,
    notes: notes.length ? notes : undefined,
    warnings: warnings.length ? warnings : undefined,
    persistedCroSignalTotal,
    persistedRetargetingSignalTotal,
    sqlLowConversionCounts:
      cache ? { cro: sqlCroN, retargeting: sqlRtN } : undefined,
    snapshotQuality: cache
      ? {
          durableBlendLoaded: true,
          sqlLowConversionTagged: sqlCroN + sqlRtN > 0,
          blendLoadedAt: durabilityBlendHint?.loadedAt,
        }
      : undefined,
  };
}

export function computeEvidenceForUnified(input: {
  impressions: number;
  clicks: number;
  leads: number;
  conversions: number;
}): number {
  return computeEvidenceScore({
    impressions: input.impressions,
    clicks: input.clicks,
    leads: input.leads,
    spendKnown: true,
    cplComputable: input.leads > 0,
    conversionComputable: input.conversions > 0,
    windowDays: 14,
  });
}

/** Called from tracking pipeline — best-effort, never throws. */
export function maybeIngestUnifiedFromGrowthMetadata(
  eventName: string,
  metadata: Record<string, unknown> | undefined,
): void {
  try {
    if (!metadata || typeof metadata !== "object") return;
    const cro = metadata.cro as Record<string, unknown> | undefined;
    const rt = metadata.retargeting as Record<string, unknown> | undefined;

    if (eventName === "lead_capture" && cro && cro.trustBlock === true) {
      ingestUnifiedSignal({
        source: "CRO",
        entityId: String(cro.ctaId ?? "trust"),
        entityType: "LANDING",
        signalType: "TRUST_LIFT",
        confidence: 0.65,
        evidenceScore: 0.55,
        hooks: [String(cro.trustVariant ?? "trust_block")],
        ctas: cro.ctaVariant ? [String(cro.ctaVariant)] : [],
        createdAt: new Date().toISOString(),
        impressions: 0,
        clicks: 0,
        conversions: 0,
      });
    }

    if (eventName === "booking_started" && cro) {
      ingestUnifiedSignal({
        source: "CRO",
        entityId: String(cro.ctaId ?? "cta"),
        entityType: "LANDING",
        signalType: "HIGH_CONVERSION",
        confidence: 0.72,
        evidenceScore: 0.62,
        ctas: cro.ctaVariant ? [String(cro.ctaVariant)] : [],
        hooks: [],
        createdAt: new Date().toISOString(),
      });
      if (cro.urgencyShown === true) {
        ingestUnifiedSignal({
          source: "CRO",
          entityId: String(cro.ctaId ?? "urgency"),
          entityType: "LANDING",
          signalType: "URGENCY_LIFT",
          confidence: 0.64,
          evidenceScore: 0.52,
          hooks: [String(cro.urgencyType ?? "urgency")],
          ctas: cro.ctaVariant ? [String(cro.ctaVariant)] : [],
          createdAt: new Date().toISOString(),
        });
      }
    }

    if (eventName === "booking_completed" && rt?.messageId) {
      bumpRetargetingBooking(String(rt.messageId), typeof rt.segment === "string" ? rt.segment : undefined);
      ingestUnifiedSignal({
        source: "RETARGETING",
        entityId: String(rt.messageId),
        entityType: "VARIANT",
        signalType: "WIN",
        confidence: 0.8,
        evidenceScore: 0.75,
        ctas: rt.messageVariant ? [String(rt.messageVariant)] : [],
        hooks: [],
        createdAt: new Date().toISOString(),
      });
    }

  } catch {
    /* ignore */
  }
}

/**
 * Best-effort marketplace outcomes → unified learning (low weight; never overwrites CRO/AB).
 * Called after a successful intelligence run.
 */
export function maybeIngestMarketplaceLearning(input: {
  listingId: string;
  rankingScore: number;
  trustScore: number;
  fraudHigh: boolean;
  pricingAdjusted: boolean;
}): void {
  try {
    if (!marketplaceIntelligenceFlags.marketplaceIntelligenceV1) return;

    if (input.fraudHigh) {
      ingestUnifiedSignal({
        source: "MARKETPLACE",
        entityId: input.listingId,
        entityType: "BNHUB_LISTING",
        signalType: "WEAK",
        confidence: 0.52,
        evidenceScore: 0.35,
        hooks: ["marketplace_trust_risk"],
        createdAt: new Date().toISOString(),
        impressions: 0,
        clicks: 0,
        conversions: 0,
      });
      return;
    }

    if (input.rankingScore >= 76 && input.trustScore >= 62) {
      ingestUnifiedSignal({
        source: "MARKETPLACE",
        entityId: input.listingId,
        entityType: "BNHUB_LISTING",
        signalType: "HIGH_CONVERSION",
        confidence: 0.48,
        evidenceScore: 0.32,
        hooks: ["marketplace_quality_fit"],
        createdAt: new Date().toISOString(),
        impressions: 0,
        clicks: 0,
        conversions: 0,
      });
    }

    if (input.pricingAdjusted) {
      ingestUnifiedSignal({
        source: "MARKETPLACE",
        entityId: input.listingId,
        entityType: "BNHUB_LISTING",
        signalType: "WIN",
        confidence: 0.42,
        evidenceScore: 0.28,
        hooks: ["marketplace_price_fit_candidate"],
        createdAt: new Date().toISOString(),
        impressions: 0,
        clicks: 0,
        conversions: 0,
      });
    }
  } catch {
    /* ignore */
  }
}

/** Autopilot: cap/boost confidence from unified snapshot (recommendation-only; never executes actions). */
export function computeUnifiedAutopilotConfidence(base: number): number {
  const safeBase = typeof base === "number" && Number.isFinite(base) ? base : 0.5;
  const u = buildUnifiedSnapshot();
  let cap = safeBase;
  if (u.evidenceQualityHint === "LOW") cap = Math.min(cap, 0.45);
  const persistOn =
    croRetargetingLearningFlags.croRetargetingPersistenceV1 ||
    croRetargetingDurabilityFlags.croRetargetingDurabilityV1;
  if (persistOn && (u.persistedCroSignalTotal ?? 0) + (u.persistedRetargetingSignalTotal ?? 0) < 4) {
    cap = Math.min(cap, 0.48);
  }
  if (
    croRetargetingDurabilityFlags.croRetargetingDurabilityV1 &&
    (u.persistedCroSignalTotal ?? 0) + (u.persistedRetargetingSignalTotal ?? 0) < 2
  ) {
    cap = Math.min(cap, 0.48);
  }
  if (negativeSignalQualityFlags.negativeSignalQualityV1 && (u.sqlLowConversionCounts?.cro ?? 0) > 0) {
    cap = Math.min(cap, 0.52);
  }
  const adj = u.evidenceQualityHint === "HIGH" ? 0.07 : 0.04;
  return Math.min(0.95, cap + adj);
}

/**
 * Conservative portfolio-level hints — never dominates per-campaign ADS_COST signals.
 * Call after `buildPortfolioOptimizationSummary` when FEATURE_PORTFOLIO_OPTIMIZATION_V1 is on.
 */
export function maybeIngestPortfolioOptimizationSignals(
  summary: PortfolioOptimizationSummary,
  inputs: CampaignPortfolioInput[],
): void {
  try {
    if (!portfolioOptimizationFlags.portfolioOptimizationV1) return;
    for (const r of summary.recommendations) {
      if (r.amount < 5) continue;
      if (r.confidenceScore < 0.58) continue;
      const toInput = inputs.find((x) => x.campaignKey === r.toCampaignKey);
      const fromInput = inputs.find((x) => x.campaignKey === r.fromCampaignKey);
      const toConf = toInput?.confidenceScore ?? 0;
      const fromConf = fromInput?.confidenceScore ?? 0;
      if (toConf < 0.55 || fromConf < 0.55) continue;

      const toOk =
        toInput &&
        (toInput.profitabilityStatus === "PROFITABLE" || toInput.profitabilityStatus === "BREAKEVEN") &&
        toConf >= 0.55;
      if (toOk) {
        ingestUnifiedSignal({
          source: "ADS_PORTFOLIO",
          entityId: r.toCampaignKey ?? "portfolio_target",
          entityType: "ADS_CAMPAIGN_PORTFOLIO",
          signalType: "WIN",
          confidence: Math.min(0.78, r.confidenceScore * 0.88),
          evidenceScore: Math.min(0.68, r.confidenceScore * 0.75),
          hooks: [`portfolio_reallocate_in:${r.fromCampaignKey ?? ""}`],
          createdAt: new Date().toISOString(),
        });
      }
      if (fromInput?.profitabilityStatus === "UNPROFITABLE" && fromConf >= 0.55) {
        ingestUnifiedSignal({
          source: "ADS_PORTFOLIO",
          entityId: r.fromCampaignKey ?? "portfolio_source",
          entityType: "ADS_CAMPAIGN_PORTFOLIO",
          signalType: "WEAK",
          confidence: Math.min(0.72, r.confidenceScore * 0.85),
          evidenceScore: Math.min(0.62, r.confidenceScore * 0.72),
          hooks: [`portfolio_reallocate_out:${r.toCampaignKey ?? ""}`],
          createdAt: new Date().toISOString(),
        });
      }
    }
  } catch {
    /* ignore */
  }
}

/**
 * Lightweight operator recommendation lifecycle hint for the unified snapshot (does not execute actions).
 */
export function recordOperatorRecommendationLearningHint(input: {
  recommendationId: string;
  approved?: boolean;
  executed?: boolean;
  success?: boolean;
}): { accepted: boolean; reason?: string } {
  let signalType: UnifiedSignalType = "LOW_CONVERSION";
  if (input.success === true) signalType = "HIGH_CONVERSION";
  else if (input.approved === false) signalType = "WEAK";
  return ingestUnifiedSignal({
    source: "UNIFIED",
    entityId: input.recommendationId,
    entityType: "OPERATOR_RECOMMENDATION",
    signalType,
    confidence: 0.55,
    evidenceScore: 0.52,
    createdAt: new Date().toISOString(),
  });
}
