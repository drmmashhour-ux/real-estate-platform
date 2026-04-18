/**
 * Deterministic prioritization for fused growth actions — no side effects.
 */

import type { GrowthFusionAction, GrowthFusionSource, GrowthFusionSummary } from "./growth-fusion.types";
import { applyLearningToFusionPriorityScore } from "./growth-learning-integration.service";

const SOURCE_WEIGHT: Record<GrowthFusionSource, number> = {
  leads: 1.08,
  ads: 1.14,
  cro: 1.18,
  content: 0.94,
  autopilot: 1.06,
};

function impactPoints(impact: GrowthFusionAction["impact"]): number {
  if (impact === "high") return 34;
  if (impact === "medium") return 23;
  return 12;
}

/** 0–100 — combines impact, confidence, source weight, signal priority, revenue sensitivity. */
export function computeFusionActionPriorityScore(input: {
  impact: GrowthFusionAction["impact"];
  confidence: number;
  source: GrowthFusionSource;
  signalPriorityScore?: number;
  /** When true, issue blocks monetization path (conversion / capture). */
  revenueBlocking?: boolean;
}): number {
  const sw = SOURCE_WEIGHT[input.source] ?? 1;
  const base = impactPoints(input.impact) + Math.min(1, Math.max(0, input.confidence)) * 36 + (sw - 1) * 14;
  const tail = input.signalPriorityScore != null ? Math.min(18, input.signalPriorityScore * 0.16) : 0;
  const rev = input.revenueBlocking ? 8 : 0;
  const raw = Math.min(100, Math.max(0, Math.round(base + tail + rev)));
  return applyLearningToFusionPriorityScore(raw, input.source);
}

function shortHash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36).slice(0, 10);
}

function deriveWhy(
  source: GrowthFusionSource,
  impact: GrowthFusionAction["impact"],
  title: string,
  summary: GrowthFusionSummary,
): string {
  if (summary.topProblems.some((p) => p.toLowerCase().includes("conversion"))) {
    if (source === "cro" || source === "ads") {
      return "Conversion path is constrained — address before scaling traffic.";
    }
  }
  if (source === "ads" && impact === "high") {
    return "Paid surface shows strain vs outcomes — review offer and landing alignment.";
  }
  if (source === "leads") {
    return "Pipeline timing risk — refresh capture and follow-up discipline.";
  }
  if (source === "content") {
    return "Messaging coverage gap — drafts reduce time-to-ship for campaigns.";
  }
  if (source === "autopilot") {
    return "Aligned with existing autopilot queue — operator review still required.";
  }
  return `Fused priority from ${source}: ${title.slice(0, 80)}`;
}

function isRevenueBlocking(source: GrowthFusionSource, type: string): boolean {
  if (source === "cro" && (type === "funnel" || type === "health")) return true;
  if (source === "ads" && type === "efficiency") return true;
  return false;
}

function executionModeFor(
  source: GrowthFusionSource,
  type: string,
): GrowthFusionAction["executionMode"] {
  if (source === "content" || type === "velocity" || type === "coverage") return "manual_only";
  return "approval_required";
}

/**
 * Maps analyzer output into a bounded, sorted action list (top 5–8).
 */
export function prioritizeGrowthFusionActions(summary: GrowthFusionSummary): GrowthFusionAction[] {
  const candidates: GrowthFusionAction[] = [];
  const seenIds = new Set<string>();

  const sortedSignals = [...summary.signals].sort(
    (a, b) => (b.priorityScore ?? 0) - (a.priorityScore ?? 0),
  );

  for (const s of sortedSignals) {
    const id = `gf-${s.id.replace(/[^a-z0-9_-]/gi, "-").slice(0, 64)}`;
    if (seenIds.has(id)) continue;
    seenIds.add(id);
    const revenueBlocking = isRevenueBlocking(s.source, s.type);
    const priorityScore = computeFusionActionPriorityScore({
      impact: s.impact,
      confidence: s.confidence,
      source: s.source,
      signalPriorityScore: s.priorityScore,
      revenueBlocking,
    });
    candidates.push({
      id,
      title: s.title,
      description: s.description,
      source: s.source,
      impact: s.impact,
      confidence: s.confidence,
      priorityScore,
      why: deriveWhy(s.source, s.impact, s.title, summary),
      executionMode: executionModeFor(s.source, s.type),
      status: "suggested",
    });
  }

  for (const line of summary.topActions) {
    const id = `gf-summary-${shortHash(line)}`;
    if (seenIds.has(id)) continue;
    seenIds.add(id);
    candidates.push({
      id,
      title: line,
      description: "Synthesized from cross-source fusion summary (advisory).",
      source: "cro",
      impact: "medium",
      confidence: summary.confidence,
      priorityScore: computeFusionActionPriorityScore({
        impact: "medium",
        confidence: summary.confidence,
        source: "cro",
        revenueBlocking: line.toLowerCase().includes("cta") || line.toLowerCase().includes("conversion"),
      }),
      why: "Cross-cutting recommendation from fused top-actions list.",
      executionMode: "approval_required",
      status: "suggested",
    });
  }

  for (const p of summary.topProblems.slice(0, 2)) {
    const id = `gf-prob-${shortHash(p)}`;
    if (seenIds.has(id)) continue;
    seenIds.add(id);
    candidates.push({
      id,
      title: p,
      description: "Detected problem theme from fused analysis.",
      source: "leads",
      impact: "high",
      confidence: Math.min(0.85, summary.confidence + 0.05),
      priorityScore: computeFusionActionPriorityScore({
        impact: "high",
        confidence: summary.confidence,
        source: "leads",
        revenueBlocking: true,
      }),
      why: "Problem theme elevated — verify in CRM and funnel telemetry before spend changes.",
      executionMode: "approval_required",
      status: "suggested",
    });
  }

  return [...candidates].sort((a, b) => b.priorityScore - a.priorityScore).slice(0, 8);
}
