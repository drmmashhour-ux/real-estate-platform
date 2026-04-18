/**
 * Daily operating checklist — read-only composition; max 5 items.
 */

import type { GrowthAgentCoordinationResult } from "./growth-agents.types";
import type { GrowthDailyBrief } from "./growth-daily-brief.types";
import type { GrowthExecutiveSummary } from "./growth-executive.types";
import type { GrowthGovernanceDecision } from "./growth-governance.types";
import type { GrowthLearningControlDecision } from "./growth-governance-learning.types";
import { deriveGrowthCadenceStatus } from "./growth-cadence-status.util";
import type { GrowthCadenceStatus, GrowthDailyCadence, GrowthDailyChecklistSource } from "./growth-cadence.types";

export type GrowthDailyCadenceInput = {
  dailyBrief: GrowthDailyBrief | null;
  executive: GrowthExecutiveSummary | null;
  coordination: GrowthAgentCoordinationResult | null;
  governance: GrowthGovernanceDecision | null;
  learningControl: GrowthLearningControlDecision | null;
  /** Response desk / CRM hints — optional. */
  responseDesk: { titles: string[]; itemCount: number; urgentCount: number } | null;
  /** Strategy bundle top priority when strategy layer produced it (string only — no duplicate logic). */
  strategyTopPriority?: string;
  missingDataWarnings: string[];
};

function slug(prefix: string, i: number): string {
  return `${prefix}-${i}`;
}

export function buildGrowthDailyCadence(input: GrowthDailyCadenceInput): GrowthDailyCadence {
  const createdAt = new Date().toISOString();
  const date = createdAt.slice(0, 10);

  const focus =
    input.dailyBrief?.today?.focus?.trim() ||
    input.executive?.topPriority?.trim() ||
    input.strategyTopPriority?.trim() ||
    undefined;

  const checklist: GrowthDailyCadence["checklist"] = [];
  const seen = new Set<string>();

  const push = (title: string, source: GrowthDailyChecklistSource, priority: "low" | "medium" | "high") => {
    const k = title.toLowerCase().slice(0, 120);
    if (seen.has(k) || checklist.length >= 5) return;
    seen.add(k);
    checklist.push({
      id: slug("cl", checklist.length),
      title,
      source,
      priority,
    });
  };

  if (input.executive?.leadSummary.hotLeads && input.executive.leadSummary.hotLeads > 0) {
    push("Follow up high-intent leads before scaling traffic", "executive", "high");
  }

  if (input.responseDesk && input.responseDesk.urgentCount > 0) {
    push("Clear response desk due / urgent items (drafts are internal-only)", "leads", "high");
  } else if (input.responseDesk && input.responseDesk.itemCount > 0) {
    push("Review messaging response desk queue", "leads", "medium");
  }

  const topExec = input.executive?.topPriorities?.[0]?.title;
  if (topExec) {
    push(topExec, "executive", "high");
  }

  if (input.coordination?.topPriorities?.[0]?.title) {
    push(`Agents: ${input.coordination.topPriorities[0].title}`, "agents", "medium");
  }

  for (const line of input.dailyBrief?.today?.priorities ?? []) {
    if (line?.trim()) push(line.trim(), "executive", "medium");
  }

  if (input.governance?.status === "caution" || input.governance?.status === "watch") {
    push("Review flagged governance items before expanding spend or copy tests", "governance", "high");
  }

  if (input.learningControl?.state === "freeze_recommended" || input.learningControl?.state === "reset_recommended") {
    push("Hold adaptive learning changes — review learning control panel", "governance", "high");
  }

  if (input.strategyTopPriority?.trim()) {
    push(input.strategyTopPriority.trim(), "strategy", "medium");
  }

  if (checklist.length < 2) {
    push("Review campaign / funnel dashboards for drift", "executive", "low");
  }

  const risks: string[] = [];
  for (const r of input.governance?.topRisks?.slice(0, 3) ?? []) {
    risks.push(`[${r.category}] ${r.title}`);
  }
  if (input.learningControl?.state === "freeze_recommended") {
    risks.push("Learning control recommends freeze — avoid weight adaptation until reviewed.");
  }
  if (input.executive?.campaignSummary.adsPerformance === "WEAK") {
    risks.push("Paid funnel band reads weak — fix conversion bottleneck before scaling acquisition.");
  }
  for (const b of input.dailyBrief?.blockers?.slice(0, 2) ?? []) {
    risks.push(b);
  }

  const notes: string[] = [];
  if (input.coordination?.notes?.length) {
    notes.push(...input.coordination.notes.slice(0, 2));
  }
  if (input.missingDataWarnings.length) {
    notes.push(`Partial data: ${input.missingDataWarnings.slice(0, 3).join("; ")}`);
  }

  const status: GrowthCadenceStatus = deriveGrowthCadenceStatus({
    executiveStatus: input.executive?.status ?? null,
    governance: input.governance,
    learningControl: input.learningControl,
  });

  return {
    date,
    status,
    focus,
    checklist: checklist.slice(0, 5),
    risks: risks.slice(0, 8),
    notes: notes.slice(0, 6),
    createdAt,
  };
}
