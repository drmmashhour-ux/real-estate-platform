import { describe, expect, it } from "vitest";
import {
  findConflictingDecisionPairs,
  findKnowledgeNeighbors,
  findRecurringBlockerCluster,
  findWinningPatternCluster,
} from "../growth-knowledge-graph-query.service";
import type { GrowthKnowledgeGraph } from "../growth-knowledge-graph.types";

describe("growth-knowledge-graph-query", () => {
  const tinyGraph = (): GrowthKnowledgeGraph => ({
    nodes: [
      {
        id: "a",
        type: "blocker",
        title: "B1",
        source: "memory",
        createdAt: "x",
      },
      {
        id: "b",
        type: "blocker",
        title: "B2",
        source: "memory",
        createdAt: "x",
      },
      {
        id: "c",
        type: "risk",
        title: "R1",
        source: "governance",
        createdAt: "x",
      },
    ],
    edges: [
      {
        id: "e1",
        fromId: "c",
        toId: "a",
        type: "conflicts_with",
        rationale: "test",
        createdAt: "x",
      },
    ],
    summary: {
      nodeCount: 3,
      edgeCount: 1,
      dominantThemes: [],
      recurringBlockers: ["B1"],
      repeatedWinners: [],
    },
    createdAt: "x",
  });

  it("findKnowledgeNeighbors returns adjacent nodes", () => {
    const g = tinyGraph();
    const n = findKnowledgeNeighbors("c", g);
    expect(n.some((x) => x.id === "a")).toBe(true);
  });

  it("findRecurringBlockerCluster lists blockers", () => {
    expect(findRecurringBlockerCluster(tinyGraph()).length).toBe(2);
  });

  it("findWinningPatternCluster is bounded", () => {
    expect(findWinningPatternCluster(tinyGraph()).length).toBe(0);
  });

  it("findConflictingDecisionPairs lists conflicts", () => {
    const pairs = findConflictingDecisionPairs(tinyGraph());
    expect(pairs.length).toBe(1);
  });
});
