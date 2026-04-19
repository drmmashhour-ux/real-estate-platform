/**
 * Aggregates AI / broker competition / scale measurement rows with insight lines.
 */

import { buildAiExecutionResults } from "@/modules/growth/ai-execution-results.service";
import { buildBrokerCompetitionResults } from "@/modules/growth/broker-competition-results.service";
import { buildScaleSystemResults } from "@/modules/growth/scale-system-results.service";
import { AI_TELEMETRY_SPARSE_THRESHOLD } from "@/modules/growth/growth-execution-results-bands";
import { monitorGrowthExecutionResultsSummary } from "@/modules/growth/growth-execution-results-monitoring.service";
import type { GrowthExecutionResultsSummary, OutcomeBand } from "@/modules/growth/growth-execution-results.types";

type SummaryCore = Omit<GrowthExecutionResultsSummary, "insights" | "generatedAt">;

function countBands<T extends { outcomeBand: OutcomeBand }>(rows: T[]): Record<OutcomeBand, number> {
  const c: Record<OutcomeBand, number> = {
    positive: 0,
    neutral: 0,
    negative: 0,
    insufficient_data: 0,
  };
  for (const r of rows) c[r.outcomeBand] += 1;
  return c;
}

function buildInsights(summary: Omit<GrowthExecutionResultsSummary, "insights" | "generatedAt">): string[] {
  const lines: string[] = [];
  lines.push(
    "Aggregates describe co-occurrence in logging — not proof that AI, competition, or scale UI caused operational change.",
  );

  if (summary.sparseDataWarnings.length > 0) {
    lines.push(...summary.sparseDataWarnings.slice(0, 2));
  }

  const aiPos = summary.aiAssistResults.filter((r) => r.outcomeBand === "positive").length;
  const brPos = summary.brokerCompetitionResults.filter((r) => r.outcomeBand === "positive").length;
  if (aiPos > 0) {
    lines.push(
      `${aiPos} AI suggestion row(s) show engagement telemetry (copy/ack) — still self-reported via events, not outcomes.`,
    );
  }
  if (summary.brokerCompetitionResults.length > 0) {
    const ins = summary.brokerCompetitionResults.filter((r) => r.outcomeBand === "insufficient_data").length;
    lines.push(
      `Broker rows: ${brPos} positive band, ${ins} thin-data — monetization deltas are noisy in short windows.`,
    );
  }
  const sc = summary.scaleResults.find((s) => s.targetType === "leads");
  if (sc && sc.outcomeBand === "positive") {
    lines.push(
      `Lead volume moved favorably vs the prior window by ${sc.delta} — could reflect many factors beyond the Growth panels.`,
    );
  }

  return lines.slice(0, 7);
}

export async function buildGrowthExecutionResultsSummary(
  windowDays: number,
): Promise<GrowthExecutionResultsSummary> {
  const [ai, broker, scale] = await Promise.all([
    buildAiExecutionResults(windowDays),
    buildBrokerCompetitionResults(windowDays),
    buildScaleSystemResults(windowDays),
  ]);

  const sparseDataWarnings: string[] = [];
  if (ai.sparseTelemetry) {
    sparseDataWarnings.push(
      `AI execution telemetry is sparse (< ${AI_TELEMETRY_SPARSE_THRESHOLD} events in ${windowDays}d) — add interactions or widen the window.`,
    );
  }
  if (broker.length > 0 && broker.every((b) => b.outcomeBand === "insufficient_data")) {
    sparseDataWarnings.push("Broker monetization proxies are uniformly thin — comparison windows may be too short.");
  }

  const partial: SummaryCore = {
    aiAssistResults: ai.results,
    brokerCompetitionResults: broker,
    scaleResults: scale,
    sparseDataWarnings,
    windowDays,
  };

  const insights = buildInsights(partial);

  const bandAgg = {
    ai: countBands(ai.results),
    broker: countBands(broker),
    scale: countBands(scale),
  };

  monitorGrowthExecutionResultsSummary({
    windowDays,
    bandAgg,
    sparseAi: ai.sparseTelemetry,
    sparseBrokerUniform: broker.length > 0 && broker.every((b) => b.outcomeBand === "insufficient_data"),
  });

  return {
    ...partial,
    insights,
    generatedAt: new Date().toISOString(),
  };
}
