/**
 * Persist, validate, apply, rollback LECIPM autonomy decisions with audit logs.
 */
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import {
  computeDemandQualitySignals,
  normalizeDemandIndexMetrics,
} from "@/modules/monetization/dynamic-market-pricing.service";
import {
  SMALL_CHANGE_THRESHOLD,
  type AutonomyDecisionStatus,
  type AutonomyDomain,
  type BaselineMetrics,
  type DecisionPayload,
  type GeneratedDecisionDraft,
} from "@/modules/autonomy/autonomy-types";
import {
  createRolloutDraftFromAutonomy,
  rollbackRolloutByPolicyId,
} from "@/modules/rollout/rollout-policy.service";

export function computeRequiresApproval(domain: AutonomyDomain, magnitude: number): boolean {
  if (domain === "GROWTH") return true;
  return Math.abs(magnitude) >= SMALL_CHANGE_THRESHOLD;
}

export function estimateMagnitude(payload: DecisionPayload): number {
  switch (payload.kind) {
    case "adjust_matching_weights":
      return Math.max(
        Math.abs(payload.deltas.care),
        Math.abs(payload.deltas.budget),
        Math.abs(payload.deltas.location),
        Math.abs(payload.deltas.service)
      );
    case "adjust_lead_scoring_weights":
      return Math.max(
        Math.abs(payload.deltas.wEngagement),
        Math.abs(payload.deltas.wBudget),
        Math.abs(payload.deltas.wCare),
        Math.abs(payload.deltas.wIntent),
        Math.abs(payload.deltas.wSource)
      );
    case "adjust_lead_base_price":
      return Math.abs(payload.relativeDelta);
    case "boost_residence_rank":
      return Math.min(1, Math.abs(payload.deltaPoints) * 0.015);
    case "gtm_onboarding_emphasis":
      return 1;
    default:
      return 1;
  }
}

export function validatePayload(payload: DecisionPayload): { ok: boolean; reason?: string } {
  switch (payload.kind) {
    case "adjust_matching_weights": {
      for (const k of ["care", "budget", "location", "service"] as const) {
        if (Math.abs(payload.deltas[k]) > 0.04) return { ok: false, reason: "matching_delta_too_large" };
      }
      return { ok: true };
    }
    case "adjust_lead_scoring_weights": {
      for (const k of ["wEngagement", "wBudget", "wCare", "wIntent", "wSource"] as const) {
        if (Math.abs(payload.deltas[k]) > 0.04) return { ok: false, reason: "lead_score_delta_too_large" };
      }
      return { ok: true };
    }
    case "adjust_lead_base_price": {
      if (Math.abs(payload.relativeDelta) > 0.12) return { ok: false, reason: "price_delta_capped" };
      return { ok: true };
    }
    case "boost_residence_rank": {
      if (payload.residenceIds.length === 0 || payload.residenceIds.length > 40) {
        return { ok: false, reason: "rank_targets_bounds" };
      }
      if (Math.abs(payload.deltaPoints) > 5) return { ok: false, reason: "rank_points_capped" };
      return { ok: true };
    }
    case "gtm_onboarding_emphasis":
      return { ok: true };
    default:
      return { ok: false, reason: "unknown_payload" };
  }
}

async function appendLog(decisionId: string, event: string, detail?: Record<string, unknown>) {
  await prisma.autonomyDecisionLog.create({
    data: {
      decisionId,
      event,
      detailJson: detail ? (detail as Prisma.InputJsonValue) : undefined,
    },
  });
}

export async function persistProposals(
  drafts: GeneratedDecisionDraft[],
  baseline: BaselineMetrics
): Promise<{ createdIds: string[] }> {
  const createdIds: string[] = [];
  for (const d of drafts) {
    const requiresApproval = computeRequiresApproval(d.domain, d.magnitude);
    const row = await prisma.autonomyDecision.create({
      data: {
        domain: d.domain,
        action: d.action,
        rationale: d.rationale,
        confidence: d.confidence,
        impactEstimate: d.impactEstimate,
        requiresApproval,
        status: "PROPOSED",
        payloadJson: d.payload as unknown as Prisma.InputJsonValue,
        baselineMetricsJson: baseline as unknown as Prisma.InputJsonValue,
      },
    });
    createdIds.push(row.id);
    await appendLog(row.id, "CREATED", { domain: d.domain, action: d.action });
  }
  return { createdIds };
}

export async function approveDecision(
  decisionId: string,
  userId: string,
  note?: string | null
): Promise<void> {
  const d = await prisma.autonomyDecision.findUnique({ where: { id: decisionId } });
  if (!d || d.status !== "PROPOSED") throw new Error("invalid_state");

  await prisma.autonomyDecision.update({
    where: { id: decisionId },
    data: {
      status: "APPROVED",
      approvedAt: new Date(),
      approvedByUserId: userId,
    },
  });
  await appendLog(decisionId, "APPROVED", { userId, note: note?.trim() || undefined });
}

export async function rejectDecision(
  decisionId: string,
  userId?: string | null,
  note?: string | null
): Promise<void> {
  const d = await prisma.autonomyDecision.findUnique({ where: { id: decisionId } });
  if (!d || d.status !== "PROPOSED") throw new Error("invalid_state");

  await prisma.autonomyDecision.update({
    where: { id: decisionId },
    data: { status: "REJECTED" },
  });
  await appendLog(decisionId, "REJECTED", {
    userId: userId ?? null,
    note: note?.trim() || undefined,
  });
}

/** Marks a still-pending proposal as expired (operator workflow; not auto-applied). */
export async function markDecisionExpired(
  decisionId: string,
  userId: string,
  note?: string | null
): Promise<void> {
  const d = await prisma.autonomyDecision.findUnique({ where: { id: decisionId } });
  if (!d || d.status !== "PROPOSED") throw new Error("invalid_state");

  await prisma.autonomyDecision.update({
    where: { id: decisionId },
    data: { status: "EXPIRED" },
  });
  await appendLog(decisionId, "EXPIRED", { userId, note: note?.trim() || undefined });
}

function parsePayload(raw: unknown): DecisionPayload | null {
  if (!raw || typeof raw !== "object") return null;
  return raw as DecisionPayload;
}

async function capturePreviousState(payload: DecisionPayload): Promise<Record<string, unknown>> {
  switch (payload.kind) {
    case "adjust_matching_weights": {
      const w = await prisma.matchingWeight.findFirst({ orderBy: { updatedAt: "desc" } });
      return { matchingWeight: w };
    }
    case "adjust_lead_scoring_weights": {
      const w = await prisma.leadScoringWeights.findFirst({ orderBy: { updatedAt: "desc" } });
      return { leadScoringWeights: w };
    }
    case "adjust_lead_base_price": {
      const rule = await prisma.lecipmMarketPricingRule.findUnique({ where: { type: "LEAD" } });
      return { leadRule: rule };
    }
    case "boost_residence_rank": {
      const rows = await prisma.seniorResidence.findMany({
        where: { id: { in: payload.residenceIds } },
        select: { id: true, rankBoostPoints: true },
      });
      return { residences: rows };
    }
    case "gtm_onboarding_emphasis":
      return {};
    default:
      return {};
  }
}

async function applyPayload(payload: DecisionPayload): Promise<void> {
  const v = validatePayload(payload);
  if (!v.ok) throw new Error(v.reason ?? "invalid_payload");

  switch (payload.kind) {
    case "adjust_matching_weights": {
      const current = await prisma.matchingWeight.findFirst({ orderBy: { updatedAt: "desc" } });
      if (!current) throw new Error("no_matching_weights");

      const next = {
        careWeight: clampDelta(current.careWeight, payload.deltas.care, 0.35),
        budgetWeight: clampDelta(current.budgetWeight, payload.deltas.budget, 0.25),
        locationWeight: clampDelta(current.locationWeight, payload.deltas.location, 0.2),
        serviceWeight: clampDelta(current.serviceWeight, payload.deltas.service, 0.2),
      };
      const norm = normalizeMatching(next);
      await prisma.matchingWeight.update({
        where: { id: current.id },
        data: norm,
      });
      return;
    }
    case "adjust_lead_scoring_weights": {
      const current = await prisma.leadScoringWeights.findFirst({ orderBy: { updatedAt: "desc" } });
      if (!current) throw new Error("no_lead_scoring_weights");

      const raw = {
        wEngagement: clampDelta(current.wEngagement, payload.deltas.wEngagement, 0.25),
        wBudget: clampDelta(current.wBudget, payload.deltas.wBudget, 0.25),
        wCare: clampDelta(current.wCare, payload.deltas.wCare, 0.25),
        wIntent: clampDelta(current.wIntent, payload.deltas.wIntent, 0.15),
        wSource: clampDelta(current.wSource, payload.deltas.wSource, 0.1),
      };
      const norm = normalizeLeadWeights(raw);
      await prisma.leadScoringWeights.update({
        where: { id: current.id },
        data: norm,
      });
      return;
    }
    case "adjust_lead_base_price": {
      const rule = await prisma.lecipmMarketPricingRule.findUnique({ where: { type: "LEAD" } });
      if (!rule) throw new Error("no_lead_rule");

      const nextBase = rule.basePrice * (1 + payload.relativeDelta);
      const clamped = Math.min(rule.maxPrice, Math.max(rule.minPrice, nextBase));
      await prisma.lecipmMarketPricingRule.update({
        where: { type: "LEAD" },
        data: { basePrice: clamped },
      });
      await prisma.lecipmPricingEvent
        .create({
          data: {
            type: "LEAD",
            price: clamped,
            context: {
              source: "autonomy_decision",
              relativeDelta: payload.relativeDelta,
              priorBase: rule.basePrice,
            },
          },
        })
        .catch(() => {});
      return;
    }
    case "boost_residence_rank": {
      const step = payload.deltaPoints;
      for (const id of payload.residenceIds) {
        const r = await prisma.seniorResidence.findUnique({
          where: { id },
          select: { rankBoostPoints: true },
        });
        if (!r) continue;
        const next = Math.min(5, Math.max(-5, r.rankBoostPoints + step));
        await prisma.seniorResidence.update({
          where: { id },
          data: { rankBoostPoints: next },
        });
      }
      return;
    }
    case "gtm_onboarding_emphasis": {
      await prisma.seniorLivingGtmExecutionEvent.create({
        data: {
          eventType: "AUTONOMY_FUNNEL_EMPHASIS",
          quantity: 1,
          notes: payload.note,
          metadata: { emphasis: payload.emphasis } as Prisma.InputJsonValue,
        },
      });
      return;
    }
    default:
      throw new Error("unsupported_payload");
  }
}

function clampDelta(current: number, delta: number, baseline: number): number {
  const lo = baseline * 0.9;
  const hi = baseline * 1.1;
  const target = current + delta;
  return Math.min(hi, Math.max(lo, target));
}

function normalizeMatching(w: {
  careWeight: number;
  budgetWeight: number;
  locationWeight: number;
  serviceWeight: number;
}) {
  const s = w.careWeight + w.budgetWeight + w.locationWeight + w.serviceWeight;
  if (s < 1e-9) return w;
  return {
    careWeight: w.careWeight / s,
    budgetWeight: w.budgetWeight / s,
    locationWeight: w.locationWeight / s,
    serviceWeight: w.serviceWeight / s,
  };
}

function normalizeLeadWeights(w: {
  wEngagement: number;
  wBudget: number;
  wCare: number;
  wIntent: number;
  wSource: number;
}) {
  const s = w.wEngagement + w.wBudget + w.wCare + w.wIntent + w.wSource;
  if (s < 1e-9) return w;
  return {
    wEngagement: w.wEngagement / s,
    wBudget: w.wBudget / s,
    wCare: w.wCare / s,
    wIntent: w.wIntent / s,
    wSource: w.wSource / s,
  };
}

export async function applyDecision(decisionId: string): Promise<void> {
  const d = await prisma.autonomyDecision.findUnique({ where: { id: decisionId } });
  if (!d) throw new Error("not_found");

  const allowed: AutonomyDecisionStatus[] = ["APPROVED", "PROPOSED"];
  if (!allowed.includes(d.status as AutonomyDecisionStatus)) throw new Error("invalid_state");

  const payload = parsePayload(d.payloadJson);
  if (!payload) throw new Error("bad_payload");

  const v = validatePayload(payload);
  if (!v.ok) {
    await prisma.autonomyDecision.update({
      where: { id: decisionId },
      data: { status: "INVALID" },
    });
    await appendLog(decisionId, "INVALID", { reason: v.reason });
    throw new Error(v.reason ?? "invalid");
  }

  const needsApproval = d.requiresApproval;
  const isApproved = d.status === "APPROVED";
  const canAuto = !needsApproval && d.status === "PROPOSED";
  if (needsApproval && !isApproved) throw new Error("approval_required");
  if (!needsApproval && !canAuto && !isApproved) throw new Error("invalid_state");

  if (payload.kind === "adjust_lead_base_price" || payload.kind === "boost_residence_rank") {
    const policy = await createRolloutDraftFromAutonomy({
      autonomyDecisionId: decisionId,
      payload,
      createdByUserId: d.approvedByUserId ?? null,
    });
    const outcome = await snapshotBaselineMetrics();
    await prisma.autonomyDecision.update({
      where: { id: decisionId },
      data: {
        status: canAuto ? "AUTO_APPLIED" : "APPLIED",
        appliedAt: new Date(),
        outcomeMetricsJson: {
          ...(outcome as Record<string, unknown>),
          rolloutPolicyId: policy.id,
        } as unknown as Prisma.InputJsonValue,
      },
    });
    await appendLog(decisionId, "ROLLOUT_DRAFT_CREATED", { rolloutPolicyId: policy.id });
    return;
  }

  const previous = await capturePreviousState(payload);

  await applyPayload(payload);

  const outcome = await snapshotBaselineMetrics();

  const snapshot =
    previous && typeof previous === "object" && Object.keys(previous).length > 0 ?
      (previous as Prisma.InputJsonValue)
    : undefined;

  await prisma.autonomyDecision.update({
    where: { id: decisionId },
    data: {
      status: canAuto ? "AUTO_APPLIED" : "APPLIED",
      appliedAt: new Date(),
      ...(snapshot ? { previousStateJson: snapshot } : {}),
      outcomeMetricsJson: outcome as unknown as Prisma.InputJsonValue,
    },
  });

  await appendLog(decisionId, canAuto ? "AUTO_APPLIED" : "APPLIED", {});
}

export async function rollbackDecision(decisionId: string): Promise<void> {
  const d = await prisma.autonomyDecision.findUnique({ where: { id: decisionId } });
  if (!d) throw new Error("cannot_rollback");

  const outcomeRaw = d.outcomeMetricsJson as Record<string, unknown> | null | undefined;
  const rolloutPolicyId =
    outcomeRaw && typeof outcomeRaw.rolloutPolicyId === "string" ? outcomeRaw.rolloutPolicyId : null;
  if (rolloutPolicyId) {
    await rollbackRolloutByPolicyId(rolloutPolicyId, `autonomy_rollback:${decisionId}`);
    await prisma.autonomyDecision.update({
      where: { id: decisionId },
      data: { status: "ROLLED_BACK", rolledBackAt: new Date() },
    });
    await appendLog(decisionId, "ROLLBACK", { rolloutPolicyId });
    return;
  }

  const prevRaw = d.previousStateJson;
  const noSnapshot =
    prevRaw == null ||
    (typeof prevRaw === "object" &&
      prevRaw !== null &&
      Object.keys(prevRaw as Record<string, unknown>).length === 0);
  if (noSnapshot) throw new Error("cannot_rollback");

  const prev = prevRaw as Record<string, unknown>;

  if (prev.matchingWeight && typeof prev.matchingWeight === "object") {
    const m = prev.matchingWeight as {
      id: string;
      careWeight: number;
      budgetWeight: number;
      locationWeight: number;
      serviceWeight: number;
    };
    await prisma.matchingWeight.update({
      where: { id: m.id },
      data: {
        careWeight: m.careWeight,
        budgetWeight: m.budgetWeight,
        locationWeight: m.locationWeight,
        serviceWeight: m.serviceWeight,
      },
    });
  }

  if (prev.leadScoringWeights && typeof prev.leadScoringWeights === "object") {
    const m = prev.leadScoringWeights as {
      id: string;
      wEngagement: number;
      wBudget: number;
      wCare: number;
      wIntent: number;
      wSource: number;
    };
    await prisma.leadScoringWeights.update({
      where: { id: m.id },
      data: {
        wEngagement: m.wEngagement,
        wBudget: m.wBudget,
        wCare: m.wCare,
        wIntent: m.wIntent,
        wSource: m.wSource,
      },
    });
  }

  if (prev.leadRule && typeof prev.leadRule === "object") {
    const m = prev.leadRule as { basePrice: number };
    await prisma.lecipmMarketPricingRule.update({
      where: { type: "LEAD" },
      data: { basePrice: m.basePrice },
    });
  }

  if (Array.isArray(prev.residences)) {
    for (const r of prev.residences as { id: string; rankBoostPoints: number }[]) {
      await prisma.seniorResidence.update({
        where: { id: r.id },
        data: { rankBoostPoints: r.rankBoostPoints },
      });
    }
  }

  await prisma.autonomyDecision.update({
    where: { id: decisionId },
    data: { status: "ROLLED_BACK", rolledBackAt: new Date() },
  });

  await appendLog(decisionId, "ROLLBACK", {});
}

export async function snapshotBaselineMetrics(): Promise<BaselineMetrics> {
  const thirty = new Date();
  thirty.setDate(thirty.getDate() - 30);

  const [totalLeads30d, closedLeads30d, scoreAgg, sig, events] = await Promise.all([
    prisma.seniorLead.count({ where: { createdAt: { gte: thirty } } }),
    prisma.seniorLead.count({ where: { createdAt: { gte: thirty }, status: "CLOSED" } }),
    prisma.leadScore.aggregate({ _avg: { score: true } }),
    computeDemandQualitySignals(),
    prisma.matchingEvent.count(),
  ]);

  const seniorConversionRate30d = totalLeads30d === 0 ? 0 : closedLeads30d / totalLeads30d;

  return {
    seniorConversionRate30d,
    avgLeadScore: scoreAgg._avg.score ?? null,
    leadVolume30d: totalLeads30d,
    demandIndex: normalizeDemandIndexMetrics({
      leadsLast30d: sig.leadsLast30d,
      operatorCount: sig.operatorCount,
      residencesInMarket: sig.residencesInMarket,
      activeUsersProxy: sig.activeUsersProxy,
    }),
    matchingEventsTotal: events,
  };
}

/** List open + recent decisions for the dashboard. */
export async function listDecisionsForUi(take = 80) {
  return prisma.autonomyDecision.findMany({
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      domain: true,
      action: true,
      rationale: true,
      confidence: true,
      impactEstimate: true,
      requiresApproval: true,
      status: true,
      payloadJson: true,
      baselineMetricsJson: true,
      outcomeMetricsJson: true,
      appliedAt: true,
      rolledBackAt: true,
      createdAt: true,
      _count: { select: { logs: true } },
    },
  });
}
