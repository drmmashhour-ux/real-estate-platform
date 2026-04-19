/**
 * AI execution usage from `growth_events` — no implied causality.
 */

import { prisma } from "@/lib/db";
import { GrowthEventName } from "@/modules/growth/event-types";
import { buildAiExecutionSuggestions } from "@/modules/growth/ai-assisted-execution.service";
import { getBrokerPerformanceSummaries } from "@/modules/growth/broker-performance.service";
import { buildGrowthPolicyEnforcementSnapshot } from "@/modules/growth/growth-policy-enforcement.service";
import { getEnforcementForTarget } from "@/modules/growth/growth-policy-enforcement-query.service";
import { growthPolicyEnforcementFlags } from "@/config/feature-flags";
import { bandAiUsage, AI_TELEMETRY_SPARSE_THRESHOLD } from "@/modules/growth/growth-execution-results-bands";
import type { AiAssistSuggestion } from "@/modules/growth/ai-assisted-execution.types";
import type { AiExecutionUsageOutcome } from "@/modules/growth/growth-execution-results.types";

function metaSuggestionId(meta: unknown): string | null {
  if (!meta || typeof meta !== "object") return null;
  const g = (meta as Record<string, unknown>).growthExecution;
  if (!g || typeof g !== "object") return null;
  const id = (g as Record<string, unknown>).suggestionId;
  return typeof id === "string" ? id : null;
}

/** Deterministic CRM-based AI assist rows — shared by telemetry aggregation + execution planner. */
export async function loadAiAssistSuggestionsWithContext(): Promise<{
  suggestions: AiAssistSuggestion[];
  governanceFreeze: boolean;
}> {
  let governanceFreeze = false;
  if (growthPolicyEnforcementFlags.growthPolicyEnforcementV1) {
    const snap = await buildGrowthPolicyEnforcementSnapshot();
    if (snap) {
      const d = getEnforcementForTarget("autopilot_safe_execution", snap);
      governanceFreeze = d.mode === "freeze" || d.mode === "block";
    }
  }
  const topLead = await prisma.lead.findFirst({
    orderBy: { score: "desc" },
    select: { score: true, pipelineStatus: true, aiTier: true },
  });
  const topBrokers = await getBrokerPerformanceSummaries(1);
  const top = topBrokers[0];

  const suggestions = buildAiExecutionSuggestions({
    governanceFreeze,
    topLeadScore: topLead?.score ?? null,
    leadPipelineStatus: topLead?.pipelineStatus ?? null,
    leadAiTier: topLead?.aiTier ?? null,
    topBrokerId: top?.userId ?? null,
    topBrokerLabel: top?.email ?? top?.userId ?? null,
  });

  return { suggestions, governanceFreeze };
}

function explainAi(o: AiExecutionUsageOutcome): string {
  if (o.outcomeBand === "insufficient_data") {
    return "No telemetry rows in-window for this suggestion — usage unknown (enable execution-results telemetry via panel interactions).";
  }
  if (o.locallyApproved || o.copied) {
    return "Operator engaged (copy or local approve) — association only; no proof of downstream pipeline impact.";
  }
  if (o.ignored) {
    return "Marked ignored — neutral signal; does not imply quality of the suggestion.";
  }
  return "View-only or ambiguous interaction mix — treat as weak evidence.";
}

export async function buildAiExecutionResults(windowDays: number): Promise<{
  results: AiExecutionUsageOutcome[];
  telemetryEventCount: number;
  sparseTelemetry: boolean;
  suggestions: AiAssistSuggestion[];
  governanceFreeze: boolean;
}> {
  const until = new Date();
  const since = new Date(until.getTime() - windowDays * 86400000);

  const { suggestions, governanceFreeze } = await loadAiAssistSuggestionsWithContext();

  const rows = await prisma.growthEvent.findMany({
    where: {
      createdAt: { gte: since },
      eventName: {
        in: [
          GrowthEventName.GROWTH_EXECUTION_AI_VIEW,
          GrowthEventName.GROWTH_EXECUTION_AI_COPY,
          GrowthEventName.GROWTH_EXECUTION_AI_ACK,
          GrowthEventName.GROWTH_EXECUTION_AI_IGNORE,
        ],
      },
    },
    select: { eventName: true, metadata: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 5000,
  });

  const byId = new Map<
    string,
    { viewed: boolean; copied: boolean; ack: boolean; ignored: boolean; lastAt: Date }
  >();

  for (const r of rows) {
    const id = metaSuggestionId(r.metadata);
    if (!id) continue;
    let cur = byId.get(id);
    if (!cur) {
      cur = { viewed: false, copied: false, ack: false, ignored: false, lastAt: r.createdAt };
      byId.set(id, cur);
    }
    if (r.eventName === GrowthEventName.GROWTH_EXECUTION_AI_VIEW) cur.viewed = true;
    if (r.eventName === GrowthEventName.GROWTH_EXECUTION_AI_COPY) cur.copied = true;
    if (r.eventName === GrowthEventName.GROWTH_EXECUTION_AI_ACK) cur.ack = true;
    if (r.eventName === GrowthEventName.GROWTH_EXECUTION_AI_IGNORE) cur.ignored = true;
    if (r.createdAt > cur.lastAt) cur.lastAt = r.createdAt;
  }

  const ids = [...new Set(suggestions.map((s) => s.id))];
  const results: AiExecutionUsageOutcome[] = [];

  for (const id of ids) {
    const t = byId.get(id);
    const hasAny = !!t && (t.viewed || t.copied || t.ack || t.ignored);
    const viewed = !!(t?.viewed || t?.copied || t?.ack || t?.ignored);
    const outcomeBand = bandAiUsage({
      copied: !!t?.copied,
      locallyApproved: !!t?.ack,
      ignored: !!t?.ignored,
      viewed,
      hasAnyTelemetry: hasAny,
    });

    const row: AiExecutionUsageOutcome = {
      suggestionId: id,
      createdAt: (t?.lastAt ?? until).toISOString(),
      viewed,
      copied: !!t?.copied,
      locallyApproved: !!t?.ack,
      ignored: !!t?.ignored,
      outcomeBand,
      explanation: "",
    };
    row.explanation = explainAi(row);
    results.push(row);
  }

  const telemetryEventCount = rows.length;
  const sparseTelemetry = telemetryEventCount < AI_TELEMETRY_SPARSE_THRESHOLD;

  return { results, telemetryEventCount, sparseTelemetry, suggestions, governanceFreeze };
}
