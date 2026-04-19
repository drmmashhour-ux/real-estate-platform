/**
 * Deterministic aggregation of raw fast-deal rows — no I/O. Used by summary builder and unit tests.
 */

import type {
  FastDealLandingPerformanceRow,
  FastDealOutcomeBucket,
  FastDealPlaybookProgressRow,
  FastDealSourcingUsageRow,
  FastDealSparseSummary,
} from "@/modules/growth/fast-deal-results.types";

const DEFAULT_MARKET = "unspecified";

type SourceRow = {
  sourceType: string;
  sourceSubType: string;
  metadataJson: unknown;
};

type OutcomeRow = { outcomeType: string };

function meta(m: unknown): Record<string, unknown> {
  if (m && typeof m === "object" && !Array.isArray(m)) return m as Record<string, unknown>;
  return {};
}

export function computeSparseSummary(sourceEventCount: number, outcomeCount: number): FastDealSparseSummary {
  const total = sourceEventCount + outcomeCount;
  if (total < 8) {
    return {
      level: "very_low",
      message:
        "Very few logged events — comparisons between channels or markets are not reliable yet. Keep logging operator actions explicitly.",
    };
  }
  if (total < 35) {
    return {
      level: "low",
      message:
        "Early sample — directional only. Prefer trends over single-week comparisons; sparse segments stay labeled below.",
    };
  }
  return {
    level: "ok",
    message:
      "Enough rows for coarse internal views; still not causal proof — attribution is manual and partial.",
  };
}

export function aggregateSourcing(rows: SourceRow[]): FastDealSourcingUsageRow[] {
  const byPlatform = new Map<
    string,
    { events: number; queryCopies: number; sessionsStarted: number }
  >();

  for (const r of rows) {
    if (r.sourceType !== "broker_sourcing") continue;
    const m = meta(r.metadataJson);
    const platform = typeof m.platform === "string" && m.platform.trim() ? m.platform.trim() : "unknown_platform";
    if (!byPlatform.has(platform)) {
      byPlatform.set(platform, { events: 0, queryCopies: 0, sessionsStarted: 0 });
    }
    const b = byPlatform.get(platform)!;
    b.events += 1;
    if (r.sourceSubType === "query_copied") b.queryCopies += 1;
    if (r.sourceSubType === "session_started") b.sessionsStarted += 1;
  }

  return [...byPlatform.entries()]
    .map(([platform, v]) => ({
      platform,
      events: v.events,
      queryCopies: v.queryCopies,
      sessionsStarted: v.sessionsStarted,
    }))
    .sort((a, b) => b.events - a.events);
}

export function aggregateLanding(rows: SourceRow[]): FastDealLandingPerformanceRow[] {
  const byMarket = new Map<string, { previewShown: number; formStarted: number; submitted: number }>();

  for (const r of rows) {
    if (r.sourceType !== "landing_capture") continue;
    const m = meta(r.metadataJson);
    const market =
      typeof m.marketVariant === "string" && m.marketVariant.trim()
        ? m.marketVariant.trim()
        : DEFAULT_MARKET;
    if (!byMarket.has(market)) {
      byMarket.set(market, { previewShown: 0, formStarted: 0, submitted: 0 });
    }
    const b = byMarket.get(market)!;
    if (r.sourceSubType === "landing_preview_shown") b.previewShown += 1;
    if (r.sourceSubType === "lead_form_started") b.formStarted += 1;
    if (r.sourceSubType === "lead_submitted") b.submitted += 1;
  }

  return [...byMarket.entries()]
    .map(([marketVariant, v]) => ({
      marketVariant,
      previewShown: v.previewShown,
      formStarted: v.formStarted,
      submitted: v.submitted,
    }))
    .sort((a, b) => b.submitted + b.previewShown - (a.submitted + a.previewShown));
}

export function aggregatePlaybook(rows: SourceRow[]): FastDealPlaybookProgressRow[] {
  const stepMeta = new Map<number, { ack: number; done: number }>();
  const maxStep = 5;

  for (let s = 1; s <= maxStep; s++) stepMeta.set(s, { ack: 0, done: 0 });

  for (const r of rows) {
    if (r.sourceType !== "closing_playbook") continue;
    const m = meta(r.metadataJson);
    const step = typeof m.step === "number" && Number.isFinite(m.step) ? Math.round(m.step) : null;
    if (!step || step < 1 || step > maxStep) continue;
    const slot = stepMeta.get(step)!;
    if (r.sourceSubType === "step_acknowledged") slot.ack += 1;
    if (r.sourceSubType === "step_completed") slot.done += 1;
  }

  const rowsOut: FastDealPlaybookProgressRow[] = [];
  for (let s = 1; s <= maxStep; s++) {
    const v = stepMeta.get(s)!;
    if (v.ack === 0 && v.done === 0) continue;
    const possiblySkippedHints = Math.max(0, v.ack - v.done);
    rowsOut.push({
      step: s,
      acknowledged: v.ack,
      completed: v.done,
      possiblySkippedHints,
    });
  }
  return rowsOut.sort((a, b) => a.step - b.step);
}

export function aggregateOutcomeBuckets(rows: OutcomeRow[]): FastDealOutcomeBucket[] {
  const counts = new Map<string, number>();
  for (const r of rows) {
    counts.set(r.outcomeType, (counts.get(r.outcomeType) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([outcomeType, count]) => ({ outcomeType, count }))
    .sort((a, b) => b.count - a.count);
}
