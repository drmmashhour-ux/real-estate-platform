/**
 * Growth Mission Control — focus resolution (advisory only).
 */

import type { GrowthMissionControlFocus } from "./growth-mission-control.types";
import type { GrowthExecutiveSummary } from "./growth-executive.types";
import type { GrowthDailyBrief } from "./growth-daily-brief.types";
import type { GrowthGovernanceDecision } from "./growth-governance.types";
import type { GrowthSimulationBundle } from "./growth-simulation.types";
import type { GrowthFusionAction, GrowthFusionSummary } from "./growth-fusion.types";
import type { GrowthStrategyBundle } from "./growth-strategy.types";
import type { GrowthAgentCoordinationResult } from "./growth-agents.types";

export type GrowthMissionFocusInput = {
  executive: GrowthExecutiveSummary | null;
  dailyBrief: GrowthDailyBrief | null;
  governance: GrowthGovernanceDecision | null;
  fusion: { summary: GrowthFusionSummary; actions: GrowthFusionAction[] } | null;
  strategyBundle: GrowthStrategyBundle | null;
  coordination: GrowthAgentCoordinationResult | null;
  simulationBundle: GrowthSimulationBundle | null;
  autopilotFocusTitle: string | null;
  memoryFocusHint?: string | null;
  graphFocusHint?: string | null;
  journalFocusHint?: string | null;
};

function normTitle(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

/** Avoid vague one-liners that add noise as mission headline. */
function isVagueMissionTitle(title: string): boolean {
  const t = title.trim();
  if (t.length < 8) return true;
  const n = normTitle(t);
  if (n.length < 8) return true;
  if (/^(review|check|monitor|watch|tbd|todo|pending|general|growth|status|update)\b/.test(n)) {
    if (t.length < 24) return true;
  }
  return false;
}

function pickFusionFocusTitle(input: GrowthMissionFocusInput): GrowthMissionControlFocus | null {
  const actions = input.fusion?.actions ?? [];
  const summary = input.fusion?.summary;
  const top = actions[0];
  const title = top?.title?.trim() ?? summary?.topActions?.[0]?.trim();
  if (!title || isVagueMissionTitle(title)) return null;
  const why =
    top?.why?.trim() ||
    (summary?.topProblems?.[0] ? `Tied to fusion analysis: ${summary.topProblems[0].slice(0, 100)}` : "") ||
    "Highest-confidence fusion recommendation.";
  return { title, source: "fusion", why: why.slice(0, 220) };
}

function executiveTopTitle(input: GrowthMissionFocusInput): string | undefined {
  const t = input.executive?.topPriority?.trim() || input.executive?.topPriorities?.[0]?.title?.trim();
  return t || undefined;
}

function weakOperationalSources(input: GrowthMissionFocusInput): boolean {
  const hasExec = Boolean(executiveTopTitle(input));
  const hasBrief = Boolean(input.dailyBrief?.today?.focus?.trim());
  const hasFusion = Boolean(pickFusionFocusTitle(input));
  const g = input.governance;
  const hasGov = Boolean(
    g &&
      (g.status === "human_review_required" ||
        g.status === "freeze_recommended" ||
        (g.frozenDomains?.length ?? 0) > 0 ||
        (g.humanReviewQueue?.length ?? 0) > 0),
  );
  return !hasExec && !hasBrief && !hasFusion && !hasGov;
}

function firstSimulationTitle(bundle: GrowthSimulationBundle | null | undefined): string | undefined {
  const t = bundle?.scenarios?.[0]?.title?.trim();
  return t || undefined;
}

/**
 * Priority: governance → fusion (if actionable, not duplicate of executive) → executive → daily brief →
 * agents (high-impact human review) → autopilot → simulation → strategy → memory/graph/journal hints when weak → default.
 */
export function resolveGrowthMissionFocus(input: GrowthMissionFocusInput): GrowthMissionControlFocus {
  const gov = input.governance;
  if (gov?.status === "human_review_required") {
    const why =
      gov.humanReviewItems[0]?.trim() ||
      gov.topRisks[0]?.reason?.trim() ||
      gov.notes[0]?.trim() ||
      "Human review is required before scaling or promoting automated moves.";
    return {
      title: "Governance human review required",
      source: "governance",
      why: why.slice(0, 220),
    };
  }
  if ((gov?.frozenDomains?.length ?? 0) > 0 || gov?.status === "freeze_recommended") {
    const fd = gov?.frozenDomains?.length ? gov.frozenDomains.slice(0, 3).join(", ") : "multiple domains";
    return {
      title: `Freeze active (${fd})`,
      source: "governance",
      why: "Domains are frozen; treat outbound and spend as blocked until governance clears.",
    };
  }

  const fusionPick = pickFusionFocusTitle(input);
  const execTitle = executiveTopTitle(input);
  const duplicateFusionExec =
    fusionPick && execTitle && normTitle(fusionPick.title) === normTitle(execTitle);

  if (fusionPick && !duplicateFusionExec) {
    return fusionPick;
  }

  if (execTitle && !isVagueMissionTitle(execTitle)) {
    return {
      title: execTitle,
      source: "executive",
      why:
        input.executive?.topPriorities?.[0]?.why?.trim()?.slice(0, 220) ||
        "Executive top priority for today.",
    };
  }

  const brief = input.dailyBrief?.today?.focus?.trim();
  if (brief && !isVagueMissionTitle(brief)) {
    return {
      title: brief,
      source: "daily_brief",
      why: "Aligned with the daily brief focus.",
    };
  }

  const urgentAgent = input.coordination?.proposals?.find(
    (p) => p.requiresHumanReview && p.impact === "high" && p.title?.trim(),
  );
  if (urgentAgent?.title?.trim()) {
    return {
      title: urgentAgent.title.trim(),
      source: "agents",
      why: "High-impact coordination proposal requires human review.",
    };
  }

  const auto = input.autopilotFocusTitle?.trim();
  if (auto && !isVagueMissionTitle(auto)) {
    return { title: auto, source: "autopilot", why: "Autopilot surfaced this as the current focus." };
  }

  const simRec = firstSimulationTitle(input.simulationBundle);
  if (simRec && !isVagueMissionTitle(simRec)) {
    return {
      title: simRec,
      source: "simulation",
      why: "Top scenario from the latest growth simulation bundle (advisory estimate).",
    };
  }

  const strat = input.strategyBundle?.weeklyPlan?.priorities?.[0]?.title?.trim();
  if (strat && !isVagueMissionTitle(strat)) {
    const p0 = input.strategyBundle?.weeklyPlan?.priorities?.[0];
    return {
      title: strat,
      source: "strategy",
      why: p0?.why?.trim()?.slice(0, 220) || "Top strategy priority.",
    };
  }

  if (weakOperationalSources(input)) {
    const mem = input.memoryFocusHint?.trim();
    if (mem && !isVagueMissionTitle(mem)) {
      return { title: mem, source: "memory", why: "Memory layer highlight while operational signals are thin." };
    }
    const graph = input.graphFocusHint?.trim();
    if (graph && !isVagueMissionTitle(graph)) {
      return { title: graph, source: "graph", why: "Knowledge graph insight while operational signals are thin." };
    }
    const journal = input.journalFocusHint?.trim();
    if (journal && !isVagueMissionTitle(journal)) {
      return { title: journal, source: "journal", why: "Decision journal note while operational signals are thin." };
    }
  }

  if (fusionPick) {
    return fusionPick;
  }
  if (execTitle) {
    return {
      title: execTitle,
      source: "executive",
      why:
        input.executive?.topPriorities?.[0]?.why?.trim()?.slice(0, 220) ||
        "Executive top priority for today.",
    };
  }
  if (brief) {
    return { title: brief, source: "daily_brief", why: "Aligned with the daily brief focus." };
  }

  return {
    title: "Stabilize growth telemetry",
    source: "governance",
    why: "Mission Control needs stronger upstream signals; review instrumentation and governance.",
  };
}
