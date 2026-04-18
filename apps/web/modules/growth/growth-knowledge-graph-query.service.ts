/**
 * In-memory graph queries — bounded, no external store.
 */

import type { GrowthKnowledgeEdge, GrowthKnowledgeGraph, GrowthKnowledgeNode } from "./growth-knowledge-graph.types";

const MAX_NEIGHBORS = 12;
const MAX_CLUSTER = 8;

export function findKnowledgeNeighbors(nodeId: string, graph: GrowthKnowledgeGraph): GrowthKnowledgeNode[] {
  const ids = new Set<string>();
  for (const e of graph.edges) {
    if (e.fromId === nodeId) ids.add(e.toId);
    if (e.toId === nodeId) ids.add(e.fromId);
  }
  const out: GrowthKnowledgeNode[] = [];
  for (const id of ids) {
    const n = graph.nodes.find((x) => x.id === id);
    if (n) out.push(n);
    if (out.length >= MAX_NEIGHBORS) break;
  }
  return out;
}

export function findRecurringBlockerCluster(graph: GrowthKnowledgeGraph): GrowthKnowledgeNode[] {
  return graph.nodes.filter((n) => n.type === "blocker").slice(0, MAX_CLUSTER);
}

export function findWinningPatternCluster(graph: GrowthKnowledgeGraph): GrowthKnowledgeNode[] {
  return graph.nodes.filter((n) => n.type === "winning_pattern").slice(0, MAX_CLUSTER);
}

export function findConflictingDecisionPairs(graph: GrowthKnowledgeGraph): { a: GrowthKnowledgeNode; b: GrowthKnowledgeNode; edge: GrowthKnowledgeEdge }[] {
  const out: { a: GrowthKnowledgeNode; b: GrowthKnowledgeNode; edge: GrowthKnowledgeEdge }[] = [];
  for (const e of graph.edges) {
    if (e.type !== "conflicts_with") continue;
    const from = graph.nodes.find((n) => n.id === e.fromId);
    const to = graph.nodes.find((n) => n.id === e.toId);
    if (from && to) out.push({ a: from, b: to, edge: e });
    if (out.length >= MAX_CLUSTER) break;
  }
  return out;
}
