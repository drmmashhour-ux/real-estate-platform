import type {
  LecipmDisputeCaseCategory,
  LecipmDisputeCaseEntityType,
  LecipmDisputePredictedCategory,
  LecipmPreDisputeRiskLevel,
  Prisma,
} from "@prisma/client";
import { subDays } from "date-fns";

import { prisma } from "@/lib/db";
import { collectBookingRiskSignals, collectDealRiskSignals } from "@/modules/risk-engine/risk-signal.service";
import { computeRiskAssessment } from "@/modules/risk-engine/risk-score.engine";
import type { RiskSignal } from "@/modules/risk-engine/risk.types";

import { buildDisputePredictionExplainability } from "./dispute-prediction-explainability.service";
import { logDisputeRisk } from "./dispute-prediction-log";
import {
  executePredictionPrevention,
  mapPredictionBandToActions,
} from "./dispute-prevention-actions.service";
import type {
  DisputePredictionContext,
  DisputePredictionResult,
  DisputePredictionSourceMix,
  PriorDisputePredictionAttachment,
} from "./dispute-prediction.types";

const ENGINE_VERSION = "v1";

export async function buildDisputePredictionContext(
  entityType: LecipmDisputeCaseEntityType,
  entityId: string
): Promise<DisputePredictionContext> {
  let signals: RiskSignal[] = [];
  let listingId: string | null | undefined;
  let brokerId: string | null | undefined;

  if (entityType === "BOOKING") {
    signals = await collectBookingRiskSignals(entityId);
    const b = await prisma.booking.findUnique({
      where: { id: entityId },
      select: { listingId: true },
    });
    listingId = b?.listingId;
  } else if (entityType === "DEAL") {
    signals = await collectDealRiskSignals(entityId);
    const deal = await prisma.deal.findUnique({
      where: { id: entityId },
      select: { listingId: true, brokerId: true },
    });
    listingId = deal?.listingId ?? undefined;
    brokerId = deal?.brokerId ?? undefined;
  } else {
    signals = [];
  }

  const since = subDays(new Date(), 180);
  const sameEntityPast180d = await prisma.lecipmDisputeCase.count({
    where: {
      relatedEntityType: entityType,
      relatedEntityId: entityId,
      createdAt: { gte: since },
    },
  });

  let listingScopedPast180d: number | undefined;
  if (listingId) {
    listingScopedPast180d = await prisma.lecipmDisputeCase.count({
      where: {
        relatedEntityType: "LISTING",
        relatedEntityId: listingId,
        createdAt: { gte: since },
      },
    });
  }

  return {
    entityType,
    entityId,
    signals,
    relatedDisputeCounts: {
      sameEntityPast180d,
      listingScopedPast180d,
    },
    listingId,
    brokerId,
    metadata: {
      builder: "buildDisputePredictionContext",
      generatedAt: new Date().toISOString(),
    },
  };
}

export async function runDisputePrediction(input: {
  entityType: LecipmDisputeCaseEntityType;
  entityId: string;
  persist?: boolean;
  executePrevention?: boolean;
}): Promise<{ result: DisputePredictionResult; explain: ReturnType<typeof buildDisputePredictionExplainability> }> {
  const ctx = await buildDisputePredictionContext(input.entityType, input.entityId);
  const base = computeRiskAssessment(ctx.signals);

  const patterns = await prisma.lecipmDisputePredictionPattern.findMany({
    orderBy: { confidence: "desc" },
    take: 120,
  });

  const signalIds = new Set(ctx.signals.map((s) => s.id));
  let boost = 0;
  const matchedKeys: string[] = [];
  const matchedSummaries: string[] = [];

  for (const p of patterns) {
    const fp = p.signalsFingerprintJson as unknown as { signalKeys?: string[] };
    const keys = fp?.signalKeys ?? [];
    const overlap = keys.filter((k) => signalIds.has(k as RiskSignal["id"]));
    if (overlap.length >= 2) {
      boost += Math.min(18, p.confidence * 14);
      matchedKeys.push(p.patternKey);
      matchedSummaries.push(`${p.patternKey} (n=${p.sampleSize})`);
    }
  }

  let score = Math.min(100, Math.round(base.riskScore + boost));
  let band = maxRiskBand(bandFromScore(score), base.riskLevel);
  const predictedCategory = inferPredictedCategory(ctx.signals);
  let sourceMix: DisputePredictionSourceMix =
    matchedKeys.length > 0 ? "rules_plus_patterns" : "rules_only";

  if (ctx.relatedDisputeCounts.sameEntityPast180d > 0) {
    score = Math.min(100, score + 12);
    band = maxRiskBand(bandFromScore(score), band);
  }

  const topContributing = ctx.signals
    .slice()
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 8)
    .map((s) => ({
      id: s.id,
      weight: s.weight,
      source: s.source,
      evidence: s.evidence,
    }));

  const entityKind =
    input.entityType === "BOOKING" ? "BOOKING"
    : input.entityType === "DEAL" ? "DEAL"
    : input.entityType === "LISTING" ? "LISTING"
    : "PAYMENT";

  const preventionDescriptors = mapPredictionBandToActions({
    band,
    entityKind,
    entityId: input.entityId,
  });

  const result: DisputePredictionResult = {
    disputeRiskScore: score,
    riskBand: band,
    predictedCategory,
    topContributingSignals: topContributing,
    suggestedPreventionActions: preventionDescriptors,
    matchedPatternKeys: matchedKeys,
    sourceMix,
    engineVersion: ENGINE_VERSION,
  };

  const explain = buildDisputePredictionExplainability({
    result,
    sourceMix,
    matchedPatternSummaries: matchedSummaries,
  });

  if (input.persist !== false) {
    await prisma.lecipmDisputePredictionSnapshot.create({
      data: {
        entityType: input.entityType,
        entityId: input.entityId,
        disputeRiskScore: score,
        riskBand: band,
        predictedCategory,
        topSignalsJson: topContributing as unknown as Prisma.InputJsonValue,
        explainJson: explain as unknown as Prisma.InputJsonValue,
        preventionActionsJson: preventionDescriptors as unknown as Prisma.InputJsonValue,
        matchedPatternKeysJson: matchedKeys as unknown as Prisma.InputJsonValue,
        sourceMix,
        engineVersion: ENGINE_VERSION,
      },
    });
  }

  logDisputeRisk("prediction_run", {
    entityType: input.entityType,
    entityId: input.entityId,
    score,
    band,
    category: predictedCategory,
    patterns: matchedKeys.length,
  });

  if (input.executePrevention) {
    await executePredictionPrevention({
      band,
      entityKind,
      entityId: input.entityId,
    });
  }

  return { result, explain };
}

function bandFromScore(score: number): LecipmPreDisputeRiskLevel {
  if (score >= 88) return "CRITICAL";
  if (score >= 68) return "HIGH";
  if (score >= 40) return "MEDIUM";
  return "LOW";
}

function maxRiskBand(
  a: LecipmPreDisputeRiskLevel,
  b: LecipmPreDisputeRiskLevel
): LecipmPreDisputeRiskLevel {
  const order: LecipmPreDisputeRiskLevel[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
  return order.indexOf(a) >= order.indexOf(b) ? a : b;
}

export function inferPredictedCategory(signals: RiskSignal[]): LecipmDisputePredictedCategory {
  const ranked = [...signals].sort((a, b) => b.weight - a.weight);
  for (const s of ranked) {
    switch (s.id) {
      case "payment_delay":
        return "PAYMENT_FRICTION";
      case "high_message_friction":
      case "trust_safety_flag":
        return "RESPONSE_DELAY_CONFLICT";
      case "compliance_missing_docs":
      case "compliance_critical_failure":
        return "DOCUMENTATION_GAP";
      case "negotiation_stall":
        return "NEGOTIATION_BREAKDOWN";
      case "listing_readiness_gap":
      case "negative_feedback_tension":
        return "MISLEADING_EXPECTATION";
      case "repeated_reschedule":
      case "booking_no_confirmation":
      case "repeated_issue_pattern":
        return "NO_SHOW_CONFLICT";
      default:
        break;
    }
  }
  return "OTHER";
}

export async function loadPriorDisputePredictionAttachment(
  entityType: LecipmDisputeCaseEntityType,
  entityId: string,
  actualCategory: LecipmDisputeCaseCategory
): Promise<PriorDisputePredictionAttachment> {
  const snap = await prisma.lecipmDisputePredictionSnapshot.findFirst({
    where: { entityType, entityId },
    orderBy: { createdAt: "desc" },
  });

  if (!snap) {
    return {
      snapshotAt: null,
      disputeRiskScore: null,
      riskBand: null,
      predictedCategory: null,
      preventionActionsSummary: [],
      categoryMatchWithActual: "no_prior_snapshot",
      actualDisputeCategory: actualCategory,
    };
  }

  const explain = snap.explainJson as unknown as { recommendedActions?: string[] };
  const prevention = snap.preventionActionsJson as unknown as Array<{ kind: string; detail: string }> | null;

  const match = categoryAlignment(snap.predictedCategory, actualCategory);

  return {
    snapshotAt: snap.createdAt.toISOString(),
    disputeRiskScore: snap.disputeRiskScore,
    riskBand: snap.riskBand,
    predictedCategory: snap.predictedCategory,
    preventionActionsSummary:
      explain?.recommendedActions ??
      (prevention ?? []).map((p) => `${p.kind}: ${p.detail}`),
    categoryMatchWithActual: match,
    actualDisputeCategory: actualCategory,
  };
}

function categoryAlignment(
  predicted: LecipmDisputePredictedCategory,
  actual: LecipmDisputeCaseCategory
): PriorDisputePredictionAttachment["categoryMatchWithActual"] {
  const map: Partial<Record<LecipmDisputePredictedCategory, LecipmDisputeCaseCategory[]>> = {
    NO_SHOW_CONFLICT: ["NO_SHOW"],
    PAYMENT_FRICTION: ["PAYMENT"],
    MISLEADING_EXPECTATION: ["MISLEADING_LISTING"],
    RESPONSE_DELAY_CONFLICT: ["OTHER"],
    DOCUMENTATION_GAP: ["OTHER", "MISLEADING_LISTING"],
    NEGOTIATION_BREAKDOWN: ["OTHER"],
    OTHER: ["OTHER"],
  };
  const acceptable = map[predicted] ?? [];
  if (acceptable.includes(actual)) return "aligned";
  if (predicted === "OTHER" || actual === "OTHER") return "partial";
  return "unknown";
}
