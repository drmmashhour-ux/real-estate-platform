import { createHash } from "crypto";

import { prisma } from "@/lib/db";
import { buildExplanation, thinDataDisclaimer } from "@/modules/ai-ceo/ai-ceo-explainability.service";
import { aiCeoLog } from "@/modules/ai-ceo/ai-ceo-log";
import { prioritizeRecommendations } from "@/modules/ai-ceo/ai-ceo-prioritization.service";
import type {
  AiCeoCategory,
  AiCeoExecutionSafety,
  AiCeoImpactBand,
  AiCeoPlatformContext,
  AiCeoPrioritizedSet,
  AiCeoRecommendationDraft,
  AiCeoSignalRef,
} from "@/modules/ai-ceo/ai-ceo.types";

export function fingerprintForRecommendation(parts: string[]): string {
  return createHash("sha256").update(parts.join("|")).digest("hex").slice(0, 48);
}

export async function buildCeoContext(): Promise<AiCeoPlatformContext> {
  const thinDataWarnings: string[] = [];
  const since7 = new Date();
  since7.setDate(since7.getDate() - 7);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const stalledCutoff = new Date();
  stalledCutoff.setDate(stalledCutoff.getDate() - 21);

  const [
    executive,
    dealActive,
    dealStalled,
    dealGroup,
    bookingsToday,
    execTotal,
    blockTotal,
    pendingApprovals,
    campaigns,
    seoDrafts,
    learningLinked,
  ] = await Promise.all([
    prisma.executiveSnapshot
      .findFirst({
        where: { ownerType: "admin", ownerId: "platform" },
        orderBy: { snapshotDate: "desc" },
        select: {
          financialMetrics: true,
          platformMetrics: true,
          riskLevel: true,
          snapshotDate: true,
        },
      })
      .catch(() => null),
    prisma.deal
      .count({
        where: { status: { notIn: ["closed", "cancelled"] } },
      })
      .catch(() => null),
    prisma.deal
      .count({
        where: {
          status: { notIn: ["closed", "cancelled"] },
          updatedAt: { lt: stalledCutoff },
        },
      })
      .catch(() => null),
    prisma.deal
      .groupBy({
        by: ["status"],
        where: { status: { notIn: ["closed", "cancelled"] } },
        _count: { _all: true },
      })
      .catch(() => []),
    prisma.booking
      .count({ where: { createdAt: { gte: startOfToday } } })
      .catch(() => null),
    prisma.lecipmFullAutopilotExecution
      .count({ where: { createdAt: { gte: since7 } } })
      .catch(() => null),
    prisma.lecipmFullAutopilotExecution
      .count({
        where: { createdAt: { gte: since7 }, decisionOutcome: "BLOCK" },
      })
      .catch(() => null),
    prisma.platformAutopilotAction
      .count({
        where: { status: "pending_approval", entityType: "lecipm_full_autopilot" },
      })
      .catch(() => null),
    prisma.marketingCampaign
      .count({
        where: {
          updatedAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      })
      .catch(() => null),
    prisma.seoPageDraft.count().catch(() => null),
    prisma.lecipmFullAutopilotExecution
      .count({
        where: { createdAt: { gte: since7 }, outcomeDeltaJson: { not: null } },
      })
      .catch(() => null),
  ]);

  if (!executive) thinDataWarnings.push("No recent executive snapshot — financial/market fusion is thin.");

  const snapshotAgeHours =
    executive?.snapshotDate ?
      (Date.now() - executive.snapshotDate.getTime()) / 3_600_000
    : null;

  const blockRate =
    execTotal && execTotal > 0 ? blockTotal! / execTotal
    : execTotal === 0 ? null
    : null;

  const fin = (executive?.financialMetrics ?? {}) as Record<string, unknown>;
  const plat = (executive?.platformMetrics ?? {}) as Record<string, unknown>;

  return {
    generatedAt: new Date().toISOString(),
    executive: {
      financialHints: fin,
      platformHints: plat,
      riskLevel: executive?.riskLevel ?? null,
      snapshotAgeHours,
    },
    revenue: {
      note: "Derived from latest executive snapshot JSON — not audited financial statements.",
      conversionProxy:
        typeof plat.conversionRate === "number" ? plat.conversionRate
        : typeof plat.leadToBookingRate === "number" ? plat.leadToBookingRate
        : null,
    },
    deals: {
      activeCount: dealActive,
      stalledCount: dealStalled,
      statusDistribution: dealGroup.map((g) => ({ status: g.status, count: g._count._all })),
    },
    bookings: {
      bookingsToday,
      bookingWindowNote: "BNHub booking creations since local midnight — proxy for demand pulse.",
    },
    autonomy: {
      autopilotExecutions7d: execTotal,
      blockRate,
      approvalQueueDepth: pendingApprovals,
    },
    marketing: {
      campaignsTouchedMtd: campaigns,
      seoDraftInventory: seoDrafts,
    },
    capital: {
      note: "Capital allocator posture is approval-gated — review allocator queues outside blind automation.",
    },
    marketplace: {
      note: "Marketplace optimization proposals remain human-gated in autopilot policy.",
    },
    learning: {
      outcomeLinked7d: learningLinked,
      note: "Counts executions with outcome deltas populated (telemetry coverage).",
    },
    coverage: { thinDataWarnings },
  };
}

function sig(id: string, label: string, value: unknown, source: string): AiCeoSignalRef {
  return {
    id,
    label,
    value: typeof value === "number" || typeof value === "boolean" || value === null ? value : String(value),
    source,
  };
}

function draft(
  ctx: AiCeoPlatformContext,
  keys: {
    slug: string;
    category: AiCeoCategory;
    title: string;
    summary: string;
    band: AiCeoImpactBand;
    confidence: number;
    urgency: AiCeoRecommendationDraft["urgency"];
    effort: AiCeoRecommendationDraft["requiredEffort"];
    domains: string[];
    safety: AiCeoExecutionSafety;
    signals: AiCeoSignalRef[];
    triggers: string[];
    why: string;
    ignored: string;
    confWhy: string;
  }
): AiCeoRecommendationDraft {
  const fingerprint = fingerprintForRecommendation([keys.slug, keys.category]);
  const basis = thinDataDisclaimer(ctx);
  return {
    fingerprint,
    title: keys.title,
    category: keys.category,
    summary: keys.summary,
    expectedImpactBand: keys.band,
    confidenceScore: keys.confidence,
    urgency: keys.urgency,
    requiredEffort: keys.effort,
    affectedDomains: keys.domains,
    executionSafety: keys.safety,
    signalsUsed: keys.signals,
    explanation: buildExplanation({
      title: keys.title,
      signals: keys.signals,
      triggers: keys.triggers,
      whyItMatters: keys.why,
      ifIgnored: keys.ignored,
      dataBasisNote: basis,
      confidenceRationale: keys.confWhy,
    }),
    inputSnapshot: {
      generatedAt: ctx.generatedAt,
      thinData: ctx.coverage.thinDataWarnings,
      dealStalled: ctx.deals?.stalledCount,
      blockRate: ctx.autonomy?.blockRate,
    },
  };
}

/** Deterministic strategic candidates — replaceable with model-backed generator behind same interface. */
export function generateStrategicRecommendations(ctx: AiCeoPlatformContext): AiCeoRecommendationDraft[] {
  const out: AiCeoRecommendationDraft[] = [];

  const stalled = ctx.deals?.stalledCount ?? 0;
  if (stalled >= 2) {
    out.push(
      draft(ctx, {
        slug: "deal_velocity_stall",
        category: "risk",
        title: "Accelerate review of aging open deals",
        summary: `${stalled} deals show no milestone movement for 21+ days — broker coordination may be required.`,
        band: stalled >= 6 ? "meaningful" : "moderate",
        confidence: stalled >= 6 ? 0.72 : 0.58,
        urgency: stalled >= 6 ? "high" : "medium",
        effort: "medium",
        domains: ["deal_intelligence", "broker_ops"],
        safety: "APPROVAL_REQUIRED",
        signals: [
          sig("deals.stalled", "Stalled deals (21d+)", stalled, "crm.deal"),
          sig("deals.active", "Active pipeline", ctx.deals?.activeCount ?? "n/a", "crm.deal"),
        ],
        triggers: ["Stalled deal count crossed advisory threshold"],
        why: "Stale inventory consumes broker attention and may impair closing cadence.",
        ignored: "Pipeline leakage and buyer frustration may rise without targeted triage.",
        confWhy: "Based on CRM milestone timestamps — does not infer legal defects.",
      })
    );
  }

  const br = ctx.autonomy?.blockRate;
  if (br != null && br > 0.22) {
    out.push(
      draft(ctx, {
        slug: "autonomy_friction",
        category: "cost",
        title: "Reduce autonomy policy friction hotspots",
        summary: `Autopilot block rate ~${(br * 100).toFixed(0)}% (7d) — review governing policies vs operational reality.`,
        band: br > 0.35 ? "meaningful" : "moderate",
        confidence: 0.62,
        urgency: "medium",
        effort: "high",
        domains: ["compliance_actions", "autopilot_governance"],
        safety: "NEVER_AUTO",
        signals: [
          sig("auto.block_rate", "Block rate 7d", br, "lecipm_full_autopilot_execution"),
          sig("auto.exec7d", "Executions 7d", ctx.autonomy?.autopilotExecutions7d ?? "n/a", "lecipm_full_autopilot_execution"),
        ],
        triggers: ["Elevated BLOCK outcomes in bounded autopilot"],
        why: "Friction can slow broker throughput while still protecting compliance — rebalance gates deliberately.",
        ignored: "Queues may swell and broker trust in automation may decay.",
        confWhy: "Uses orchestration audit counts only — not content-level legal review.",
      })
    );
  }

  const conv = ctx.revenue?.conversionProxy;
  if (conv != null && conv > 0.12) {
    out.push(
      draft(ctx, {
        slug: "marketing_double_down",
        category: "growth",
        title: "Test incremental demand capture in high-conversion corridors",
        summary:
          "Executive funnel proxy suggests healthy conversion — consider **controlled** spend experiments (still approval-gated).",
        band: "moderate",
        confidence: 0.55,
        urgency: "medium",
        effort: "medium",
        domains: ["marketing", "growth_engine"],
        safety: "APPROVAL_REQUIRED",
        signals: [sig("exec.conversion", "Conversion proxy", conv, "executive_snapshot.platformMetrics")],
        triggers: ["Conversion proxy above conservative threshold"],
        why: "Scaling proven corridors can improve CAC efficiency when telemetry supports it.",
        ignored: "Growth may plateau if demand is captured only organically.",
        confWhy: "Proxy metric — validate with channel attribution before budget shifts.",
      })
    );
  }

  const depth = ctx.autonomy?.approvalQueueDepth ?? 0;
  if (depth >= 8) {
    out.push(
      draft(ctx, {
        slug: "governance_queue_depth",
        category: "cost",
        title: "Address deep autopilot approval backlog",
        summary: `${depth} pending high-impact actions await human review — SLA risk for revenue moments.`,
        band: "moderate",
        confidence: 0.68,
        urgency: "high",
        effort: "low",
        domains: ["autopilot_governance"],
        safety: "APPROVAL_REQUIRED",
        signals: [sig("auto.pending", "Pending approvals", depth, "platform_autopilot_action")],
        triggers: ["Approval queue depth sustained"],
        why: "Backlogs delay priced actions and weaken operator trust in the autonomy program.",
        ignored: "Latency may convert into missed marketplace windows.",
        confWhy: "Direct platform action queue count — excludes external MLS approvals.",
      })
    );
  }

  const bookingsToday = ctx.bookings?.bookingsToday ?? 0;
  if (bookingsToday === 0) {
    out.push(
      draft(ctx, {
        slug: "booking_pulse_soft",
        category: "expansion",
        title: "Investigate soft booking creation pulse (today)",
        summary: "Zero BNHub bookings recorded since midnight local — may be normal, or signal instrumentation/market pause.",
        band: "uncertain_thin_data",
        confidence: 0.35,
        urgency: "low",
        effort: "low",
        domains: ["booking", "bnhub"],
        safety: "ADVISORY_ONLY",
        signals: [sig("bn.bookings_today", "Bookings today", bookingsToday, "booking.createdAt")],
        triggers: ["Zero booking creations in rolling day window"],
        why: "Early detection of demand shocks protects revenue planning.",
        ignored: "Slow reaction to macro demand shifts.",
        confWhy: "Single-day signal — combine with weekly aggregates before strategic bets.",
      })
    );
  }

  out.push(
    draft(ctx, {
      slug: "capital_allocator_review",
      category: "risk",
      title: "Schedule allocator snapshot review (no auto-deploy)",
      summary:
        "Capital recommendations remain approval-only — executive review protects fiduciary posture.",
      band: "moderate",
      confidence: 0.5,
      urgency: "medium",
      effort: "low",
      domains: ["capital_allocator", "investment"],
      safety: "NEVER_AUTO",
      signals: [sig("capital.note", "Policy", "approval-gated", "platform.capital")],
      triggers: ["Standing governance requirement for allocator surfacing"],
      why: "Prevents accidental deployment outside IC-approved rails.",
      ignored: "Misalignment between recommendations and treasury policy may persist silently.",
      confWhy: "Non-quantitative governance reminder — always requires human IC context.",
    })
  );

  const linked = ctx.learning?.outcomeLinked7d ?? 0;
  if (linked < 5 && (ctx.autonomy?.autopilotExecutions7d ?? 0) > 20) {
    out.push(
      draft(ctx, {
        slug: "learning_linkage",
        category: "growth",
        title: "Improve outcome linkage for learning loops",
        summary:
          "High autopilot volume but sparse outcome deltas — telemetry wiring unlocks safer automation.",
        band: "moderate",
        confidence: 0.52,
        urgency: "medium",
        effort: "high",
        domains: ["learning_engine", "autopilot"],
        safety: "ADVISORY_ONLY",
        signals: [
          sig("learn.linked", "Outcome-linked execs 7d", linked, "lecipm_full_autopilot_execution"),
          sig("auto.exec7d", "Executions 7d", ctx.autonomy?.autopilotExecutions7d ?? "n/a", "lecipm_full_autopilot_execution"),
        ],
        triggers: ["Outcome linkage coverage below pragmatic target"],
        why: "Without outcomes, strategic recommendations stay intentionally conservative.",
        ignored: "Automation policy may remain frozen at lowest common denominator.",
        confWhy: "Coverage metric only — does not judge causal uplift.",
      })
    );
  }

  const risk = (ctx.executive?.riskLevel ?? "").toLowerCase();
  if (risk === "high" || risk === "critical") {
    out.push(
      draft(ctx, {
        slug: "exec_risk_posture",
        category: "risk",
        title: "Escalate enterprise risk posture review",
        summary: `Executive snapshot risk band is **${risk}** — align leadership + compliance before expansion bets.`,
        band: "meaningful",
        confidence: 0.7,
        urgency: "critical",
        effort: "medium",
        domains: ["executive", "compliance"],
        safety: "NEVER_AUTO",
        signals: [sig("exec.risk", "Executive risk level", risk, "executive_snapshot")],
        triggers: ["Executive composite risk tier elevated"],
        why: "Prevents aggressive go-to-market moves during unstable operating conditions.",
        ignored: "Cross-functional incidents may compound without executive alignment.",
        confWhy: "Derived from persisted executive assessment — not real-time market feed.",
      })
    );
  }

  aiCeoLog("info", "recommendations_generated", { count: out.length });
  return out;
}

export function buildPrioritizedRecommendations(ctx: AiCeoPlatformContext): AiCeoPrioritizedSet {
  const drafts = generateStrategicRecommendations(ctx);
  return prioritizeRecommendations(drafts);
}
