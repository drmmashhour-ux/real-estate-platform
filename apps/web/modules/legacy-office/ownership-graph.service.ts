/**
 * Ownership graph utilities — explicit parent/child links only.
 * No legal conclusions; optional fractions are user-reported placeholders.
 */

import type { LegacyOfficeEntity, LegacyOfficeState } from "./entity.types";

export type OwnershipGraphNode = LegacyOfficeEntity & {
  childIds: string[];
};

export type OwnershipGraph = {
  nodesById: Map<string, OwnershipGraphNode>;
  rootIds: string[];
};

function asNode(e: LegacyOfficeEntity, childIds: string[]): OwnershipGraphNode {
  return { ...e, childIds };
}

export function buildOwnershipGraph(state: LegacyOfficeState): OwnershipGraph {
  const childIdsByParent = new Map<string, string[]>();
  for (const e of state.entities) {
    const p = e.parentEntityId ?? null;
    if (!p) continue;
    if (!childIdsByParent.has(p)) childIdsByParent.set(p, []);
    childIdsByParent.get(p)!.push(e.id);
  }

  const nodesById = new Map<string, OwnershipGraphNode>();
  for (const e of state.entities) {
    nodesById.set(e.id, asNode(e, childIdsByParent.get(e.id) ?? []));
  }

  const rootIds = state.entities.filter((e) => !e.parentEntityId).map((e) => e.id);
  return { nodesById, rootIds };
}

export function getChildren(graph: OwnershipGraph, entityId: string): OwnershipGraphNode[] {
  const n = graph.nodesById.get(entityId);
  if (!n) return [];
  return n.childIds.map((id) => graph.nodesById.get(id)!).filter(Boolean);
}

/** Ancestors ordered immediate parent first, then up to the root. */
export function getParentChain(graph: OwnershipGraph, entityId: string): OwnershipGraphNode[] {
  const chain: OwnershipGraphNode[] = [];
  let cur = graph.nodesById.get(entityId);
  const seen = new Set<string>();
  while (cur?.parentEntityId) {
    if (seen.has(cur.id)) break;
    seen.add(cur.id);
    const parent = graph.nodesById.get(cur.parentEntityId);
    if (!parent) break;
    chain.push(parent);
    cur = parent;
  }
  return chain;
}

export type EffectiveOwnershipResult = {
  entityId: string;
  /**
   * Product of each node’s `informationalParentHeldFraction` walking from this entity up through parents.
   * `null` if any step lacks a valid fraction (0,1] or if a cycle is detected.
   */
  effectiveEconomicInterestFromRoot: number | null;
  rootId: string | null;
  ancestorChain: OwnershipGraphNode[];
};

export function computeEffectiveOwnership(graph: OwnershipGraph, entityId: string): EffectiveOwnershipResult {
  const ancestorChain = getParentChain(graph, entityId);
  const target = graph.nodesById.get(entityId);

  let rootId: string | null = null;
  if (ancestorChain.length > 0) {
    rootId = ancestorChain[ancestorChain.length - 1]!.id;
  } else if (target && !target.parentEntityId) {
    rootId = target.id;
  }

  if (!target) {
    return { entityId, effectiveEconomicInterestFromRoot: null, rootId: null, ancestorChain };
  }

  if (!target.parentEntityId) {
    return {
      entityId,
      effectiveEconomicInterestFromRoot: 1,
      rootId: target.id,
      ancestorChain: [],
    };
  }

  let product = 1;
  let cur: OwnershipGraphNode | undefined = target;
  const visited = new Set<string>();

  while (cur) {
    if (visited.has(cur.id)) {
      return { entityId, effectiveEconomicInterestFromRoot: null, rootId, ancestorChain };
    }
    visited.add(cur.id);

    if (!cur.parentEntityId) break;

    const f = cur.informationalParentHeldFraction;
    if (f == null || f <= 0 || f > 1) {
      return { entityId, effectiveEconomicInterestFromRoot: null, rootId, ancestorChain };
    }
    product *= f;
    cur = graph.nodesById.get(cur.parentEntityId);
  }

  return {
    entityId,
    effectiveEconomicInterestFromRoot: product,
    rootId,
    ancestorChain,
  };
}
