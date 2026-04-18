import { describe, expect, it, vi, afterEach } from "vitest";
import { assembleGrowthKnowledgeGraph } from "../growth-knowledge-graph.service";
import type { GrowthKnowledgeGraphBuildInput } from "../growth-knowledge-graph.types";

describe("assembleGrowthKnowledgeGraph", () => {
  it("builds summary counts", () => {
    const input: GrowthKnowledgeGraphBuildInput = {
      memory: {
        recurringBlockers: [
          {
            id: "b1",
            category: "blocker",
            title: "Backlog",
            detail: "",
            source: "executive",
            confidence: 0.5,
            createdAt: "x",
          },
        ],
        winningPatterns: [
          {
            id: "w1",
            category: "winning_pattern",
            title: "Top UTM wins",
            detail: "",
            source: "executive",
            confidence: 0.4,
            createdAt: "x",
          },
        ],
        campaignLessons: [],
        followupLessons: [],
        governanceLessons: [],
        operatorPreferences: [],
        notes: [],
        createdAt: "x",
      },
      executive: null,
      governance: null,
      strategyBundle: null,
      simulationBundle: null,
      autopilotActionTitles: [],
      adsBand: "WEAK",
      missingDataWarnings: [],
    };
    const g = assembleGrowthKnowledgeGraph(input);
    expect(g.summary.nodeCount).toBe(g.nodes.length);
    expect(g.summary.edgeCount).toBe(g.edges.length);
    expect(g.summary.recurringBlockers.length).toBeGreaterThan(0);
  });
});

describe("buildGrowthKnowledgeGraph flag gate", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("returns null when graph flag off", async () => {
    vi.stubEnv("FEATURE_GROWTH_KNOWLEDGE_GRAPH_V1", "");
    vi.resetModules();
    const { buildGrowthKnowledgeGraph } = await import("../growth-knowledge-graph.service");
    await expect(buildGrowthKnowledgeGraph()).resolves.toBeNull();
  });
});
