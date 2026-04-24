import { Prisma } from "@prisma/client";
import { prisma } from "@repo/db";

import { outcomeAlertsFromSummary } from "./outcome-alerts";
import { maybeAppendLearningProposals } from "./outcome-learning.service";
import type { LecipmOutcomesSummary, OutcomeRecordInput, OutcomeSource, OutcomeWinMissRow, SystemPerformancePanelPayload } from "./outcome.types";

function asNumber(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function asBool(v: unknown): boolean | null {
  return typeof v === "boolean" ? v : null;
}

function labelFromJson(j: Prisma.JsonValue | null | undefined): string | null {
  if (j == null || typeof j !== "object" || j === null) return null;
  const o = j as Record<string, unknown>;
  if (typeof o.label === "string") return o.label;
  if (typeof o.state === "string") return o.state;
  if (typeof o.result === "string") return o.result;
  return null;
}

/**
 * Best-effort comparison for prediction quality (no silent failures: DB errors are surfaced to caller; see recordOutcome).
 */
export function comparePredictedActual(
  predicted: Prisma.JsonValue | null | undefined,
  actual: Prisma.JsonValue | null | undefined,
): { label: "match" | "miss" | "partial" | "unknown"; delta: Prisma.JsonValue | null } {
  if (predicted == null || actual == null) {
    return { label: "unknown", delta: null };
  }
  if (typeof predicted === "object" && predicted && typeof actual === "object" && actual) {
    const pr = predicted as Record<string, unknown>;
    const ar = actual as Record<string, unknown>;
    if (typeof pr.expectedPaymentStatus === "string" && typeof ar.paymentStatus === "string") {
      const ok = pr.expectedPaymentStatus === ar.paymentStatus;
      return { label: ok ? "match" : "miss", delta: { expected: pr.expectedPaymentStatus, got: ar.paymentStatus } };
    }
    if (pr.expectView === true && ar.viewed === true) {
      return { label: "match", delta: null };
    }
    if (pr.expectAccept === true && (ar as { accepted?: boolean }).accepted === true) {
      return { label: "match", delta: null };
    }
    const pb = pr.converted;
    const ab = ar.converted;
    if (typeof pb === "boolean" && typeof ab === "boolean") {
      return { label: pb === ab ? "match" : "miss", delta: { dConverted: ab ? 1 : 0, pConverted: pb ? 1 : 0 } };
    }
    const pl = labelFromJson(predicted);
    const al = labelFromJson(actual);
    if (pl && al) {
      return { label: pl === al ? "match" : "miss", delta: { pLabel: pl, aLabel: al } };
    }
    const pScore = asNumber((predicted as Record<string, unknown>).score);
    const aScore = asNumber((actual as Record<string, unknown>).score);
    if (pScore != null && aScore != null) {
      const d = Math.abs(aScore - pScore);
      return { label: d < 0.12 ? "match" : d < 0.3 ? "partial" : "miss", delta: { absScoreDelta: d } };
    }
  }
  if (typeof predicted === "number" && typeof actual === "number") {
    const d = Math.abs(actual - predicted);
    return { label: d < 1e-6 ? "match" : "miss", delta: { absDelta: d } };
  }
  if (typeof predicted === "boolean" && typeof actual === "boolean") {
    return { label: predicted === actual ? "match" : "miss", delta: null };
  }
  return { label: "unknown", delta: null };
}

export async function recordOutcome(
  input: OutcomeRecordInput,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  let comp = input.comparisonLabel;
  let errTags = input.errorPatternTags;
  let delta = input.delta ?? null;
  if (input.predictedOutcome != null && input.actualOutcome != null && !comp) {
    const c = comparePredictedActual(input.predictedOutcome, input.actualOutcome);
    comp = c.label;
    if (c.delta && delta == null) delta = c.delta;
    if (c.label === "miss" && !errTags?.length) {
      errTags = [`${input.source}:predicted_mismatch`];
    }
  }
  try {
    const row = await prisma.lecipmOutcomeEvent.create({
      data: {
        entityType: input.entityType,
        entityId: input.entityId,
        actionTaken: input.actionTaken,
        predictedOutcome: input.predictedOutcome === undefined ? Prisma.JsonNull : (input.predictedOutcome as object),
        actualOutcome: input.actualOutcome === undefined ? Prisma.JsonNull : (input.actualOutcome as object),
        delta: delta === undefined || delta === null ? Prisma.JsonNull : (delta as object),
        source: input.source,
        logTag: input.logTag,
        logMessage: input.logMessage,
        contextUserId: input.contextUserId,
        comparisonLabel: comp ?? null,
        errorPatternTags: errTags?.length ? (errTags as object) : Prisma.JsonNull,
      },
    });
    return { ok: true, id: row.id };
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    console.error("[lecipm][outcome] recordOutcome failed", { err, entityType: input.entityType, action: input.actionTaken });
    return { ok: false, error: err };
  }
}

type InternalRow = {
  id: string;
  entityType: string;
  entityId: string;
  actionTaken: string;
  predictedOutcome: Prisma.JsonValue | null;
  actualOutcome: Prisma.JsonValue | null;
  delta: Prisma.JsonValue | null;
  source: string;
  createdAt: Date;
  comparisonLabel: string | null;
};

function eventLists(rows: InternalRow[]) {
  let leadWon = 0;
  let leadLost = 0;
  let dealOk = 0;
  let dealBad = 0;
  let bookingDone = 0;
  let bookingNoshow = 0;
  let disputeS = 0;
  let payOk = 0;
  for (const r of rows) {
    const a = r.actionTaken;
    if (a === "pipeline_won" || a === "lead_converted") leadWon++;
    if (a === "pipeline_lost" || a === "lead_not_converted") leadLost++;
    if (a === "deal_closed" || a === "deal_success") dealOk++;
    if (a === "deal_failed" || a === "deal_lost") dealBad++;
    if (a === "booking_completed" || a === "visit_completed") bookingDone++;
    if (a === "booking_noshow" || a === "visit_noshow" || a === "cannot_attend") bookingNoshow++;
    if (a.startsWith("dispute_") || a === "dispute_opened") disputeS++;
    if (a === "payment_succeeded" || a === "charge_succeeded") payOk++;
  }
  const conv =
    leadWon + leadLost > 0 ? leadWon / (leadWon + leadLost) : null;
  const deal =
    dealOk + dealBad > 0 ? dealOk / (dealOk + dealBad) : null;
  const noshow =
    bookingDone + bookingNoshow > 0 ? bookingNoshow / (bookingDone + bookingNoshow) : null;
  const dispDen = disputeS + payOk;
  const disp = dispDen > 0 ? disputeS / dispDen : null;
  return { leadWon, leadLost, conv, deal, noshow, disp, disputeS, payOk };
}

function accuracyStats(rows: InternalRow[], source: OutcomeSource | "all") {
  const filtered =
    source === "all" ? rows : rows.filter((r) => r.source === source);
  let withBoth = 0;
  let matches = 0;
  for (const r of filtered) {
    if (r.comparisonLabel === "match" || r.comparisonLabel === "partial") {
      withBoth++;
      matches++;
    } else if (r.comparisonLabel === "miss") {
      withBoth++;
    } else if (r.predictedOutcome != null && r.actualOutcome != null) {
      withBoth++;
      const c = comparePredictedActual(r.predictedOutcome, r.actualOutcome);
      if (c.label === "match" || c.label === "partial") matches++;
    }
  }
  return { n: withBoth, accuracy: withBoth > 0 ? matches / withBoth : null as number | null };
}

function driftFromRows(rows: InternalRow[]): number | null {
  const nums: number[] = [];
  for (const r of rows) {
    if (r.delta && typeof r.delta === "object" && r.delta !== null) {
      const absScoreDelta = (r.delta as Record<string, unknown>).absScoreDelta;
      const absDelta = (r.delta as Record<string, unknown>).absDelta;
      if (typeof absScoreDelta === "number" && Number.isFinite(absScoreDelta)) nums.push(Math.abs(absScoreDelta));
      else if (typeof absDelta === "number" && Number.isFinite(absDelta)) nums.push(Math.abs(absDelta));
    }
  }
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function winMissFromRows(rows: InternalRow[], wins: boolean): OutcomeWinMissRow[] {
  const scored = rows
    .map((r) => {
      const del = r.delta;
      let score = 0;
      if (del && typeof del === "object" && del) {
        const o = del as Record<string, unknown>;
        if (typeof o.revenueProxyPct === "number") score = Math.abs(o.revenueProxyPct);
        if (typeof o.absScoreDelta === "number") score = Math.max(score, o.absScoreDelta);
        if (typeof o.absDelta === "number") score = Math.max(score, o.absDelta);
      }
      return { r, score, at: r.createdAt.toISOString() };
    })
    .filter((x) => {
      const lab = x.r.comparisonLabel;
      if (wins) return lab === "match" || lab === "partial";
      return lab === "miss";
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return scored.map((x) => ({
    id: x.r.id,
    title: wins ? "Strong alignment" : "Prediction miss",
    detail: `${x.r.entityType} · ${x.r.actionTaken}`.slice(0, 200),
    at: x.at,
    score: x.score,
  }));
}

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function buildImprovementSeries(rows: InternalRow[], days: number) {
  const by = new Map<string, { m: number; c: number; t: number }>();
  const now = new Date();
  for (let i = 0; i < days; i++) {
    const t = new Date(now);
    t.setDate(t.getDate() - i);
    by.set(dayKey(t), { m: 0, c: 0, t: 0 });
  }
  for (const r of rows) {
    const k = dayKey(r.createdAt);
    if (!by.has(k)) continue;
    const b = by.get(k)!;
    b.t++;
    if (r.predictedOutcome && r.actualOutcome) {
      b.c++;
      const lab = r.comparisonLabel;
      if (lab === "match" || lab === "partial") b.m++;
      else if (lab == null) {
        const c = comparePredictedActual(r.predictedOutcome, r.actualOutcome);
        if (c.label === "match" || c.label === "partial") b.m++;
      }
    }
  }
  return Array.from(by.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([day, v]) => ({
      day,
      count: v.t,
      accuracy: v.c > 0 ? v.m / v.c : null as number | null,
    }));
}

function priorSlice(s: LecipmOutcomesSummary): {
  conversionRate: number | null;
  predictionAccuracy: number | null;
  disputeRate: number | null;
  noShowRate: number | null;
} {
  return {
    conversionRate: s.conversionRate,
    predictionAccuracy: s.predictionAccuracy,
    disputeRate: s.disputeRate,
    noShowRate: s.noShowRate,
  };
}

export async function getLecipmOutcomesSummary(
  windowDays: number,
  options?: { includeLearning?: boolean; comparePriorWindow?: boolean },
): Promise<LecipmOutcomesSummary> {
  const w = Math.min(90, Math.max(3, windowDays));
  const to = new Date();
  const from = new Date(to.getTime() - w * 86400000);
  const includeLearning = options?.includeLearning !== false;
  const comparePrior = options?.comparePriorWindow === true;

  const [rows, priorRows, scenarioRows, audit, priorAudit] = await Promise.all([
    prisma.lecipmOutcomeEvent.findMany({
      where: { createdAt: { gte: from, lte: to } },
      take: 25000,
      orderBy: { createdAt: "desc" },
    }),
    comparePrior
      ? prisma.lecipmOutcomeEvent.findMany({
          where: {
            createdAt: { gte: new Date(from.getTime() - w * 86400000), lt: from },
          },
          take: 25000,
        })
      : Promise.resolve([] as InternalRow[]),
    prisma.lecipmScenarioAutopilotRun.findMany({
      where: { updatedAt: { gte: from }, outcomeJson: { not: Prisma.JsonNull } },
      take: 200,
      select: { id: true, outcomeJson: true, updatedAt: true },
    }),
    includeLearning
      ? prisma.lecipmLearningFeedbackAudit.count({ where: { status: "PROPOSED" } })
      : Promise.resolve(0),
    includeLearning && comparePrior
      ? prisma.lecipmLearningFeedbackAudit.findFirst({
          where: { status: "PROPOSED" },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve(null),
  ]);

  const irows = rows as unknown as InternalRow[];
  const prow = (priorRows as unknown as InternalRow[]) ?? [];
  const lists = eventLists(irows);
  const accAll = accuracyStats(irows, "all");
  const dIntel = accuracyStats(irows, "deal_intelligence");
  const trust = accuracyStats(irows, "trust_engine");
  const scenEvents = accuracyStats(irows, "scenario_autopilot");

  let scenarioAcc = scenEvents.accuracy;
  let scenarioN = scenEvents.n;
  if (scenarioRows.length) {
    let m = 0;
    let n = 0;
    for (const s of scenarioRows) {
      const o = s.outcomeJson as Record<string, unknown> | null;
      if (!o) continue;
      const d = o.didItMatchPrediction;
      if (d === "match" || d === "partial" || d === "unknown" || o.confidence != null) {
        n++;
        if (d === "match" || d === "partial") m += 1;
        else if (d === "unknown") m += 0.5;
      }
    }
    if (n > 0) {
      const fromRuns = m / n;
      scenarioN = Math.max(n, scenEvents.n);
      scenarioAcc = scenEvents.n > 0 && scenEvents.accuracy != null
        ? (scenEvents.accuracy * scenEvents.n + fromRuns * n) / (scenEvents.n + n)
        : fromRuns;
    }
  }

  const globalAcc = accAll.accuracy;
  const winMissRows = irows.filter((r) => r.predictedOutcome && r.actualOutcome);
  const biggestWins = winMissFromRows(winMissRows, true);
  const biggestMisses = winMissFromRows(winMissRows, false);

  const out: LecipmOutcomesSummary = {
    windowDays: w,
    from: from.toISOString(),
    to: to.toISOString(),
    sampleSize: irows.length,
    conversionRate: lists.conv,
    dealSuccessRate: lists.deal,
    noShowRate: lists.noshow,
    disputeRate: lists.disp,
    predictionAccuracy: globalAcc,
    drift: driftFromRows(irows),
    learning: {
      proposedAdjustments: proposedCount,
      lastProposalAt: lastProposal ? lastProposal.createdAt.toISOString() : null,
    },
    domainBreakdown: {
      dealIntelligence: { accuracy: dIntel.accuracy, n: dIntel.n },
      trustEngine: { accuracy: trust.accuracy, n: trust.n },
      scenarioAutopilot: { accuracy: scenarioAcc, n: Math.max(scenarioN, scenEvents.n) },
    },
    improvementSeries: buildImprovementSeries(irows, 14),
    biggestWins: biggestWins.length ? biggestWins : biggestWinsFromScenario(scenarioRows),
    biggestMisses: biggestMisses.length ? biggestMisses : [],
    alerts: [],
  };

  if (includeLearning) {
    await maybeAppendLearningProposals(out).catch((e) =>
      console.error("[lecipm][outcome] learning proposal failed", e instanceof Error ? e.message : e),
    );
  }

  if (comparePrior && prow.length) {
    const priorOut = { ...out, ...eventLists(prow) };
    const pConv = (priorOut as { conv?: number | null }).conv ?? null;
    const pAcc = accuracyStats(prow, "all").accuracy;
    const pDisp = eventLists(prow).disp;
    const pNs = eventLists(prow).noshow;
    out.alerts = outcomeAlertsFromSummary(out, { conversionRate: pConv, predictionAccuracy: pAcc, disputeRate: pDisp, noShowRate: pNs });
  } else {
    out.alerts = outcomeAlertsFromSummary(out, null);
  }

  return out;
}

function biggestWinsFromScenario(
  runs: { id: string; outcomeJson: Prisma.JsonValue | null; updatedAt: Date }[],
): OutcomeWinMissRow[] {
  return runs
    .map((r) => {
      const o = (r.outcomeJson as Record<string, unknown> | null)?.delta as Record<string, unknown> | undefined;
      const rev = o && typeof o.revenueProxyPct === "number" ? Math.abs(o.revenueProxyPct) : 0;
      return {
        id: r.id,
        title: "Scenario lift",
        detail: "Autopilot run outcome vs baseline",
        at: r.updatedAt.toISOString(),
        score: rev,
      };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

export async function loadSystemPerformancePanel(): Promise<SystemPerformancePanelPayload> {
  const s = await getLecipmOutcomesSummary(30, { includeLearning: true, comparePriorWindow: true });
  return {
    predictionAccuracy: s.predictionAccuracy,
    improvementHint:
      s.improvementSeries.length > 1 &&
      s.improvementSeries[s.improvementSeries.length - 1]?.accuracy != null &&
      s.improvementSeries[0]?.accuracy != null
        ? (() => {
            const a = s.improvementSeries[s.improvementSeries.length - 1]!.accuracy!;
            const b = s.improvementSeries[0]!.accuracy ?? a;
            const d = a - b;
            return d >= 0 ? `Accuracy up ${(d * 100).toFixed(1)} pts vs. start of series` : `Accuracy down ${(Math.abs(d) * 100).toFixed(1)} pts — review model calibration`;
          })()
        : "Connect leads, bookings, and scenario baselines to populate this series.",
    conversionRate: s.conversionRate,
    dealSuccessRate: s.dealSuccessRate,
    noShowRate: s.noShowRate,
    disputeRate: s.disputeRate,
    drift: s.drift,
    domainBreakdown: s.domainBreakdown,
    biggestWins: s.biggestWins,
    biggestMisses: s.biggestMisses,
    improvementSeries: s.improvementSeries,
    learningQueue: s.learning.proposedAdjustments,
    generatedAt: new Date().toISOString(),
  };
}

export function predictedTierFromLeadScore(score: number): { label: string; pConvert: number } {
  if (score >= 80) return { label: "hot", pConvert: 0.45 };
  if (score >= 60) return { label: "warm", pConvert: 0.25 };
  return { label: "cold", pConvert: 0.12 };
}
