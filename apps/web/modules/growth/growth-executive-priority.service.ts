/**
 * Normalizes cross-module signals into a single ordered priority list (max 5).
 */

import type { GrowthExecutivePriority, GrowthExecutivePriorityInput } from "./growth-executive.types";
import { applyLearningToExecutivePriorityScore } from "./growth-learning-integration.service";

type Cand = GrowthExecutivePriority & { _rank: number };

function rankGovernance(input: GrowthExecutivePriorityInput): Cand[] {
  const out: Cand[] = [];
  const g = input.governanceDecision;
  if (!g) return out;

  if (g.status === "human_review_required") {
    const line =
      g.humanReviewItems[0] ??
      g.humanReviewQueue?.[0]?.title ??
      "Human review required — check governance panel.";
    out.push({
      id: "ex-gov-hr",
      title: "Human review required (governance)",
      source: "governance",
      impact: "high",
      confidence: 0.85,
      priorityScore: 98,
      why: line,
      _rank: 1000,
    });
  } else if (g.status === "freeze_recommended") {
    out.push({
      id: "ex-gov-freeze",
      title: "Freeze recommended for scaling narratives",
      source: "governance",
      impact: "high",
      confidence: 0.78,
      priorityScore: 92,
      why: "Governance suggests pausing advisory scale until telemetry and risks are cleared.",
      _rank: 980,
    });
  }

  for (const r of g.topRisks.slice(0, 2)) {
    const rank = r.severity === "high" ? 920 : r.severity === "medium" ? 860 : 800;
    out.push({
      id: `ex-gov-risk-${r.id}`,
      title: r.title,
      source: "governance",
      impact: r.severity === "high" ? "high" : r.severity === "medium" ? "medium" : "low",
      confidence: 0.72,
      priorityScore: Math.min(95, 70 + rank / 20),
      why: r.reason,
      _rank: rank,
    });
  }

  return out;
}

function rankAutopilot(input: GrowthExecutivePriorityInput): Cand[] {
  const acts = [...input.autopilotActions].sort((a, b) => b.priorityScore - a.priorityScore);
  const out: Cand[] = [];
  for (const a of acts.slice(0, 3)) {
    const high = a.impact === "high";
    out.push({
      id: `ex-ap-${a.id}`,
      title: a.title,
      source: "autopilot",
      impact: a.impact,
      confidence: a.confidence,
      priorityScore: a.priorityScore,
      why: a.why ?? "Autopilot suggestion — review and approve per policy.",
      _rank: high ? 750 + a.priorityScore / 5 : 650 + a.priorityScore / 8,
    });
  }
  return out;
}

function rankFusion(input: GrowthExecutivePriorityInput): Cand[] {
  const out: Cand[] = [];
  for (const a of input.fusionActions.slice(0, 3)) {
    const src =
      a.source === "cro"
        ? ("cro" as const)
        : a.source === "ads"
          ? ("ads" as const)
          : a.source === "leads"
            ? ("leads" as const)
            : a.source === "content"
              ? ("fusion" as const)
              : ("fusion" as const);
    out.push({
      id: `ex-fus-${a.id}`,
      title: a.title,
      source: src,
      impact: a.impact,
      confidence: a.confidence,
      priorityScore: a.priorityScore,
      why: a.why,
      _rank: 700 + (a.priorityScore ?? 50) / 4,
    });
  }
  for (const p of input.fusionTopProblems.slice(0, 1)) {
    out.push({
      id: `ex-fus-prob-${p.slice(0, 12)}`,
      title: p.slice(0, 120),
      source: "fusion",
      impact: "medium",
      confidence: 0.55,
      priorityScore: 62,
      why: "Cross-source fusion flagged this theme — validate in CRM and funnel data.",
      _rank: 640,
    });
  }
  return out;
}

function rankAds(input: GrowthExecutivePriorityInput): Cand[] {
  const out: Cand[] = [];
  for (let i = 0; i < Math.min(2, input.adsProblemLines.length); i++) {
    const line = input.adsProblemLines[i]!;
    out.push({
      id: `ex-ads-${i}`,
      title: `Campaign / funnel: ${line.slice(0, 80)}`,
      source: "ads",
      impact: "medium",
      confidence: 0.58,
      priorityScore: 58,
      why: "UTM early-conversion insights suggest manual review before scaling spend.",
      _rank: 600 + (input.adsProblemLines.length - i) * 5,
    });
  }
  return out;
}

function rankLeads(input: GrowthExecutivePriorityInput): Cand[] {
  const out: Cand[] = [];
  if (input.dueNowCount > 0) {
    out.push({
      id: "ex-lead-due",
      title: `Follow-up: ${input.dueNowCount} lead(s) due now`,
      source: "leads",
      impact: input.dueNowCount >= 6 ? "high" : "medium",
      confidence: 0.65,
      priorityScore: 72,
      why: "Internal follow-up queue shows due items — broker attention first.",
      _rank: 780 + Math.min(20, input.dueNowCount),
    });
  }
  if (input.hotLeadCount >= 8) {
    out.push({
      id: "ex-lead-hotpile",
      title: "High volume of hot / high-score leads",
      source: "leads",
      impact: "high",
      confidence: 0.6,
      priorityScore: 68,
      why: "Prioritize outreach capacity and routing before adding acquisition noise.",
      _rank: 760,
    });
  } else if (input.hotLeadCount >= 1 && input.leadsToday === 0) {
    out.push({
      id: "ex-lead-warmgap",
      title: "Hot leads exist but no early-conversion leads today",
      source: "leads",
      impact: "low",
      confidence: 0.45,
      priorityScore: 45,
      why: "Reconcile CRM tiers with landing funnel timing — advisory only.",
      _rank: 500,
    });
  }
  return out;
}

/**
 * Merges candidates, sorts by internal rank + priorityScore, returns max 5 priorities.
 */
export function buildGrowthExecutivePriorities(input: GrowthExecutivePriorityInput): GrowthExecutivePriority[] {
  const all: Cand[] = [
    ...rankGovernance(input),
    ...rankAutopilot(input),
    ...rankFusion(input),
    ...rankAds(input),
    ...rankLeads(input),
  ];

  for (const c of all) {
    const adj = applyLearningToExecutivePriorityScore(c.priorityScore, c.source);
    if (adj !== undefined) c.priorityScore = adj;
  }

  all.sort((a, b) => {
    const pa = a.priorityScore ?? 0;
    const pb = b.priorityScore ?? 0;
    if (pb !== pa) return pb - pa;
    return b._rank - a._rank;
  });

  const seen = new Set<string>();
  const out: GrowthExecutivePriority[] = [];
  for (const c of all) {
    const key = `${c.source}-${c.title.slice(0, 48)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const { _rank: _r, ...rest } = c;
    void _r;
    out.push(rest);
    if (out.length >= 5) break;
  }
  return out;
}
