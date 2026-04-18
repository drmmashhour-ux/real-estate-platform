/**
 * Platform Core V2 — global priority scoring (heuristic; persisted for ordering).
 */
import { prisma } from "@/lib/db";
import { logWarn } from "@/lib/logger";
import { isPlatformCoreAuditEffective, platformCoreFlags } from "@/config/feature-flags";
import { PLATFORM_CORE_AUDIT } from "./platform-core.constants";
import { createAuditEvent } from "./platform-core.repository";
import type { CoreDecisionPriority, CoreDecisionRecord } from "./platform-core.types";

function clamp01(n: number): number {
  if (Number.isNaN(n) || !Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

function urgencyFromDecision(d: CoreDecisionRecord): number {
  switch (d.status) {
    case "PENDING":
      return 0.95;
    case "APPROVED":
      return 0.82;
    case "MONITORING":
      return 0.55;
    case "BLOCKED":
      return 0.4;
    default:
      return 0.25;
  }
}

function impactFromDecision(d: CoreDecisionRecord): number {
  const m = d.metadata && typeof d.metadata === "object" ? (d.metadata as Record<string, unknown>) : {};
  if (typeof m.profitImpact === "number") return clamp01(m.profitImpact);
  if (typeof m.expectedProfitDelta === "number") return clamp01(Math.abs(m.expectedProfitDelta));
  const ei = d.expectedImpact;
  if (ei && /high|strong|material|significant/i.test(ei)) return 0.85;
  if (ei && /low|minor|small/i.test(ei)) return 0.35;
  return 0.55;
}

function trustFromDecision(d: CoreDecisionRecord): number {
  const m = d.metadata && typeof d.metadata === "object" ? (d.metadata as Record<string, unknown>) : {};
  if (typeof m.trustScore === "number") return clamp01(m.trustScore);
  return clamp01(d.confidenceScore);
}

/** Pure scoring — used by tests and `computeDecisionPriority`. */
export function computeDecisionPriorityFields(decision: CoreDecisionRecord): CoreDecisionPriority {
  const urgency = urgencyFromDecision(decision);
  const impact = impactFromDecision(decision);
  const confidence = clamp01(decision.confidenceScore);
  const trust = trustFromDecision(decision);

  const priorityScore = clamp01(urgency * 0.28 + impact * 0.27 + confidence * 0.22 + trust * 0.23);

  const reason = [
    `urgency=${urgency.toFixed(2)} (status ${decision.status})`,
    `impact=${impact.toFixed(2)}`,
    `confidence=${confidence.toFixed(2)}`,
    `trust=${trust.toFixed(2)}`,
  ].join("; ");

  return {
    priorityScore,
    urgency,
    impact,
    confidence,
    reason,
  };
}

/**
 * Computes a bounded priority score from trust, profit impact, model confidence, and queue urgency.
 * Persists a snapshot row when `FEATURE_PLATFORM_CORE_PRIORITY_V1` is on.
 */
export async function computeDecisionPriority(decision: CoreDecisionRecord): Promise<CoreDecisionPriority> {
  const out = computeDecisionPriorityFields(decision);

  if (platformCoreFlags.platformCoreV1 && platformCoreFlags.platformCorePriorityV1) {
    try {
      await prisma.platformCoreDecisionPriority.create({
        data: {
          decisionId: decision.id,
          priorityScore: out.priorityScore,
          urgency: out.urgency,
          impact: out.impact,
          confidence: out.confidence,
          metadata: { reason: out.reason } as object,
        },
      });
      if (isPlatformCoreAuditEffective()) {
        await createAuditEvent({
          eventType: PLATFORM_CORE_AUDIT.PRIORITY_COMPUTED,
          source: decision.source,
          entityType: decision.entityType,
          entityId: decision.entityId,
          message: `Priority ${out.priorityScore.toFixed(3)} for decision ${decision.id}`,
          metadata: { decisionId: decision.id, ...out },
        });
      }
    } catch (e) {
      logWarn("[platform-core:priority]", "priority_snapshot_persist_failed", {
        decisionId: decision.id,
        message: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return out;
}
