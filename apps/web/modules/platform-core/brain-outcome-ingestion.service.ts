/**
 * LECIPM PLATFORM — ingest observed outcomes from Platform Core decisions (real metadata only).
 */
import { prisma } from "@/lib/db";
import { logWarn } from "@/lib/logger";
import { oneBrainV2Flags, platformCoreFlags, isPlatformCoreAuditEffective } from "@/config/feature-flags";
import { PLATFORM_CORE_AUDIT } from "./platform-core.constants";
import { createAuditEvent } from "./platform-core.repository";
import type { BrainLearningSource, BrainOutcomeRecord, BrainOutcomeType } from "./brain-v2.types";
import { createDecisionOutcomes } from "./brain-v2.repository";
import type { PlatformDecisionLite } from "./brain-outcome-bridges/metric-window";
import { extractAdsOutcome } from "./brain-outcome-bridges/ads-outcomes.bridge";
import { extractCroOutcome } from "./brain-outcome-bridges/cro-outcomes.bridge";
import { extractRetargetingOutcome } from "./brain-outcome-bridges/retargeting-outcomes.bridge";
import { extractAbOutcome } from "./brain-outcome-bridges/ab-outcomes.bridge";
import { extractProfitOutcome } from "./brain-outcome-bridges/profit-outcomes.bridge";
import { extractMarketplaceOutcome } from "./brain-outcome-bridges/marketplace-outcomes.bridge";
import { extractUnifiedOutcome } from "./brain-outcome-bridges/unified-outcomes.bridge";
import type { CoreDecisionRecord } from "./platform-core.types";

function toLite(row: {
  id: string;
  source: string;
  entityType: string;
  entityId: string | null;
  actionType: string;
  metadata: unknown;
}): PlatformDecisionLite {
  return {
    id: row.id,
    source: row.source,
    entityType: row.entityType,
    entityId: row.entityId,
    actionType: row.actionType,
    metadata: row.metadata,
  };
}

function routeOutcome(decision: PlatformDecisionLite): BrainOutcomeRecord | null {
  switch (decision.source) {
    case "ADS":
      return extractAdsOutcome(decision);
    case "CRO":
      return extractCroOutcome(decision);
    case "RETARGETING":
      return extractRetargetingOutcome(decision);
    case "AB_TEST":
      return extractAbOutcome(decision);
    case "PROFIT":
      return extractProfitOutcome(decision);
    case "MARKETPLACE":
      return extractMarketplaceOutcome(decision);
    case "UNIFIED":
      return extractUnifiedOutcome(decision);
    default:
      return null;
  }
}

export async function collectRecentDecisionOutcomes(): Promise<{ created: number; skipped: number }> {
  if (!platformCoreFlags.platformCoreV1 || !oneBrainV2Flags.oneBrainV2OutcomeIngestionV1) {
    return { created: 0, skipped: 0 };
  }

  const rows = await prisma.platformCoreDecision.findMany({
    where: { status: { in: ["EXECUTED", "MONITORING"] } },
    orderBy: { updatedAt: "desc" },
    take: 120,
    select: {
      id: true,
      source: true,
      entityType: true,
      entityId: true,
      actionType: true,
      metadata: true,
    },
  });

  const outcomes: BrainOutcomeRecord[] = [];
  for (const r of rows) {
    const o = routeOutcome(toLite(r));
    if (o) outcomes.push(o);
  }

  const res = await createDecisionOutcomes(outcomes);

  if (res.created > 0 && isPlatformCoreAuditEffective()) {
    await createAuditEvent({
      eventType: PLATFORM_CORE_AUDIT.BRAIN_V2_OUTCOME_RECORDED,
      source: "UNIFIED",
      entityType: "UNKNOWN",
      entityId: null,
      message: `Recorded ${res.created} new brain outcome row(s) (${res.skipped} duplicate skips).`,
      metadata: { created: res.created, skipped: res.skipped },
    });
  }

  return res;
}

export async function collectOutcomesForSource(source: BrainLearningSource): Promise<{ created: number; skipped: number }> {
  if (!platformCoreFlags.platformCoreV1 || !oneBrainV2Flags.oneBrainV2OutcomeIngestionV1) {
    return { created: 0, skipped: 0 };
  }

  const rows = await prisma.platformCoreDecision.findMany({
    where: { source, status: { in: ["EXECUTED", "MONITORING"] } },
    orderBy: { updatedAt: "desc" },
    take: 80,
    select: {
      id: true,
      source: true,
      entityType: true,
      entityId: true,
      actionType: true,
      metadata: true,
    },
  });

  const outcomes: BrainOutcomeRecord[] = [];
  for (const r of rows) {
    const o = routeOutcome(toLite(r));
    if (o) outcomes.push(o);
  }

  return createDecisionOutcomes(outcomes);
}

function coreDecisionSourceToBrain(source: CoreDecisionRecord["source"]): BrainLearningSource {
  if (source === "OPERATOR") return "UNIFIED";
  const allowed: BrainLearningSource[] = ["ADS", "CRO", "RETARGETING", "AB_TEST", "PROFIT", "MARKETPLACE", "UNIFIED"];
  return allowed.includes(source as BrainLearningSource) ? (source as BrainLearningSource) : "UNIFIED";
}

/**
 * Lightweight feedback rows for operator lifecycle events (not a substitute for metric-backed outcomes).
 */
export async function emitPlatformCoreBrainFeedback(input: {
  decision: CoreDecisionRecord;
  kind: "executed" | "dismissed" | "failed";
}): Promise<void> {
  if (!platformCoreFlags.platformCoreV1 || !oneBrainV2Flags.oneBrainV2OutcomeIngestionV1) return;

  let outcomeType: BrainOutcomeType;
  let outcomeScore: number;
  let reason: string;
  if (input.kind === "executed") {
    outcomeType = "NEUTRAL";
    outcomeScore = 0.35;
    reason =
      "Platform Core: decision executed — neutral prior until before/after metrics are attached to the decision.";
  } else if (input.kind === "dismissed") {
    outcomeType = "NEGATIVE";
    outcomeScore = -0.28;
    reason = "Platform Core: decision dismissed — negative prior for this recommendation class.";
  } else {
    outcomeType = "NEGATIVE";
    outcomeScore = -0.42;
    reason = "Platform Core: internal execution failed — reliability negative prior.";
  }

  const o: BrainOutcomeRecord = {
    decisionId: input.decision.id,
    source: coreDecisionSourceToBrain(input.decision.source),
    entityType: input.decision.entityType,
    entityId: input.decision.entityId,
    actionType: input.decision.actionType,
    outcomeType,
    outcomeScore,
    observedMetrics: { platformCoreFeedbackKind: input.kind },
    reason,
    createdAt: new Date().toISOString(),
  };

  try {
    await createDecisionOutcomes([o]);
  } catch (e) {
    logWarn("[platform-core:brain-feedback]", "emitPlatformCoreBrainFeedback_failed", {
      decisionId: input.decision.id,
      kind: input.kind,
      message: e instanceof Error ? e.message : String(e),
    });
  }
}
