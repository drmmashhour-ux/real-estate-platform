import { describe, expect, it } from "vitest";
import { buildGrowthKnowledgeEdges } from "../growth-knowledge-graph-edges.service";
import { buildGrowthKnowledgeNodes } from "../growth-knowledge-graph-nodes.service";
import type { GrowthKnowledgeGraphBuildInput } from "../growth-knowledge-graph.types";

describe("buildGrowthKnowledgeEdges", () => {
  it("produces deterministic edges with rationales", () => {
    const input: GrowthKnowledgeGraphBuildInput = {
      memory: null,
      executive: {
        status: "healthy",
        topPriorities: [
          {
            id: "p1",
            title: "Scale acquisition traffic",
            source: "ads",
            impact: "high",
            confidence: 0.7,
            why: "w",
          },
        ],
        topRisks: [],
        campaignSummary: { totalCampaigns: 2, adsPerformance: "OK" },
        leadSummary: { totalLeads: 10, hotLeads: 1 },
        createdAt: "x",
      },
      governance: {
        status: "healthy",
        topRisks: [
          {
            id: "g1",
            category: "ads",
            severity: "high",
            title: "Policy risk on scaling",
            description: "d",
            reason: "r",
          },
        ],
        blockedDomains: [],
        frozenDomains: [],
        humanReviewItems: [],
        humanReviewQueue: [],
        notes: [],
        createdAt: "x",
      },
      strategyBundle: null,
      simulationBundle: null,
      autopilotActionTitles: [],
      adsBand: "OK",
      missingDataWarnings: [],
    };
    const nodes = buildGrowthKnowledgeNodes(input);
    const edges = buildGrowthKnowledgeEdges(nodes, input);
    expect(edges.every((e) => e.rationale.length > 0)).toBe(true);
    const g1 = edges.find((e) => e.type === "conflicts_with");
    expect(g1).toBeDefined();
  });
});
