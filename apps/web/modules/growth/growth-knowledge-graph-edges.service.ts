/**
 * Deterministic edges between knowledge nodes — explicit rationales only.
 */

import type { GrowthKnowledgeEdgeType, GrowthKnowledgeGraphBuildInput, GrowthKnowledgeNode } from "./growth-knowledge-graph.types";

const MAX_EDGES = 48;

function stableEdgeId(from: string, to: string, t: string): string {
  let h = 0;
  const key = `${from}|${to}|${t}`;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
  return `kge-${Math.abs(h).toString(36)}`;
}

function now(): string {
  return new Date().toISOString();
}

function norm(s: string): string {
  return s.trim().toLowerCase();
}

function hasWord(hay: string, w: string): boolean {
  return norm(hay).includes(norm(w));
}

function byType(nodes: GrowthKnowledgeNode[], type: GrowthKnowledgeNode["type"]): GrowthKnowledgeNode[] {
  return nodes.filter((n) => n.type === type);
}

/**
 * Links nodes using bounded, explainable rules (overlap + domain heuristics).
 */
export function buildGrowthKnowledgeEdges(
  nodes: GrowthKnowledgeNode[],
  input: GrowthKnowledgeGraphBuildInput,
): GrowthKnowledgeEdge[] {
  const edges: GrowthKnowledgeEdge[] = [];
  const seen = new Set<string>();

  const add = (fromId: string, toId: string, type: GrowthKnowledgeEdgeType, rationale: string, conf?: number) => {
    if (fromId === toId) return;
    if (edges.length >= MAX_EDGES) return;
    const k = `${fromId}->${toId}:${type}`;
    if (seen.has(k)) return;
    seen.add(k);
    edges.push({
      id: stableEdgeId(fromId, toId, type),
      fromId,
      toId,
      type,
      confidence: conf,
      rationale: rationale.slice(0, 280),
      createdAt: now(),
    });
  };

  const campaigns = byType(nodes, "campaign");
  const blockers = byType(nodes, "blocker");
  const wins = byType(nodes, "winning_pattern");
  const lessons = byType(nodes, "lesson");
  const ops = byType(nodes, "operator_decision");
  const recs = byType(nodes, "recommendation");
  const outcomes = byType(nodes, "outcome");
  const prios = byType(nodes, "priority");
  const risks = byType(nodes, "risk");

  const deferNodes = nodes.filter((n) => n.tags?.includes("defer"));

  // Weak conversion lesson blocks scaling toward campaign nodes
  const convLesson = lessons.find(
    (n) => hasWord(n.title, "conversion") || hasWord(n.title, "scaling") || hasWord(n.title, "weak"),
  );
  for (const c of campaigns.slice(0, 2)) {
    if (convLesson) {
      add(convLesson.id, c.id, "blocks", "Conversion or band lesson advises stabilizing before leaning on campaign scale (advisory).", 0.42);
    }
  }

  // Winning pattern reinforces or supports top campaign
  if (wins[0] && campaigns[0]) {
    const w = wins[0];
    const c = campaigns[0];
    const cSlug = norm(c.title).replace(/^campaign:\s*/i, "").slice(0, 24);
    if (cSlug.length > 2 && norm(w.title).includes(cSlug)) {
      add(w.id, c.id, "reinforces", "Winning pattern aligns with attributed campaign node (advisory).", 0.38);
    } else {
      add(w.id, c.id, "supports", "Winning pattern supports sustained campaign performance theme (advisory).", 0.35);
    }
  }

  // First strategy blocker relates to first strategy priority
  const sBlock = blockers.find((n) => n.source === "strategy");
  const sPri = prios.find((n) => n.source === "strategy");
  if (sBlock && sPri) {
    add(sBlock.id, sPri.id, "relates_to", "Weekly blocker text co-occurs with a stated strategy priority (advisory link).", 0.4);
  }

  // Executive risk relates to first blocker (memory or exec)
  const r0 = risks[0];
  const b0 = blockers[0];
  if (r0 && b0 && (norm(r0.title).slice(0, 12) === norm(b0.title).slice(0, 12) || norm(r0.title).includes("follow"))) {
    add(r0.id, b0.id, "relates_to", "Risk line and blocker theme overlap on follow-up or funnel (advisory).", 0.37);
  }

  // Operator decision → follow-up priority
  const op0 = ops[0];
  const followPri = prios.find((n) => hasWord(n.title, "follow") || hasWord(n.title, "response"));
  if (op0 && followPri) {
    add(op0.id, followPri.id, "preferred_by_operator", "Operator preference signal aligns with a follow-up oriented priority (advisory).", 0.36);
  }

  // Governance risk conflicts with acquisition-heavy simulation or priority
  const gRisk = risks.find((n) => n.source === "governance");
  const acqP = prios.find((n) => hasWord(n.title, "acquisition") || hasWord(n.title, "scale") || hasWord(n.title, "traffic"));
  if (gRisk && acqP) {
    add(gRisk.id, acqP.id, "conflicts_with", "Governance risk may conflict with aggressive acquisition or scale narratives (advisory).", 0.44);
  }

  // Defer simulation vs acquisition-style recommendation
  const deferNode = deferNodes[0];
  const acqRec = recs.find((n) => hasWord(n.title, "acquisition") || hasWord(n.title, "traffic"));
  if (deferNode && acqRec && deferNode.id !== acqRec.id) {
    add(deferNode.id, acqRec.id, "conflicts_with", "Simulation deferral caution overlaps acquisition-style recommendation (advisory).", 0.4);
  }

  // Autopilot recommendation supports outcome-style simulation when titles share token
  const apRec = recs.find((n) => n.source === "autopilot");
  const out0 = outcomes[0];
  if (apRec && out0) {
    add(apRec.id, out0.id, "relates_to", "Autopilot recommendation sits in same advisory layer as simulation outcome (advisory).", 0.33);
  }

  // Blocker causes risk theme (weak data)
  if (input.missingDataWarnings.length >= 2 && r0) {
    const partial = lessons.find((n) => hasWord(n.title, "partial") || hasWord(n.title, "data"));
    if (partial) {
      add(partial.id, r0.id, "causes", "Partial data warnings increase uncertainty on downstream risk reads (advisory).", 0.32);
    }
  }

  return edges;
}
