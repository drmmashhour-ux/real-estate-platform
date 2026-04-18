/**
 * Deterministic knowledge nodes from read-only growth inputs — no side effects.
 */

import type { GrowthMemoryEntry } from "./growth-memory.types";
import type {
  GrowthKnowledgeGraphBuildInput,
  GrowthKnowledgeNode,
  GrowthKnowledgeNodeSource,
  GrowthKnowledgeNodeType,
} from "./growth-knowledge-graph.types";

const MAX_NODES = 36;

function stableNodeId(type: string, title: string): string {
  let h = 0;
  const key = `${type}:${title.slice(0, 120)}`;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
  return `kgn-${type}-${Math.abs(h).toString(36)}`;
}

function now(): string {
  return new Date().toISOString();
}

function pushNode(
  out: GrowthKnowledgeNode[],
  type: GrowthKnowledgeNodeType,
  title: string,
  source: GrowthKnowledgeNodeSource,
  opts?: { detail?: string; confidence?: number; tags?: string[] },
): void {
  if (out.length >= MAX_NODES) return;
  const t = title.trim().slice(0, 200);
  if (!t) return;
  const id = stableNodeId(type, t);
  if (out.some((n) => n.id === id)) return;
  out.push({
    id,
    type,
    title: t,
    detail: opts?.detail?.slice(0, 400),
    source,
    confidence: opts?.confidence,
    tags: opts?.tags,
    createdAt: now(),
  });
}

function memoryEntryToNodeType(e: GrowthMemoryEntry): GrowthKnowledgeNodeType | null {
  switch (e.category) {
    case "blocker":
      return "blocker";
    case "winning_pattern":
      return "winning_pattern";
    case "campaign_lesson":
    case "followup_lesson":
    case "governance_lesson":
      return "lesson";
    case "operator_preference":
      return "operator_decision";
    default:
      return null;
  }
}

/**
 * Builds bounded, deduplicated nodes from memory, executive, governance, strategy, simulation, autopilot, campaign.
 */
export function buildGrowthKnowledgeNodes(input: GrowthKnowledgeGraphBuildInput): GrowthKnowledgeNode[] {
  const out: GrowthKnowledgeNode[] = [];

  const mem = input.memory;
  if (mem) {
    const pools: GrowthMemoryEntry[][] = [
      mem.recurringBlockers,
      mem.winningPatterns,
      mem.campaignLessons,
      mem.followupLessons,
      mem.governanceLessons,
      mem.operatorPreferences,
    ];
    for (const pool of pools) {
      for (const e of pool.slice(0, 6)) {
        const nt = memoryEntryToNodeType(e);
        if (!nt) continue;
        pushNode(out, nt, e.title, "memory", {
          detail: e.detail,
          confidence: e.confidence,
          tags: e.tags,
        });
        if (out.length >= MAX_NODES) break;
      }
      if (out.length >= MAX_NODES) break;
    }
  }

  const exec = input.executive;
  if (exec) {
    for (const p of exec.topPriorities.slice(0, 5)) {
      pushNode(out, "priority", p.title, "executive", {
        detail: p.why.slice(0, 280),
        confidence: p.confidence,
        tags: [p.source, p.impact],
      });
    }
    for (const r of exec.topRisks.slice(0, 4)) {
      if (!r?.trim()) continue;
      pushNode(out, "risk", r.trim().slice(0, 160), "executive", { tags: ["executive_risk"] });
    }
    if (exec.campaignSummary.topCampaign) {
      pushNode(out, "campaign", `Campaign: ${exec.campaignSummary.topCampaign}`, "executive", {
        tags: ["utm", "attribution"],
        confidence: 0.45,
      });
    }
  }

  const gov = input.governance;
  if (gov) {
    for (const r of gov.topRisks.slice(0, 4)) {
      pushNode(out, "risk", r.title, "governance", {
        detail: r.description ?? r.reason,
        confidence: r.severity === "high" ? 0.75 : 0.55,
        tags: [r.category, r.severity],
      });
    }
  }

  const strat = input.strategyBundle;
  if (strat) {
    for (const p of strat.weeklyPlan.priorities.slice(0, 5)) {
      pushNode(out, "priority", p.title, "strategy", {
        detail: p.why.slice(0, 280),
        confidence: p.confidence,
        tags: [p.theme],
      });
    }
    for (const b of strat.weeklyPlan.blockers.slice(0, 4)) {
      if (!b?.trim()) continue;
      pushNode(out, "blocker", b.trim().slice(0, 160), "strategy", { tags: ["strategy_blocker"] });
    }
    for (const x of strat.weeklyPlan.experiments.slice(0, 2)) {
      pushNode(out, "recommendation", `Experiment: ${x.title}`, "strategy", {
        detail: x.hypothesis.slice(0, 200),
        tags: ["experiment"],
      });
    }
  }

  const sim = input.simulationBundle;
  if (sim?.scenarios?.length) {
    for (const s of sim.scenarios.slice(0, 4)) {
      const kind: GrowthKnowledgeNodeType =
        s.recommendation === "consider" ? "outcome" : "recommendation";
      pushNode(out, kind, s.title, "simulation", {
        detail: s.downsideSummary.slice(0, 200),
        confidence: s.confidence === "high" ? 0.55 : 0.4,
        tags: [s.recommendation, "simulation"],
      });
    }
  }

  for (const t of input.autopilotActionTitles.slice(0, 5)) {
    if (!t?.trim()) continue;
    pushNode(out, "recommendation", t.trim(), "autopilot", { tags: ["autopilot"] });
  }

  if (input.topCampaignLabel?.trim()) {
    const label = input.topCampaignLabel.trim();
    const title = label.startsWith("Campaign:") ? label : `Campaign: ${label}`;
    pushNode(out, "campaign", title.slice(0, 200), "executive", {
      tags: ["early_conversion"],
      confidence: 0.42,
    });
  }

  if (input.adsBand === "WEAK") {
    pushNode(out, "lesson", "Weak conversion band — stabilize before scaling spend", "executive", {
      tags: ["cro", "ads_band"],
      confidence: 0.5,
    });
  }

  return out;
}
