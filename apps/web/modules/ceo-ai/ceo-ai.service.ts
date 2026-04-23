/**
 * Orchestrates AI CEO cycles, persistence, guarded execution, rollback.
 */
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { PlatformRole } from "@prisma/client";
import {
  MARKET_PRICING_TYPES,
  computeDemandQualitySignals,
  normalizeDemandIndexMetrics,
} from "@/modules/monetization/dynamic-market-pricing.service";
import { CEO_PRICING_APPROVAL_THRESHOLD, getOrCreateCeoPolicy } from "@/modules/ceo-ai/ceo-ai-policy";
import { generateCeoDecisions } from "@/modules/ceo-ai/ceo-ai-decision.engine";
import type { CeoDecisionPayload } from "@/modules/ceo-ai/ceo-ai.types";
import { snapshotBaselineMetrics } from "@/modules/autonomy/autonomy-decision.service";
import { recordCeoDecisionMemory } from "@/modules/ceo-ai/ceo-memory.service";
import { shouldRouteCeoDecision } from "@/modules/ceo-ai/ceo-routing.service";
import { buildCeoContextFingerprint } from "@/modules/ceo-ai/ceo-memory-context.service";
import { buildCeoStrategySnapshot } from "@/modules/ceo-ai/ceo-strategy-snapshot.service";

export async function gatherMarketSignals() {
  const d30 = new Date();
  d30.setDate(d30.getDate() - 30);
  const d60 = new Date();
  d60.setDate(d60.getDate() - 60);
  const d90 = new Date();
  d90.setDate(d90.getDate() - 90);
  const inactiveCutoff = new Date();
  inactiveCutoff.setDate(inactiveCutoff.getDate() - 90);

  const [
    leadsLast30d,
    leadsPrev30d,
    closed30,
    operatorsWithResidences,
    brokerAccountsApprox,
    operatorUsersRecent,
    brokersJoinedLast90d,
    inactiveBrokers,
    residencesWithoutRecentLead,
    sig,
    seoBlogCount,
    avgLeadScore,
    revenueRows,
    gtmRecent,
  ] = await Promise.all([
    prisma.seniorLead.count({ where: { createdAt: { gte: d30 } } }),
    prisma.seniorLead.count({ where: { createdAt: { gte: d60, lt: d30 } } }),
    prisma.seniorLead.count({ where: { createdAt: { gte: d30 }, status: "CLOSED" } }),
    prisma.seniorResidence.groupBy({
      by: ["operatorId"],
      where: { operatorId: { not: null } },
    }).then((r) => r.length),
    prisma.user.count({ where: { role: PlatformRole.BROKER } }),
    prisma.user.count({
      where: {
        seniorLivingResidencesOperated: { some: {} },
        createdAt: { gte: d90 },
      },
    }),
    prisma.user.count({
      where: { role: PlatformRole.BROKER, createdAt: { gte: d90 } },
    }),
    prisma.user.count({
      where: {
        role: PlatformRole.BROKER,
        updatedAt: { lt: inactiveCutoff },
      },
    }),
    prisma.seniorResidence.count({
      where: {
        leads: { none: { createdAt: { gte: d30 } } },
        operatorId: { not: null },
      },
    }),
    computeDemandQualitySignals(),
    prisma.seoBlogPost.count().catch(() => 0),
    prisma.leadScore.aggregate({ _avg: { score: true } }),
    prisma.revenueSnapshot.findMany({
      orderBy: { snapshotDate: "desc" },
      take: 2,
      select: { mrr: true, snapshotDate: true },
    }),
    prisma.seniorLivingGtmExecutionEvent.count({
      where: { occurredAt: { gte: d30 } },
    }),
  ]);

  const seniorConversionRate30d = leadsLast30d === 0 ? 0 : closed30 / leadsLast30d;

  const demandIndex = normalizeDemandIndexMetrics({
    leadsLast30d: sig.leadsLast30d,
    operatorCount: sig.operatorCount,
    residencesInMarket: sig.residencesInMarket,
    activeUsersProxy: sig.activeUsersProxy,
  });

  let revenueTrend30dProxy = 0;
  if (revenueRows.length >= 2 && revenueRows[0]?.mrr != null && revenueRows[1]?.mrr != null) {
    const a = Number(revenueRows[0].mrr);
    const b = Number(revenueRows[1].mrr);
    if (b > 1e-9) revenueTrend30dProxy = (a - b) / b;
  }

  const outreachReplyRateProxy =
    gtmRecent > 0 ? Math.min(0.35, 0.12 + Math.min(0.2, gtmRecent / 400)) : null;

  return {
    leadsLast30d,
    leadsPrev30d,
    seniorConversionRate30d,
    operatorsWithResidences,
    brokerAccountsApprox,
    operatorOnboardedLast90d: operatorUsersRecent,
    brokersJoinedLast90d,
    churnInactiveBrokersApprox: inactiveBrokers,
    inactiveOperatorsApprox: Math.min(residencesWithoutRecentLead, 500),
    demandIndex,
    outreachReplyRateProxy,
    seoPagesIndexedApprox: seoBlogCount,
    emailEngagementScore: null,
    avgLeadQualityScore: avgLeadScore._avg.score ?? null,
    revenueTrend30dProxy,
  };
}

export async function getExecutiveSummary() {
  const signals = await gatherMarketSignals();
  const policy = await getOrCreateCeoPolicy();
  const preview = await generateCeoDecisions(signals, { maxDecisions: policy.maxDailyChanges });
  const snapshot = await buildCeoStrategySnapshot();

  const pending = await prisma.ceoDecision.count({
    where: { status: "PROPOSED", createdAt: { gte: new Date(Date.now() - 86400000) } },
  });

  return {
    signals,
    policy,
    preview,
    snapshot,
    pendingDecisionsToday: pending,
    generatedAt: new Date().toISOString(),
  };
}

async function decisionsCreatedToday(): Promise<number> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return prisma.ceoDecision.count({
    where: { createdAt: { gte: start } },
  });
}

async function recentMajorPricingMove(): Promise<boolean> {
  const since = new Date(Date.now() - 7 * 86400000);
  const rows = await prisma.ceoDecision.findMany({
    where: {
      domain: "PRICING",
      status: { in: ["EXECUTED", "APPROVED"] },
      updatedAt: { gte: since },
    },
    select: { payloadJson: true },
    take: 40,
  });
  for (const r of rows) {
    const p = r.payloadJson as { relativeDelta?: number } | null;
    if (p && typeof p.relativeDelta === "number" && Math.abs(p.relativeDelta) >= CEO_PRICING_APPROVAL_THRESHOLD) {
      return true;
    }
  }
  return false;
}

export async function runCeo(mode: "daily" | "weekly" | "manual") {
  const policy = await getOrCreateCeoPolicy();
  const signals = await gatherMarketSignals();
  const budget = Math.max(0, policy.maxDailyChanges - (await decisionsCreatedToday()));
  const generated = await generateCeoDecisions(signals, { maxDecisions: Math.min(budget, policy.maxDailyChanges) });
  const fingerprint = buildCeoContextFingerprint(signals);

  const createdIds: string[] = [];
  for (const p of generated.proposedDecisions) {
    // Phase 9: Routing Guard
    const guard = await shouldRouteCeoDecision(p, fingerprint);
    if (!guard.shouldRoute) {
      console.log(`[ceo-ai] skipping decision routing: ${p.title} (${guard.reason})`);
      continue;
    }

    const row = await prisma.ceoDecision.create({
      data: {
        domain: p.domain,
        title: p.title,
        summary: p.summary,
        rationale: p.rationale,
        confidence: p.confidence,
        impactEstimate: p.impactEstimate,
        requiresApproval: guard.forceApproval || p.requiresApproval,
        status: "PROPOSED",
        payloadJson: p.payload as unknown as Prisma.InputJsonValue,
      },
    });
    createdIds.push(row.id);

    // Phase 3: Record in memory for evolving CEO
    try {
      await recordCeoDecisionMemory(p, signals);
    } catch (e) {
      console.error("[ceo-ai] failed to record memory", e);
    }
  }

  const run = await prisma.ceoRun.create({
    data: {
      runType: mode === "manual" ? "MANUAL" : "SCHEDULED",
      status: "SUCCESS",
      summaryJson: {
        mode,
        created: createdIds.length,
        problems: generated.topProblems.length,
        opportunities: generated.topOpportunities.length,
      } as Prisma.InputJsonValue,
    },
  });

  return {
    runId: run.id,
    generated,
    persistedIds: createdIds,
  };
}

export async function listCeoDecisions(take = 100) {
  return prisma.ceoDecision.findMany({
    orderBy: { createdAt: "desc" },
    take,
  });
}

export async function approveCeoDecision(id: string, userId: string) {
  const d = await prisma.ceoDecision.findUnique({ where: { id } });
  if (!d || d.status !== "PROPOSED") throw new Error("invalid_state");

  await prisma.ceoDecision.update({
    where: { id },
    data: {
      status: "APPROVED",
      approvedAt: new Date(),
      approvedByUserId: userId,
    },
  });
}

export async function rejectCeoDecision(id: string) {
  const d = await prisma.ceoDecision.findUnique({ where: { id } });
  if (!d || d.status !== "PROPOSED") throw new Error("invalid_state");

  await prisma.ceoDecision.update({
    where: { id },
    data: {
      status: "REJECTED",
      rejectedAt: new Date(),
    },
  });
}

function parsePayload(raw: unknown): CeoDecisionPayload | null {
  if (!raw || typeof raw !== "object") return null;
  return raw as CeoDecisionPayload;
}

export async function executeCeoDecision(id: string): Promise<void> {
  const d = await prisma.ceoDecision.findUnique({ where: { id } });
  if (!d || d.status !== "APPROVED") throw new Error("must_be_approved");

  const payload = parsePayload(d.payloadJson);
  if (!payload) throw new Error("bad_payload");

  const baseline = await snapshotBaselineMetrics();

  if (payload.kind === "pricing_lead_adjust" || payload.kind === "pricing_featured_adjust") {
    if (Math.abs(payload.relativeDelta) >= CEO_PRICING_APPROVAL_THRESHOLD && (await recentMajorPricingMove())) {
      throw new Error("pricing_major_cooldown");
    }
  }

  let previous: Record<string, unknown> | null = null;
  const result: Record<string, unknown> = {
    baselineConversion: baseline.seniorConversionRate30d,
    appliedAt: new Date().toISOString(),
  };

  switch (payload.kind) {
    case "pricing_lead_adjust":
    case "pricing_featured_adjust": {
      const type = payload.kind === "pricing_lead_adjust" ? "LEAD" : MARKET_PRICING_TYPES.FEATURED;
      const rule = await prisma.lecipmMarketPricingRule.findUnique({ where: { type } });
      if (!rule) throw new Error("rule_missing");
      previous = { type, basePrice: rule.basePrice };
      const next = rule.basePrice * (1 + payload.relativeDelta);
      const clamped = Math.min(rule.maxPrice, Math.max(rule.minPrice, next));
      await prisma.lecipmMarketPricingRule.update({
        where: { type },
        data: { basePrice: clamped },
      });
      result.newBasePrice = clamped;
      break;
    }
    case "growth_seo_city_pages":
    case "growth_family_content":
    case "growth_cta_shift": {
      await prisma.seniorLivingGtmExecutionEvent.create({
        data: {
          eventType: "CEO_GROWTH_DRAFT",
          quantity: 1,
          notes: d.title,
          metadata: { payload } as Prisma.InputJsonValue,
        },
      });
      result.logged = "gtm_event";
      break;
    }
    case "outreach_operator_city":
    case "outreach_operator_reengage":
    case "outreach_broker_prospects": {
      result.queueDraft = payload;
      result.warn = "no_bulk_send_auto";
      break;
    }
    case "retention_broker_email":
    case "retention_operator_profile": {
      await prisma.seniorLivingGtmExecutionEvent.create({
        data: {
          eventType: "CEO_RETENTION_DRAFT",
          quantity: 1,
          notes: d.title,
          metadata: { payload } as Prisma.InputJsonValue,
        },
      });
      result.logged = "gtm_retention_draft";
      break;
    }
    case "retention_credit_offer":
    case "pricing_promo_operator":
    case "campaign_recommend":
    case "operations_note": {
      await prisma.seniorLivingGtmExecutionEvent.create({
        data: {
          eventType: "CEO_APPROVED_MATERIAL",
          quantity: 1,
          notes: d.title,
          metadata: { payload } as Prisma.InputJsonValue,
        },
      });
      result.logged = "gtm_material_queue";
      break;
    }
    default:
      throw new Error("unsupported_payload");
  }

  const post = await snapshotBaselineMetrics();
  result.postConversion = post.seniorConversionRate30d;

  await prisma.ceoDecision.update({
    where: { id },
    data: {
      status: "EXECUTED",
      executedAt: new Date(),
      resultJson: {
        ...result,
        previousState: previous,
      } as Prisma.InputJsonValue,
    },
  });
}

export async function rollbackCeoDecision(id: string): Promise<void> {
  const d = await prisma.ceoDecision.findUnique({ where: { id } });
  if (!d || d.status !== "EXECUTED" || !d.resultJson) throw new Error("cannot_rollback");

  const res = d.resultJson as { previousState?: { type?: string; basePrice?: number } };
  if (res.previousState?.type && res.previousState.basePrice != null) {
    await prisma.lecipmMarketPricingRule.update({
      where: { type: res.previousState.type },
      data: { basePrice: res.previousState.basePrice },
    });
  }

  await prisma.ceoDecision.update({
    where: { id },
    data: {
      status: "ROLLED_BACK",
      rolledBackAt: new Date(),
    },
  });
}
